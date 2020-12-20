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
  CubeCamera,
  WebGLCubeRenderTarget,
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
import {
  NekoMaterial,
  generateParams as generateNekoParams,
} from "./neko-material.js";

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

varying vec2 vUv;

${chromaticAberration}
${vignette}

void main() {
  float amount = 0.2;
  vec4 c = chromaticAberration(inputTexture, vUv, amount);
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
    opacity: { value: 1 },
  },
  vertexShader: orthoVs,
  fragmentShader: finalFs,
});

class Effect extends glEffectBase {
  constructor(renderer, gui) {
    super(renderer);
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

    for (let i = 0; i < this.levels; i++) {
      const blurPass = new ShaderPingPongPass(this.renderer, blurShader, {
        format: RGBAFormat,
        type: canDoFloatLinear() ? FloatType : HalfFloatType,
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

    this.cubeRenderTarget = new WebGLCubeRenderTarget(1024, {
      format: RGBAFormat,
      type: canDoFloatLinear() ? FloatType : HalfFloatType,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
    });

    this.cubeCamera = new CubeCamera(0.1, 20, this.cubeRenderTarget);
    this.scene.add(this.cubeCamera);

    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(this.scene.position);

    const loader = new OBJLoader();
    loader.load("assets/cylinder.obj", (e) => {
      const mat = new MeshNormalMaterial({ side: DoubleSide });
      while (e.children.length) {
        const m = e.children[0];
        m.material = mat;
        this.scene.add(m);
      }
    });

    loader.load("assets/neko.obj", (e) => {
      this.pivot = new Group();
      this.pivot.position.set(-0.54326, 1.6598, 0);
      const cube = new Mesh(
        new BoxBufferGeometry(0.1, 0.1, 0.1),
        new MeshNormalMaterial({ depthTest: false })
      );
      this.pivot.add(cube);
      this.arm = e.children[0];
      this.arm.position.copy(this.pivot.position).multiplyScalar(-1);
      this.pivot.add(this.arm);
      this.body = e.children[0];
      this.scene.add(this.body);

      const mat = new NekoMaterial();
      generateNekoParams(this.gui, mat);
      this.body.material = mat;
      this.arm.material = mat;
      this.scene.add(this.pivot);

      this.body.castShadow = this.body.receiveShadow = true;
      this.arm.castShadow = this.arm.receiveShadow = true;

      // const width = 10;
      // const height = 10;
      // const intensity = 0.11;
      // const rectLight = new RectAreaLight(0xffffff, intensity, width, height);
      // rectLight.position.set(5, 5, 0);
      // rectLight.lookAt(0, 0, 0);
      // this.scene.add(rectLight);

      const pointLight = new PointLight(0xffffff);
      pointLight.position.set(-3, 1.5, -5);
      pointLight.castShadow = true;
      this.scene.add(pointLight);
      //window.light = pointLight;

      const pointLight2 = new PointLight(0xffffff);
      pointLight2.position.set(4.8, 3.8, 5.7);
      pointLight2.castShadow = true;
      this.scene.add(pointLight2);

      const spotLight = new SpotLight(0xffffff, 1, 0, 0.394, 0.88, 1);
      spotLight.position.set(5, 10, 7.5);
      spotLight.lookAt(this.scene.position);
      spotLight.castShadow = true;
      this.scene.add(spotLight);
      //const rectLightHelper = new RectAreaLightHelper(rectLight);
      //this.rectLight.add(rectLightHelper);

      const ambientLight = new AmbientLight(0xb53030, 0.16);
      this.scene.add(ambientLight);

      this.renderer.compile(this.scene, this.camera);
    });
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
    if (this.pivot) {
      this.pivot.rotation.x += 0.1;
    }
    // this.mesh.visible = false;
    // this.cubeCamera.update(this.renderer, this.scene);
    // this.mesh.visible = true;

    // this.renderer.render(this.scene, this.camera);
    // return;
    // this.mesh.rotation.x = t;
    // this.mesh.rotation.y = 0.8 * t;
    this.renderer.render(this.scene, this.camera);
    return;

    this.renderer.setRenderTarget(this.fbo);
    this.renderer.render(this.scene, this.camera);
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
