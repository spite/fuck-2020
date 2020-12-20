const shader = `
precision highp float;

attribute vec3 position;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform mat4 modelMatrix;

uniform vec4 color;

varying float d;

void main() {
  d = abs((modelMatrix * vec4(position,1.)).z);
  gl_Position = projectionMatrix * modelViewMatrix * vec4( position, 1. );
}
`;

export { shader };
