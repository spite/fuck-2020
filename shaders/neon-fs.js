const shader = `
precision highp float;

uniform vec4 color;
uniform float range;

varying float d;

void main() {
  float a = 1. - d / range;
  a = (exp(a)-1.)/(exp(1.)-1.);
  a = (exp(a)-1.)/(exp(1.)-1.);
  gl_FragColor = color;
  gl_FragColor.rgb *= a;
}
`;

export { shader };
