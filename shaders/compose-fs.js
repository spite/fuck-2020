import { shader as FXAA } from "./fxaa.js";

const shader = `#version 300 es
precision highp float;

uniform sampler2D fbo;

in vec2 vUv;
in vec2 v_rgbNW;
in vec2 v_rgbNE;
in vec2 v_rgbSW;
in vec2 v_rgbSE;
in vec2 v_rgbM;

out vec4 color;

${FXAA}

void main() {
  vec2 uv2 = (vUv -.5 ) * .9 + .5;
  vec2 resolution = vec2(textureSize(fbo,0));
  color = fxaa(fbo, uv2 * resolution, v_rgbNW, v_rgbNE, v_rgbSW, v_rgbSE, v_rgbM);
}
`;

export { shader };
