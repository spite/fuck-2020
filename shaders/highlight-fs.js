const shader = `#version 300 es
precision highp float;

uniform sampler2D inputTexture;
uniform vec2 direction;

in vec2 vUv;

out vec4 color;

void main() {
  vec4 c = texture(inputTexture, vUv);
  c.rgb *=  c.a;//clamp(c.rgb - reduction, vec3(0.), vec3(1.)) / reduction;
  c.a = 1.;
  vec3 luma = vec3(0.299, 0.587, 0.114);
  float l = dot(c.rgb, luma);
  float reduction = .75;
  float boost = 4.;
  l = boost*clamp(l-reduction, 0., 1.)/(1.-reduction);
  color = c * l;
}`;

export { shader };
