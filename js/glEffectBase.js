import { EffectBase } from "./effectBase.js";
import {
  PerspectiveCamera,
  Scene,
  sRGBEncoding,
} from "../third_party/three.module.js";
import { getFBO } from "./FBO.js";

class glEffectBase extends EffectBase {
  constructor(renderer) {
    super();
    this.renderer = renderer;

    this.fbo = getFBO(1, 1, {}, true);
    this.fbo.texture.encoding = sRGBEncoding;
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(50, 1, 0.1, 100);
  }

  setSize(w, h) {
    super.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.fbo.setSize(w, h);
  }
}

export { glEffectBase };
