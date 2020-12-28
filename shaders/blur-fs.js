import { blur5, blur9, blur13 } from "./fast-separable-gaussian-blur.js";
import { settings } from "../js/settings.js";

let blurFn = blur13;
let blurCall = "blur13";
if (settings.blur === 5) {
  blurFn = blur5;
  blurCall = "blur5";
}
if (settings.blur === 9) {
  blurFn = blur9;
  blurCall = "blur9";
}

const shader = `#version 300 es
precision highp float;

uniform sampler2D inputTexture;
uniform vec2 direction;

in vec2 vUv;

out vec4 color;

${blurFn}

void main() {
  color = ${blurCall}(inputTexture, vUv, direction);
}`;

export { shader };
