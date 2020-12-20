import {
  Vector2,
  RepeatWrapping,
  TextureLoader,
  Color,
  sRGBEncoding,
  CubeTextureLoader,
  LinearEncoding,
  MeshStandardMaterial,
  RawShaderMaterial,
} from "../third_party/three.module.js";
import Maf from "../third_party/Maf.js";
import Easings from "../third_party/easings.js";

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

out vec4 vEyePosition;
out vec3 vPosition;
out vec4 vWorldPosition;
out vec2 vUv;
out vec3 vNormal;

void main() {
  vUv = uv;
  vPosition = position;
  vWorldPosition = modelMatrix * vec4(vPosition, 1. );
  vEyePosition = viewMatrix * vWorldPosition;
  vNormal = normalMatrix * normal;
  gl_Position = projectionMatrix * vEyePosition;
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

uniform sampler2D text;

out vec4 color;

#define M_PI 3.1415926535897932384626433832795
#define M_TAU (2. * M_PI)

float atan2(in float y, in float x)
{
    bool s = (abs(x) > abs(y));
    return mix(M_PI/2.0 - atan(x,y), atan(y,x), s);
}

void main() {
  float a = .5 + atan(vWorldPosition.z, vWorldPosition.x) / (2. * M_PI);
  float h = .25 + vWorldPosition.y / 30.;
  vec2 tUv = vec2(a,h) + .05*vNormal.xy;
  vec4 t = 1.-texture(text, tUv);
  color = t;//vec4(1.);
}
`;

const loader = new TextureLoader();
const text = loader.load("../assets/text.png");

class CylinderMaterial extends RawShaderMaterial {
  constructor() {
    super({
      uniforms: {
        text: { value: text },
      },
      vertexShader,
      fragmentShader,
    });
  }
}

export { CylinderMaterial };
