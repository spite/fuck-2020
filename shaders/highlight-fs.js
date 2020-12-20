const shader = `
precision highp float;

uniform vec2 resolution;
uniform sampler2D inputTexture;
uniform vec2 direction;

varying vec2 vUv;

void main() {
  vec4 c = texture2D(inputTexture, vUv);
  c.rgb *=  c.a;//clamp(c.rgb - reduction, vec3(0.), vec3(1.)) / reduction;
  c.a = 1.;
  gl_FragColor = c;
}`;

export { shader };
