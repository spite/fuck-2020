import { glEffectBase } from "../js/glEffectBase.js";
import {
  Vector2,
  RawShaderMaterial,
  RGBAFormat,
  sRGBEncoding,
} from "../third_party/three.module.js";
import { ShaderPass } from "../js/ShaderPass.js";
import { ShaderPingPongPass } from "../js/ShaderPingPongPass.js";
import { shader as vertexShader } from "../shaders/ortho-vs.js";
import Maf from "../third_party/Maf.js";
import { settings } from "../js/settings.js";
import { canDoFloatLinear } from "../js/features.js";

import { shader as orthoVs } from "../shaders/ortho-vs.js";
import { shader as highlightFs } from "../shaders/highlight-fs.js";
import { shader as blurFs } from "../shaders/blur-fs.js";
import { screen } from "../shaders/screen.js";
import { chromaticAberration } from "../shaders/chromatic-aberration.js";
import { vignette } from "../shaders/vignette.js";
import { loadTexture } from "../js/loader.js";

import {
  initHdrEnv,
  scene as lightScene,
  update as updateLightScene,
  init as initLightScene,
} from "./light-scene.js";
import {
  render as renderDarkScene,
  updateEnv,
  setSize as setDarkSize,
  setDistortion,
  setExplosion,
  setText,
  init as initDarkScene,
  update as updateDarkScene,
} from "./dark-scene.js";

const blurShader = new RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    direction: { value: new Vector2(0, 1) },
  },
  vertexShader: orthoVs,
  fragmentShader: blurFs,
});

const highlightShader = new RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    direction: { value: new Vector2(0, 1) },
  },
  vertexShader: orthoVs,
  fragmentShader: highlightFs,
});

const fragmentShader = `#version 300 es
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

in vec2 vUv;

out vec4 color;

float lerpBloomFactor(float v) {
  return mix(v, 1.2 - v, radius);
}

${screen}

void main() {
  vec4 c = texture(fbo, vUv);

  vec4 bloom = vec4(0.);
  bloom += lerpBloomFactor(1.) * texture( blur0Tex, vUv );
  bloom += lerpBloomFactor(.8) * texture( blur1Tex, vUv );
  bloom += lerpBloomFactor(.6) * texture( blur2Tex, vUv );
  bloom += lerpBloomFactor(.4) * texture( blur3Tex, vUv );
  bloom += lerpBloomFactor(.2) * texture( blur4Tex, vUv );

  color = screen(c, bloom, exposure);//screen(clamp(c, vec4(0.), vec4(1.)), clamp(bloom, vec4(0.), vec4(1.)), exposure);
}
`;

const finalFs = `#version 300 es
precision highp float;

uniform sampler2D inputTexture;
uniform float opacity;
uniform float aberration;
uniform sampler2D crackMap;
uniform float white;

in vec2 vUv;

out vec4 color;

${chromaticAberration}
${vignette}

void main() {
  vec2 dir = vec2(0.);// (texture(crackMap, vUv).xy -.5)/10.;
  vec4 c = chromaticAberration(inputTexture, vUv, aberration, dir);
  //c *= opacity * vignette(vUv, 1.5 * opacity, (1.-opacity)*4.);
  c += white;
  color = c;
}
`;

// https://github.com/felixturner/bad-tv-shader/blob/master/BadTVShader.js

