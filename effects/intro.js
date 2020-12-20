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
} from "../third_party/three.module.js";
import { ShaderPass } from "../js/ShaderPass.js";
import { ShaderPingPongPass } from "../js/ShaderPingPongPass.js";
import { shader as vertexShader } from "../shaders/ortho-vs.js";
import Maf from "../third_party/Maf.js";
import { settings } from "../js/settings.js";
import { canDoFloatLinear } from "../js/features.js";

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

  gl_FragColor = screen(clamp(c, vec4(0.), vec4(1.)), clamp(bloom, vec4(0.), vec4(1.)), exposure);
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

const concrete = {
  diffuse: "Concrete_011_COLOR.jpg",
  normal: "Concrete_011_NORM.jpg",
  specular: "Concrete_011_ROUGH.jpg",
};

const water = {
  diffuse: "water-diffuse.png",
  normal: "water-normal.png",
  specular: "water-specular.png",
};

const slate = {
  diffuse: "slate-diffuse.png",
  normal: "slate-normal.png",
  specular: "slate-specular.png",
};

const groundWet = {
  diffuse: "ground_wet_003_basecolor.jpg",
  normal: "ground_wet_003_normal.jpg",
  specular: "ground_wet_003_roughness.jpg",
};

const scrap = {
  diffuse: "scrap-diffuse.png",
  normal: "scrap-normal.png",
  specular: "scrap-specular.png",
};
const mat = water; //concrete; //scrap;

const loader = new TextureLoader();
const diffuse = loader.load(`./assets/${mat.diffuse}`);
const normal = loader.load(`./assets/${mat.normal}`);
const specular = loader.load(`./assets/${mat.specular}`);

diffuse.wrapS = diffuse.wrapT = RepeatWrapping;
normal.wrapS = normal.wrapT = RepeatWrapping;
specular.wrapS = specular.wrapT = RepeatWrapping;

