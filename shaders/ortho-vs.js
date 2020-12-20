const shader = `
precision highp float;

attribute vec3 position;
attribute vec2 uv;

uniform vec2 resolution;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;

varying vec2 vUv;

void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
}
`;

export { shader };
