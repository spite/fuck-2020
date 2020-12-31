import {
  DynamicDrawUsage,
  Group,
  Object3D,
  InstancedMesh,
  RawShaderMaterial,
  Quaternion,
  Vector3,
  DoubleSide,
} from "../third_party/three.module.js";
import { loadObject } from "../js/loader.js";
import Maf from "../third_party/Maf.js";

const sakuraVS = `#version 300 es
precision highp float;

in vec3 position;
in vec2 uv;
in mat4 instanceMatrix;

uniform mat4 projectionMatrix;
uniform mat4 modelViewMatrix;

out vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = projectionMatrix * modelViewMatrix * instanceMatrix * vec4(position, 1.);
}
`;

const sakuraFS = `#version 300 es
precision highp float;

in vec2 vUv;

out vec4 color;

vec4 fromLinear(vec4 linearRGB) {
  bvec4 cutoff = lessThan(linearRGB, vec4(0.0031308));
  vec4 higher = vec4(1.055)*pow(linearRGB, vec4(1.0/2.4)) - vec4(0.055);
  vec4 lower = linearRGB * vec4(12.92);

  return mix(higher, lower, cutoff);
}

void main() {
  vec4 c1 = fromLinear(vec4(230., 93., 85., 255.)/255.);
  vec4 c2 = fromLinear(vec4(230., 193., 182., 255.)/255.);
  
  color = vec4(mix(c1.rgb, c2.rgb, vUv.x),1.);

}`;

const count = 1000;
const dummy = new Object3D();

class Sakura extends Group {
  constructor() {
    super();
    loadObject("assets/cherry_blossom.obj", (e) => {
      const geometry = e.children[0].geometry;

      const material = new RawShaderMaterial({
        vertexShader: sakuraVS,
        fragmentShader: sakuraFS,
        side: DoubleSide,
      });

      const mesh = new InstancedMesh(geometry, material, count);
      mesh.instanceMatrix.setUsage(DynamicDrawUsage);
      this.add(mesh);
      this.petals = [];
      this.mesh = mesh;
      this.init();
    });
  }

  init() {
    if (this.mesh) {
      const r = 30;
      const time = performance.now() * 0.001;
      for (let i = 0; i < count; i++) {
        const x = r * (Math.random() * 1 - 0.5);
        const y = r * (Math.random() * 1 - 0.5);
        const z = r * (Math.random() * 1 - 0.5);

        dummy.position.set(x, y, z);
        dummy.rotation.x = Math.random() * 2 * Math.PI;
        dummy.rotation.y = Math.random() * 2 * Math.PI;
        dummy.rotation.z = Math.random() * 2 * Math.PI;

        dummy.scale.setScalar(0.5 + 0.7 * Math.random());

        this.petals.push({
          position: dummy.position.clone(),
          original: dummy.position.clone(),
          rotation: dummy.rotation.clone(),
          scale: dummy.scale.x,
        });

        dummy.updateMatrix();

        this.mesh.setMatrixAt(i, dummy.matrix);
      }

      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }

  update(t) {
    if (this.mesh) {
      const r = 30;
      for (let i = 0; i < count; i++) {
        const petal = this.petals[i];
        const scale = petal.scale;
        const r = 2.5 * scale;
        const f = (t + 100) * scale;
        petal.position.y = Maf.mod(-(t + 50) * 2.5 * scale, 30) - 15;
        petal.position.x = petal.original.x + r * Math.cos(f);
        petal.position.z = petal.original.y + r * Math.sin(f);

        petal.rotation.y = scale * (100 + 10 * t);
        dummy.position.copy(petal.position);
        dummy.rotation.copy(petal.rotation);
        dummy.updateMatrix();

        this.mesh.setMatrixAt(i, dummy.matrix);
      }

      this.mesh.instanceMatrix.needsUpdate = true;
    }
  }
}

const sakura = new Sakura();

export { sakura };
