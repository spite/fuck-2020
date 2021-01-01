import {
  Mesh,
  ShapeBufferGeometry,
  DoubleSide,
  Scene,
  Group,
  OrthographicCamera,
  MeshBasicMaterial,
  PlaneBufferGeometry,
  sRGBEncoding,
  LinearMipmapLinearFilter,
  RawShaderMaterial,
  Color,
} from "../third_party/three.module.js";
import { loadTTF } from "../js/loader.js";
import { getFBO } from "../js/FBO.js";
import { settings } from "../js/settings.js";

import { shader as vertexShader } from "../shaders/ortho-vs.js";

const fragmentShader = `#version 300 es
precision highp float;

uniform sampler2D map;
uniform vec3 textColor;
uniform float opacity;

in vec2 vUv;

out vec4 color;

// https://www.shadertoy.com/view/XdfGDH


float normpdf(in float x, in float sigma){
	return 0.39894*exp(-0.5*x*x/(sigma*sigma))/sigma;
}

vec3 gaussianBlur(in sampler2D map, in vec2 uv) {
  vec2 resolution = vec2(textureSize(map, 0));
  vec2 fragCoord = uv * resolution;

  //declare stuff
  const int mSize = 11;
  const int kSize = (mSize-1)/2;
  float kernel[mSize];
  vec3 final_colour = vec3(0.0);
  
  //create the 1-D kernel
  float sigma = 7.0;
  float Z = 0.0;
  for (int j = 0; j <= kSize; ++j)
  {
    kernel[kSize+j] = kernel[kSize-j] = normpdf(float(j), sigma);
  }
  
  //get the normalization factor (as the gaussian has been clamped)
  for (int j = 0; j < mSize; ++j)
  {
    Z += kernel[j];
  }
  
  //read out the texels
  for (int i=-kSize; i <= kSize; ++i)
  {
    for (int j=-kSize; j <= kSize; ++j)
    {
      final_colour += kernel[kSize+j]*kernel[kSize+i]*texture(map, (fragCoord.xy+vec2(float(i),float(j))) / resolution.xy).rgb;
    }
  }
  return final_colour;
}
    
void main() {
  vec4 c = texture(map, vUv);
  float shadow = 4.*gaussianBlur(map, vUv).r;
  color = vec4(vec3(1.2*c.r)*textColor, 2.*shadow*opacity);
}`;

const fontMap = new Map();

loadTTF("assets/ultra.ttf", (font) => {
  fontMap.set("ultra", font);
});

loadTTF("assets/hand.ttf", (font) => {
  fontMap.set("hand", font);
});

const material = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });
const outMaterial = new MeshBasicMaterial({
  color: 0xffffff,
  transparent: true,
});

class Text extends Scene {
  constructor(fontName) {
    super();
    this.mesh = new Mesh(new PlaneBufferGeometry(1, 1), material);
    this.add(this.mesh);

    const w = 2048 * settings.textScale;
    const h = 512 * settings.textScale;
    const shadowMaterial = new RawShaderMaterial({
      uniforms: {
        map: { value: null },
        textColor: { value: new Color() },
        opacity: { value: 0 },
      },
      transparent: true,
      vertexShader,
      fragmentShader,
    });

    this.outMesh = new Group();
    this.outMesh.scale.setScalar(0.9);
    this.textMesh = new Mesh(new PlaneBufferGeometry(1, 1), outMaterial);
    this.shadowMesh = new Mesh(
      new PlaneBufferGeometry(
        w / (125 * settings.textScale),
        h / (125 * settings.textScale)
      ),
      shadowMaterial
    );
    this.shadowMesh.position.z = -0.1;
    this.outMesh.add(this.shadowMesh);

    this.font = null;
    this.fontName = fontName;

    this.renderTarget = getFBO(w, h, { minFilter: LinearMipmapLinearFilter });
    this.renderTarget.texture.encoding = sRGBEncoding;
    this.renderTarget.texture.generateMipmaps = true;
    this.camera = new OrthographicCamera(
      -16 / 2,
      16 / 2,
      4 / 2,
      -4 / 2,
      0.1,
      20
    );
    this.camera.position.z = 0.1;
    this.camera.lookAt(this.position);

    shadowMaterial.uniforms.map.value = this.renderTarget.texture;
  }

  setColor(color, opacity) {
    this.shadowMesh.material.uniforms.opacity.value = opacity;
    this.shadowMesh.material.uniforms.textColor.value.set(color);
  }

  render(renderer, text) {
    this.mesh.geometry.dispose();

    if (!this.font) {
      this.font = fontMap.get(this.fontName);
    }

    const shapes = this.font.generateShapes(text, 1);
    const geometry = new ShapeBufferGeometry(shapes);
    geometry.computeBoundingBox();
    geometry.needsUpdate = true;

    this.mesh.geometry = geometry;
    const w = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const h = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    this.mesh.position.x = -0.5 * w;
    this.mesh.position.y = -0.5 * h;

    this.textMesh.geometry = geometry;
    this.textMesh.position.x = -0.5 * w;
    this.textMesh.position.y = -0.5 * h;

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this, this.camera);
    renderer.setRenderTarget(null);
  }
}

export { Text };
