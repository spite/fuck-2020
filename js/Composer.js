import {
  OrthographicCamera,
  Scene,
  Mesh,
  PlaneBufferGeometry,
  RawShaderMaterial,
  Vector2,
} from "../third_party/three.module.js";

import { shader as vertexShader } from "../shaders/compose-vs.js";
import { shader as fragmentShader } from "../shaders/compose-fs.js";

const shader = new RawShaderMaterial({
  uniforms: {
    fbo: { value: null },
    resolution: { value: new Vector2(1, 1) },
  },
  vertexShader,
  fragmentShader,
});

class Composer {
  constructor(renderer, width, height) {
    this.renderer = renderer;
    this.shader = shader;
    this.orthoScene = new Scene();
    this.orthoCamera = new OrthographicCamera(
      width / -2,
      width / 2,
      height / 2,
      height / -2,
      0.00001,
      1000
    );
    this.orthoQuad = new Mesh(new PlaneBufferGeometry(1, 1), this.shader);
    this.orthoQuad.scale.set(width, height, 1);
    this.orthoScene.add(this.orthoQuad);
  }

  render(fbo) {
    this.shader.uniforms.fbo.value = fbo.texture;
    this.renderer.render(this.orthoScene, this.orthoCamera);
  }

  setSize(width, height) {
    this.orthoQuad.scale.set(width, height, 1);
    this.orthoCamera.left = -width / 2;
    this.orthoCamera.right = width / 2;
    this.orthoCamera.top = height / 2;
    this.orthoCamera.bottom = -height / 2;
    this.orthoCamera.updateProjectionMatrix();
    this.shader.uniforms.resolution.value.set(width, height);
  }
}

export { Composer };
