import {
  RepeatWrapping,
  RawShaderMaterial,
} from "../third_party/three.module.js";
import { loadTexture } from "../js/loader.js";
import { settings } from "../js/settings.js";

const vertexShader = `#version 300 es
precision highp float;

in vec3 position;
in vec3 normal;
in vec2 uv;

uniform mat3 normalMatrix;
uniform mat4 modelViewMatrix;
uniform mat4 modelMatrix;
uniform mat4 viewMatrix;
uniform mat4 projectionMatrix;
uniform vec3 cameraPos;

out vec4 vEyePosition;
out vec3 vPosition;
out vec4 vWorldPosition;
out vec2 vUv;
out vec3 vNormal;
out float vDiffuse;
out float vDiffuse2;

void main() {
  vUv = uv;
  vPosition = position;
  vWorldPosition = modelMatrix * vec4(vPosition, 1. );
  vEyePosition = viewMatrix * vWorldPosition;
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * vEyePosition;

  vec3 lightPosition = (modelViewMatrix * vec4(30., -15., 50., 1.)).xyz;
  vec3 lightVector = normalize(lightPosition - vEyePosition.xyz);
  vDiffuse = max(dot(vNormal, lightVector), 0.1);

  float shininess = 2.;
  vec3 viewDirection = normalize(cameraPos - vWorldPosition.xyz);
  float specularReflection = pow(max(0.0, dot(reflect(-lightVector, vNormal), viewDirection)), shininess);
  vDiffuse += specularReflection;

  vec3 lightPosition2 = (modelViewMatrix * vec4(-48., -38., -57., 1.)).xyz;
  vec3 lightVector2 = normalize(lightPosition2 - vEyePosition.xyz);
  vDiffuse2 = max(dot(vNormal, lightVector2), 0.1);

  specularReflection = pow(max(0.0, dot(reflect(-lightVector2, vNormal), viewDirection)), shininess);
  vDiffuse2 += specularReflection;

}
`;

const fragmentShader = `#version 300 es
precision highp float;

in vec4 vEyePosition;
in vec3 vPosition;
in vec4 vWorldPosition;
in float strength;
in vec3 vNormal;
in vec2 vUv;
in float vDiffuse;
in float vDiffuse2;

uniform sampler2D text;
uniform float time;
uniform float distortion;
uniform sampler2D matCapMap;

out vec4 color;

#define M_PI 3.1415926535897932384626433832795
#define M_TAU (2. * M_PI)


float aastep(float x, in vec2 uv) {
  float w = length(fwidth(uv));
  return smoothstep(.5-w,.5+w,x);
}

const float dotSpace = 2.0;
const float dotSize = 4.;

const float sinPer = 3.141592 / dotSpace;
const float frac = dotSize / dotSpace;

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

vec2 matCapUV(in vec3 eye, in vec3 normal) {
  vec3 r = reflect(eye, normal);
  float m = 2.82842712474619 * sqrt(r.z + 1.0);
  vec2 vN = r.xy / m + .5;
  return vN;
}

void main() {
  float a = .5 + atan(vWorldPosition.z, vWorldPosition.x) / (2. * M_PI) + time;
  float h = .25 + (vWorldPosition.y+5.) / 30.;
  vec2 tUv = vec2(a,h) + distortion*vNormal.xy;

  vec3 lightColor = vec3(249.,0.,255.)/255.;
  color = .2*vec4(lightColor * vec3(vDiffuse),1.);
  vec3 lightColor2 = vec3(0.,170.,255.)/255.;
  color += .2*vec4(lightColor2 * vec3(vDiffuse2),1.);

  vec4 grid = grid(text, tUv);
  color += grid;//vec4(vec3(aastep(t.r, vUv)), 1.);//t;//vec4(1.);
  
  vec3 n = normalize(vNormal);
  vec2 vN = matCapUV(normalize(vEyePosition.xyz), n);
  vec4 c1 = texture(matCapMap, vN);
  color += c1;
}
`;

class CylinderMaterial extends RawShaderMaterial {
  constructor() {
    super({
      uniforms: {
        text: { value: null },
        time: { value: 0 },
        distortion: { value: 0.05 },
        matCapMap: { value: null },
      },
      vertexShader,
      fragmentShader,
    });
  }
}

export { CylinderMaterial };
