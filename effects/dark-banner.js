import {
  Mesh,
  PlaneBufferGeometry,
  RawShaderMaterial,
  DoubleSide,
  CylinderBufferGeometry,
} from "../third_party/three.module.js";
import { shader as vertexShader } from "../shaders/ortho-vs.js";

const fragmentShader = `#version 300 es
precision highp float;

uniform sampler2D text;

in vec2 vUv;

out vec4 color;

vec4 grid( in sampler2D map, in vec2 uv ) {
  vec2 res = vec2(1024.,256.);
  float spacing = 3.;
  vec2 nuv = floor(uv*res/spacing)*spacing/res;
  float s = texture(map, nuv).r;
  float w = 2.;
  float size = (spacing-w) * s;
  float blur = w * s;
  vec2 pos = mod(uv*vec2(1024.,256.), vec2(spacing)) - vec2(spacing/2.0);
  float dist_squared = dot(pos, pos);
  return 1.-vec4(smoothstep(size, size + blur, dist_squared));
}

void main() {
  vec4 grid = grid(text, vUv);
  color = grid;
}`;

const material = new RawShaderMaterial({
  uniforms: {
    text: { value: null },
  },
  transparent: true,
  depthWrite: false,
  side: DoubleSide,
  vertexShader,
  fragmentShader,
});

const r = 2048 / (2 * Math.PI) / 100;
const plane = new Mesh(
  //new PlaneBufferGeometry(2048 / 100, 512 / 100),
  new CylinderBufferGeometry(r, r, 512 / 100, 72, 1, true),
  material
);
//plane.position.z = 2;

export { plane };