class Effect extends glEffectBase {
  constructor(renderer) {
    super(renderer);
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

    this.ring1 = new Group();
    const geo = new CylinderBufferGeometry(1, 1, 1, 16).rotateX(-Math.PI / 2);
    for (let j = 0; j < 100; j++) {
      const hsl = new Color().setHSL(
        Math.random() * 0.5,
        0.75,
        Math.random() * 0.5 + 0.5
      );
      const color = new Vector4(hsl.r, hsl.g, hsl.b, Maf.randomInRange(2, 4));
      // color.g = color.b = 0;
      const mat = new RawShaderMaterial({
        uniforms: { color: { value: color }, range: { value: 0 } },
        vertexShader: neonVs,
        fragmentShader: neonFs,
      });
      const h = Maf.randomInRange(0.1, 10);
      const s = Maf.randomInRange(0.01, 0.075);
      const mesh = new Mesh(geo, mat);

      const a = Maf.randomInRange(0, Maf.TAU);
      const r = Maf.randomInRange(2, 8);
      mesh.position.x = r * Math.cos(a);
      mesh.position.y = r * Math.sin(a);
      mesh.position.z = Maf.randomInRange(-50, 50);
      mesh.rotation.z = Math.random();
      mesh.scale.x = s;
      mesh.scale.y = s;
      mesh.scale.z = h;
      mesh.userData.offset = Maf.randomInRange(0, 1);
      mesh.userData.factor = Maf.randomInRange(0.5, 1.5);
      this.ring1.add(mesh);
    }
    this.scene.add(this.ring1);

    this.ring2 = new Group();
    for (let j = 0; j < 2; j++) {
      const color = new Vector4(
        Maf.randomInRange(0.5, 1),
        Maf.randomInRange(0.5, 1),
        Maf.randomInRange(0.5, 1),
        Maf.randomInRange(2, 4)
      );
      // color.g = color.b = 0;
      const mat = new RawShaderMaterial({
        uniforms: { color: { value: color }, range: { value: 0 } },
        vertexShader: neonVs,
        fragmentShader: neonFs,
      });
      const r = Maf.randomInRange(10, 20);
      const r2 = Maf.randomInRange(0.5, 1.5);
      const geo = new TorusBufferGeometry(r, r2, 3, 5);
      const mesh = new Mesh(geo, mat);
      mesh.position.x = 0;
      mesh.position.y = 0;
      mesh.position.z = Maf.randomInRange(-50, 50);
      mesh.userData.offset = Maf.randomInRange(0, 1);
      mesh.userData.factor = Maf.randomInRange(0.5, 1.5);
      this.ring2.add(mesh);
    }
    this.scene.add(this.ring2);

    this.cubeRenderTarget = new WebGLCubeRenderTarget(1024, {
      format: RGBAFormat,
      type: canDoFloatLinear() ? FloatType : HalfFloatType,
      generateMipmaps: true,
      minFilter: LinearMipmapLinearFilter,
    });

    this.cubeCamera = new CubeCamera(0.1, 20, this.cubeRenderTarget);
    this.scene.add(this.cubeCamera);

    this.geoShader = new RawShaderMaterial({
      uniforms: {
        time: { value: 0 },
        envMap: { value: this.cubeRenderTarget.texture },
        textureMap: { value: diffuse },
        normalMap: { value: normal },
        specularMap: { value: specular },

        smoothness: { value: 0.05 },
        twistX: { value: 0 },
        twistY: { value: 0 },
        twistZ: { value: 0 },
        tetrahedronFactor: { value: 0 },
        cubeFactor: { value: 0 },
        octahedronFactor: { value: 0 },
        dodecahedronFactor: { value: 0 },
        icosahedronFactor: { value: 0 },
        sphereFactor: { value: 0 },

        exposureDiffuse: { value: 0.5 }, // Exposure of diffuse lighting.
        exposureSpecular: { value: 0.5 }, // Exposure of specular lighting.
        roughness: { value: 2 }, // Roughness (bias of texture lookup)
        normalScale: { value: 0.5 }, // Normal mapping scale.
        texScale: { value: 2 }, // Triplanar mapping scale.
        stripeFreq: { value: 10 }, // Vertical frequency of stripes.
        stripeOffset: { value: Math.PI / 2 }, // Radians.
        stripeColor: { value: new Vector4(0, 0.1, 0.1, 0.1) }, // R G B Intensity
        baseColor: { value: new Vector4(1, 0, 0, 0) }, // R G B Intensity
        ambientColor: { value: new Vector4(0.1, 0.1, 0.1, 0) }, // R G B Intensity
      },
      vertexShader: geoVs,
      fragmentShader: geoFs,
      wireframe: !true,
    });

    const geometry = new IcosahedronBufferGeometry(4, settings.tessellation);
    this.mesh = new Mesh(geometry, this.geoShader);
    this.scene.add(this.mesh);

    const box = new Mesh(
      geometry.clone(),
      new MeshNormalMaterial({ opacity: 0.5, transparent: true })
    );
    //this.scene.add(box);

    this.camera.position.set(4, 4, 4);
    this.camera.lookAt(box.position);

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
    const speed = 10;
    const spread = 50;
    for (const m of this.ring1.children) {
      m.material.uniforms.range.value = spread / 2;
      m.position.z =
        ((m.userData.offset * spread + speed * m.userData.factor * t) %
          spread) -
        spread / 2;
    }
    for (const m of this.ring2.children) {
      m.material.uniforms.range.value = spread / 2;
      m.position.z =
        ((m.userData.offset * spread + speed * m.userData.factor * t) %
          spread) -
        spread / 2;
    }
    this.mesh.visible = false;
    this.cubeCamera.update(this.renderer, this.scene);
    this.mesh.visible = true;

    this.mesh.rotation.x = t;
    this.mesh.rotation.y = 0.8 * t;
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
