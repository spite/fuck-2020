import {
  Vector2,
  RepeatWrapping,
  TextureLoader,
  Color,
  sRGBEncoding,
  CubeTextureLoader,
  LinearEncoding,
  MeshStandardMaterial,
  RawShaderMaterial,
} from "../third_party/three.module.js";
import Maf from "../third_party/Maf.js";
import Easings from "../third_party/easings.js";
import { loadTexture } from "./loader.js";

const vertexShader = `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;

out vec4 vEyePosition;
out vec3 vPosition;
out vec4 vWorldPosition;
out vec2 vUv;
out vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vWorldPosition = modelMatrix * vec4(vPosition, 1. );
  vEyePosition = viewMatrix * vWorldPosition;
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * vEyePosition;
}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec4 vEyePosition;
in vec3 vPosition;
in vec4 vWorldPosition;
in float strength;
in vec3 vNormal;
in vec2 vUv;

uniform sampler2D text;
uniform float time;
uniform float distortion;

out vec4 color;

#define M_PI 3.1415926535897932384626433832795
#define M_TAU (2. * M_PI)


float aastep(float x, in vec2 uv) {
  float w = length(fwidth(uv));
  return smoothstep(.5-w,.5+w,x);
}

const float dotSpace = 2.0;
const float dotSize = 4.;

const float sinPer = 3.141592 / dotSpace;
const float frac = dotSize / dotSpace;

vec4 grid( in sampler2D map, in vec2 uv ) {
  vec2 res = vec2(1024.,256.);
  float spacing = 3.;
  vec2 nuv = floor(uv*res/spacing)*spacing/res;
  float s = 1.-texture(map, nuv).r;
  float w = 2.;
  float size = (spacing-w) * s;
  float blur = w * s;
  vec2 pos = mod(uv*vec2(1024.,256.), vec2(spacing)) - vec2(spacing/2.0);
  float dist_squared = dot(pos, pos);
  return 1.-vec4(smoothstep(size, size + blur, dist_squared));
}

void main() {
  float a = .5 + atan(vWorldPosition.z, vWorldPosition.x) / (2. * M_PI) + time;
  float h = .25 + (vWorldPosition.y+5.) / 30.;
  vec2 tUv = vec2(a,h) + distortion*vNormal.xy;
//  vec4 t = 1.-texture(text, tUv, 4.);

  vec4 grid = grid(text, tUv);
  color = grid;//vec4(vec3(aastep(t.r, vUv)), 1.);//t;//vec4(1.);
}
`;

const text = loadTexture("./assets/text.png");
text.wrapS = text.wrapT = RepeatWrapping;

class CylinderMaterial extends RawShaderMaterial {
  constructor() {
    super({
      uniforms: {
        text: { value: text },
        time: { value: 0 },
        distortion: { value: 0.05 },
      },
      vertexShader,
      fragmentShader,
    });
  }
}

export { CylinderMaterial };