const glitchFs = `#version 300 es
precision highp float;

uniform sampler2D inputTexture;
uniform float amount;
uniform float amount2;
uniform float time;
uniform float distortion;
uniform float distortion2;
uniform float speed;
uniform float rollSpeed;

in vec2 vUv;

out vec4 color;

// Start Ashima 2D Simplex Noise

vec3 mod289(vec3 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec2 mod289(vec2 x) {
  return x - floor(x * (1.0 / 289.0)) * 289.0;
}

vec3 permute(vec3 x) {
  return mod289(((x*34.0)+1.0)*x);
}

float snoise(vec2 v) {
  const vec4 C = vec4(0.211324865405187,  // (3.0-sqrt(3.0))/6.0
                      0.366025403784439,  // 0.5*(sqrt(3.0)-1.0)
                     -0.577350269189626,  // -1.0 + 2.0 * C.x
                      0.024390243902439); // 1.0 / 41.0
  vec2 i  = floor(v + dot(v, C.yy) );
  vec2 x0 = v -   i + dot(i, C.xx);

  vec2 i1;
  i1 = (x0.x > x0.y) ? vec2(1.0, 0.0) : vec2(0.0, 1.0);
  vec4 x12 = x0.xyxy + C.xxzz;
  x12.xy -= i1;

  i = mod289(i); // Avoid truncation effects in permutation
  vec3 p = permute( permute( i.y + vec3(0.0, i1.y, 1.0 ))
		+ i.x + vec3(0.0, i1.x, 1.0 ));

  vec3 m = max(0.5 - vec3(dot(x0,x0), dot(x12.xy,x12.xy), dot(x12.zw,x12.zw)), 0.0);
  m = m*m ;
  m = m*m ;

  vec3 x = 2.0 * fract(p * C.www) - 1.0;
  vec3 h = abs(x) - 0.5;
  vec3 ox = floor(x + 0.5);
  vec3 a0 = x - ox;

  m *= 1.79284291400159 - 0.85373472095314 * ( a0*a0 + h*h );

  vec3 g;
  g.x  = a0.x  * x0.x  + h.x  * x0.y;
  g.yz = a0.yz * x12.xz + h.yz * x12.yw;
  return 130.0 * dot(m, g);
}

// End Ashima 2D Simplex Noise

vec2 tvGlitch(in vec2 uv, in float time, in float speed, in float distortion, in float distortion2, in float rollSpeed ) {
  vec2 p = vUv;
  float ty = time*speed;
  float yt = p.y - ty;
  //smooth distortion
  float offset = snoise(vec2(yt*3.0,0.0))*0.2;
  // boost distortion
  offset = offset*distortion * offset*distortion * offset;
  //add fine grain distortion
  offset += snoise(vec2(yt*50.0,0.0))*distortion2*0.001;
  //combine distortion on X with roll on Y
  return vec2(fract(p.x + offset),fract(p.y-time*rollSpeed) );
}

// https://www.shadertoy.com/view/tsX3RN

float maxStrength = 0.65;
float minStrength = 0.45;
float staticSpeed = 10.00;

float random (vec2 noise){
  return fract(sin(dot(noise.xy,vec2(10.998,98.233)))*12433.14159265359);
}

float noise(in vec2 uv, in float time) {
  vec2 resolution = vec2(textureSize(inputTexture,0));
  vec2 uv2 = fract(uv*fract(sin(time*staticSpeed)));
  
  maxStrength = clamp(sin(time/2.0),minStrength,maxStrength);
  return random(uv2.xy)*maxStrength;
}

// https://www.shadertoy.com/view/MscGzl

vec4 posterize(vec4 color, float numColors) {
  return floor(color * numColors - 0.5) / numColors;
}

vec2 quantize(vec2 v, float steps) {
  return floor(v * steps) / steps;
}

float dist(vec2 a, vec2 b) {
  return sqrt(pow(b.x - a.x, 2.0) + pow(b.y - a.y, 2.0));
}

vec4 glitch2(in sampler2D map, in vec2 uv, in float time, in float amount) {   
  vec2 resolution = vec2(textureSize(map, 0));
  vec2 pixel = 1.0 / resolution.xy;    
  vec4 color = texture(map, uv);
  float t = mod(mod(time, amount * 100.0 * (amount - 0.5)) * 109.0, 1.0);
  vec4 postColor = posterize(color, 16.0);
  vec4 a = posterize(texture(map, quantize(uv, 64.0 * t) + pixel * (postColor.rb - vec2(.5)) * 100.0), 5.0).rbga;
  vec4 b = posterize(texture(map, quantize(uv, 32.0 - t) + pixel * (postColor.rg - vec2(.5)) * 1000.0), 4.0).gbra;
  vec4 c = posterize(texture(map, quantize(uv, 16.0 + t) + pixel * (postColor.rg - vec2(.5)) * 20.0), 16.0).bgra;
  return texture(map, uv + amount * (quantize((a * t - b + c - (t + t / 2.0) / 10.0).rg, 16.0) - vec2(.5)) * pixel * 100.0);            
}

void main() {
  float n = noise(100.*vUv, time/100.);
  n = .5 + .5 * mix(1., smoothstep(0., maxStrength, n), amount2);
  vec2 uv = mix(tvGlitch(vUv, time, speed, distortion, distortion2, rollSpeed), vUv, amount2);
  if(amount==0.){
    color = texture(inputTexture, uv);
  }else {
    color = glitch2(inputTexture, uv, time, amount);// * vec4(n);
  }
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
    radius: { value: 1 },
    strength: { value: 1 },
    exposure: { value: 0 },
  },
  vertexShader,
  fragmentShader,
});

const glitchShader = new RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    time: { value: 0 },
    amount: { value: 0 },
    amount2: { value: 0 },
    speed: { value: 0.2 },
    rollSpeed: { value: 0 },
    distortion: { value: 0 },
    distortion2: { value: 0 },
  },
  vertexShader: orthoVs,
  fragmentShader: glitchFs,
});

const finalShader = new RawShaderMaterial({
  uniforms: {
    inputTexture: { value: null },
    aberration: { value: 1 },
    opacity: { value: 1 },
    white: { value: 0 },
    crackMap: { value: loadTexture("assets/NormalMap.png") },
  },
  vertexShader: orthoVs,
  fragmentShader: finalFs,
});

class Effect extends glEffectBase {
  constructor(renderer, gui) {
    super(renderer);

    this.badness = 0;
    this.distortion = 0;
    this.explosion = 0;
    this.glitchAmount = 0;
    this.glitch2Amount = 0;
    this.fucking = { text: "", color: 0, opacity: 0 };

    this.gui = gui;
    this.post = new ShaderPass(this.renderer, finalShader);
    this.post.fbo.texture.encoding = sRGBEncoding;
    this.glitch = new ShaderPass(this.renderer, glitchShader);
    this.glitch.fbo.texture.encoding = sRGBEncoding;
    this.final = new ShaderPass(this.renderer, shader);
    this.final.fbo.texture.encoding = sRGBEncoding;
    this.post.shader.uniforms.inputTexture.value = this.final.fbo.texture;

    glitchShader.uniforms.inputTexture.value = this.fbo.texture;
    this.highlight = new ShaderPass(this.renderer, highlightShader);
    this.highlight.fbo.texture.encoding = sRGBEncoding;
    shader.uniforms.fbo.value = this.glitch.fbo.texture;
    highlightShader.uniforms.inputTexture.value = this.glitch.fbo.texture;

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

    initLightScene(this.renderer, this.camera);
    initDarkScene(this.renderer, this.camera);

    this.badness = 0;
    this.render(0, this.camera);
    this.badness = 1;
    this.render(1, this.camera);
  }

  setSize(w, h) {
    super.setSize(w, h);
    this.post.setSize(w, h);
    this.final.setSize(w, h);
    this.highlight.setSize(w, h);
    this.glitch.setSize(w, h);
    setDarkSize(w, h);

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

  updateGlitch() {
    const t = 0.001 * performance.now();
    this.glitch.shader.uniforms.time.value = t;
    this.glitch.shader.uniforms.amount.value = this.glitchAmount;
    this.glitch.shader.uniforms.amount2.value = this.glitch2Amount;
    this.glitch.shader.uniforms.speed.value = this.glitch2Amount * 1;
    this.glitch.shader.uniforms.rollSpeed.value =
      (0.5 + 0.5 * Math.sin(this.glitch2Amount * t)) * this.glitch2Amount * 10;
    this.glitch.shader.uniforms.distortion.value = this.glitch2Amount * 4;
    this.glitch.shader.uniforms.distortion2.value = this.glitch2Amount * 6;
  }

  render(t, camera) {
    if (this.badness >= 0.5) {
      updateDarkScene(t);
      setText(
        this.renderer,
        this.fucking.text,
        this.fucking.color,
        this.fucking.opacity
      );
      setDistortion(this.distortion);
      setExplosion(this.explosion);
      updateEnv(this.renderer);
    } else {
      updateLightScene(t);
    }

    this.updateGlitch(this.glitchAmount);

    this.renderer.setRenderTarget(this.fbo);
    if (this.badness < 0.5) {
      this.renderer.render(lightScene, camera);
    } else {
      renderDarkScene(t, this.renderer, camera);
    }
    this.renderer.setRenderTarget(null);

    this.glitch.render();
    this.highlight.render();

    let offset = this.blurStrength;
    blurShader.uniforms.inputTexture.value = this.highlight.fbo.texture;
    for (let j = 0; j < this.levels; j++) {
      blurShader.uniforms.direction.value.set(offset, 0);
      const blurPass = this.blurPasses[j];
      blurPass.render();
      blurShader.uniforms.inputTexture.value =
        blurPass.fbos[blurPass.currentFBO].texture;
      blurShader.uniforms.direction.value.set(0, offset);
      blurPass.render();
      blurShader.uniforms.inputTexture.value =
        blurPass.fbos[blurPass.currentFBO].texture;
    }

    this.final.render();
    this.post.render(true);
  }
}

export { Effect };
