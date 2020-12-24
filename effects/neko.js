import { glEffectBase } from "../js/glEffectBase.js";
import {
  PointLight,
  Mesh,
  MeshStandardMaterial,
  Vector2,
  Object3D,
  Matrix4,
  CylinderBufferGeometry,
  BoxBufferGeometry,
  BufferAttribute,
  MeshNormalMaterial,
  RawShaderMaterial,
  Vector3,
  Vector4,
  MeshBasicMaterial,
  IcosahedronBufferGeometry,
  RectAreaLight,
  ClampToEdgeWrapping,
  RepeatWrapping,
  TextureLoader,
  Group,
  RGBAFormat,
  LinearMipmapLinearFilter,
  TorusBufferGeometry,
  Color,
  FloatType,
  HalfFloatType,
  UnsignedByteType,
  SpotLight,
  AmbientLight,
  sRGBEncoding,
  CubeTextureLoader,
  LinearEncoding,
  DoubleSide,
} from "../third_party/three.module.js";
import { ShaderPass } from "../js/ShaderPass.js";
import { ShaderPingPongPass } from "../js/ShaderPingPongPass.js";
import { shader as vertexShader } from "../shaders/ortho-vs.js";
import Maf from "../third_party/Maf.js";
import { settings } from "../js/settings.js";
import { canDoFloatLinear } from "../js/features.js";
import { OBJLoader } from "../third_party/OBJLoader.js";

import { shader as geoVs } from "../shaders/sdf-geo-vs.js";
import { shader as geoFs } from "../shaders/sdf-geo-fs.js";

import { shader as neonVs } from "../shaders/neon-vs.js";
import { shader as neonFs } from "../shaders/neon-fs.js";

import { shader as orthoVs } from "../shaders/ortho-vs.js";
import { shader as highlightFs } from "../shaders/highlight-fs.js";
import { shader as blurFs } from "../shaders/blur-fs.js";
import { screen } from "../shaders/screen.js";
import { chromaticAberration } from "../shaders/chromatic-aberration.js";
import { vignette } from "../shaders/vignette.js";

import { initHdrEnv, scene as lightScene } from "./light-scene.js";
import { scene as darkScene, updateEnv, setDistortion } from "./dark-scene.js";

const blurShader = new RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    resolution: { value: new Vector2(1, 1) },
    direction: { value: new Vector2(0, 1) },
  },
  vertexShader: orthoVs,
  fragmentShader: blurFs,
});

const highlightShader = new RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    resolution: { value: new Vector2(1, 1) },
    direction: { value: new Vector2(0, 1) },
  },
  vertexShader: orthoVs,
  fragmentShader: highlightFs,
});

const fragmentShader = `
precision highp float;

uniform sampler2D fbo;

uniform sampler2D blur0Tex;
uniform sampler2D blur1Tex;
uniform sampler2D blur2Tex;
uniform sampler2D blur3Tex;
uniform sampler2D blur4Tex;

uniform float radius;
uniform float strength;
uniform float exposure;

varying vec2 vUv;

float lerpBloomFactor(float v) {
  return mix(v, 1.2 - v, radius);
}

${screen}

void main() {
  vec4 c = texture2D(fbo, vUv);

  vec4 bloom = vec4(0.);
  bloom += lerpBloomFactor(1.) * texture2D( blur0Tex, vUv );
  bloom += lerpBloomFactor(.8) * texture2D( blur1Tex, vUv );
  bloom += lerpBloomFactor(.6) * texture2D( blur2Tex, vUv );
  bloom += lerpBloomFactor(.4) * texture2D( blur3Tex, vUv );
  bloom += lerpBloomFactor(.2) * texture2D( blur4Tex, vUv );

  gl_FragColor = screen(c,bloom, exposure);//screen(clamp(c, vec4(0.), vec4(1.)), clamp(bloom, vec4(0.), vec4(1.)), exposure);
}
`;

const finalFs = `
precision highp float;

uniform sampler2D inputTexture;
uniform float opacity;
uniform float aberration;

varying vec2 vUv;

${chromaticAberration}
${vignette}

void main() {
  vec4 c = chromaticAberration(inputTexture, vUv, aberration);
  c *= opacity * vignette(vUv, 1.5 * opacity, (1.-opacity)*4.);
  gl_FragColor = c;
}
`;

