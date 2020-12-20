import { shader as FXAA } from "./fxaa.js";

const shader = `
precision highp float;

uniform sampler2D fbo;
uniform vec2 resolution;

varying vec2 vUv;
varying vec2 v_rgbNW;
varying vec2 v_rgbNE;
varying vec2 v_rgbSW;
varying vec2 v_rgbSE;
varying vec2 v_rgbM;

${FXAA}

void main() {
  vec2 uv2 = (vUv -.5 ) * .9 + .5;
  gl_FragColor = fxaa(fbo, uv2 * resolution, resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}
`;

export { shader };
