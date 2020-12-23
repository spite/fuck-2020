const shader = `
precision highp float;

uniform vec2 resolution;
uniform sampler2D inputTexture;
uniform vec2 direction;

varying vec2 vUv;

void main() {
  vec4 c = texture2D(inputTexture, vUv);
  // c.rgb *=  c.a;//clamp(c.rgb - reduction, vec3(0.), vec3(1.)) / reduction;
  // c.a = 1.;
  vec3 luma = vec3(0.299, 0.587, 0.114);
  float l = dot(c.rgb, luma);
  float factor = .8;
  // c.rgb -= factor;
  // c.rgb = clamp(c.rgb, vec3(0.), vec3(1.));
  // c.rgb = smoothstep(vec3(0.), vec3(.5), c.rgb);
  // c.rgb /= (1.-factor);//exp(c.rgb) - 1.;
  l -= factor;
  l = clamp(l, 0., 1.);
  l /= (1.-factor);
  c.a = 1.;
  c.rgb *= vec3(l);
  gl_FragColor = c;
}`;

export { shader };