const shader = new RawShaderMaterial({
  uniforms: {
    fbo: { value: null },
    blur0Tex: { value: null },
    blur1Tex: { value: null },
    blur2Tex: { value: null },
    blur3Tex: { value: null },
    blur4Tex: { value: null },
    resolution: { value: new Vector2(1, 1) },
    radius: { value: 1 },
    strength: { value: 1 },
    exposure: { value: 0 },
  },
  vertexShader,
  fragmentShader,
});

const finalShader = new RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    aberration: { value: 1 },
    opacity: { value: 1 },
  },
  vertexShader: orthoVs,
  fragmentShader: finalFs,
});

class Effect extends glEffectBase {
  constructor(renderer, gui) {
    super(renderer);

    this.badness = 0;
    this.distortion = 0;

    this.gui = gui;
    this.post = new ShaderPass(this.renderer, finalShader);
    this.final = new ShaderPass(this.renderer, shader);
    this.post.shader.uniforms.inputTexture.value = this.final.fbo.texture;

    this.highlight = new ShaderPass(this.renderer, highlightShader);
    shader.uniforms.fbo.value = this.fbo.texture;
    highlightShader.uniforms.inputTexture.value = this.fbo.texture;

    this.blurStrength = 1;
    this.blurPasses = [];
    this.levels = 5;

    initHdrEnv(renderer);

    for (let i = 0; i < this.levels; i++) {
      const blurPass = new ShaderPingPongPass(this.renderer, blurShader, {
        format: RGBAFormat,
        //type: canDoFloatLinear() ? FloatType : HalfFloatType,
      });
      this.blurPasses.push(blurPass);
    }
    shader.uniforms.blur0Tex.value = this.blurPasses[0].fbo.texture;
    shader.uniforms.blur1Tex.value = this.blurPasses[1].fbo.texture;
    shader.uniforms.blur2Tex.value = this.blurPasses[2].fbo.texture;
    shader.uniforms.blur3Tex.value = this.blurPasses[3].fbo.texture;
    shader.uniforms.blur4Tex.value = this.blurPasses[4].fbo.texture;
  }

  async initialise() {
    super.initialise();

    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(this.scene.position);

    this.renderer.compile(this.scene, this.camera);
  }

  setSize(w, h) {
    super.setSize(w, h);
    this.post.setSize(w, h);
    this.final.setSize(w, h);
    this.highlight.setSize(w, h);
    shader.uniforms.resolution.value.set(w, h);
    blurShader.uniforms.resolution.value.set(w, h);
    highlightShader.uniforms.resolution.value.set(w, h);

    let tw = w;
    let th = h;
    for (let i = 0; i < this.levels; i++) {
      tw /= 2;
      th /= 2;
      tw = Math.round(tw);
      th = Math.round(th);
      this.blurPasses[i].setSize(tw, th);
    }
  }

  render(t) {
    // for (const obj of this.cylinder.children) {
    //   //obj.rotation.z = performance.now() / 10000;
    // }
    // this.cylinder.rotation.y = 0.00005 * performance.now();
    // this.cylinderMat.uniforms.time.value = 0.00005 * performance.now();
    // if (this.pivot) {
    //   this.pivot.rotation.x += 0.1;
    // }

    // this.renderer.render(lightScene, this.camera);
    // return;
    //this.mesh.rotation.x = t;
    // this.mesh.rotation.y = 0.8 * t;
    // this.renderer.render(this.scene, this.camera);
    // return;

    setDistortion(this.distortion);
    updateEnv(this.renderer);

    this.renderer.setRenderTarget(this.fbo);
    if (this.badness < 0.5) {
      this.renderer.render(lightScene, this.camera);
    } else {
      this.renderer.render(darkScene, this.camera);
    }
    this.renderer.setRenderTarget(null);

    this.highlight.render();

    let offset = this.blurStrength;
    blurShader.uniforms.inputTexture.value = this.highlight.fbo.texture;
    for (let j = 0; j < this.levels; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      const blurPass = this.blurPasses[j];
      const w = blurPass.fbo.width;
      const h = blurPass.fbo.height;
      blurShader.uniforms.resolution.value.set(w, h);
      blurPass.render();
      blurShader.uniforms.inputTexture.value =
        blurPass.fbos[blurPass.currentFBO].texture;
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass.render();
      blurShader.uniforms.inputTexture.value =
        blurPass.fbos[blurPass.currentFBO].texture;
    }

    this.final.render();
    this.post.render();
  }
}

export { Effect };
