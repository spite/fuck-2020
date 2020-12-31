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
  RawShaderMaterial,
  Color,
} from "../third_party/three.module.js";
import { loadTTF } from "../js/loader.js";
import { getFBO } from "../js/FBO.js";
import { SVGLoader } from "../third_party/SVGLoader.js";
import Easings from "../third_party/easings.js";

import { shader as vertexShader } from "../shaders/ortho-vs.js";
import { blur5 } from "../shaders/fast-separable-gaussian-blur.js";

const fragmentShader = `#version 300 es
precision highp float;

uniform sampler2D map;
uniform vec3 textColor;
uniform float opacity;

in vec2 vUv;

out vec4 color;

${blur5}

void main() {
  vec4 c = texture(map, vUv);
  vec4 s1 = blur5(map, vUv, vec2(4.,0.));
  vec4 s2 = blur5(map, vUv, vec2(0.,4.));
  vec4 s3 = blur5(map, vUv, vec2(8.,0.));
  vec4 s4 = blur5(map, vUv, vec2(0.,8.));
  float shadow = (s1.r+s2.r+s3.r+s4.r)/4.;
  color = vec4(vec3(2.*c.r)*textColor, 2.*shadow*opacity);
}`;

const fontMap = new Map();

loadTTF("assets/ultra.ttf", (font) => {
  fontMap.set("ultra", font);
});

// loadTTF("assets/bellota.ttf", (font) => {
//   fontMap.set("bellota", font);
// });

const material = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });
const outMaterial = new MeshBasicMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  transparent: true,
});

class Text extends Scene {
  constructor(fontName) {
    super();
    this.mesh = new Mesh(new PlaneBufferGeometry(1, 1), material);
    this.add(this.mesh);

    const w = 2048;
    const h = 512;
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
      new PlaneBufferGeometry(w / 125, h / 125),
      shadowMaterial
    );
    this.shadowMesh.position.z = -0.1;
    this.strokeText = new Group();
    this.outMesh.add(this.strokeText);
    this.outMesh.add(this.shadowMesh);
    // this.outMesh.add(this.textMesh);
    this.strokeText.position.z = -0.1;

    this.font = null;
    this.fontName = fontName;

    this.renderTarget = getFBO(w, h);
    this.renderTarget.texture.encoding = sRGBEncoding;
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
    this.textMesh.position.x = -0.5 * w; // * this.outMesh.scale.x;
    this.textMesh.position.y = -0.5 * h; //* this.outMesh.scale.y;

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this, this.camera);
    renderer.setRenderTarget(null);
  }
}

export { Text };
