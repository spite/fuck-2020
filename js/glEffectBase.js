import { EffectBase } from "./effectBase.js";
import {
  PerspectiveCamera,
  Scene,
  FloatType,
  HalfFloatType,
} from "../third_party/three.module.js";
import { getFBO } from "./FBO.js";
import { canDoFloatLinear } from "./features.js";

class glEffectBase extends EffectBase {
  constructor(renderer) {
    super();
    this.renderer = renderer;

    this.fbo = getFBO(1, 1, {
      //type: canDoFloatLinear() ? FloatType : HalfFloatType,
    });
    this.postFbo = getFBO(1, 1, {
      type: canDoFloatLinear() ? FloatType : HalfFloatType,
    });
    this.scene = new Scene();
    this.camera = new PerspectiveCamera(75, 1, 0.1, 100);
  }

  setSize(w, h) {
    super.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.fbo.setSize(w, h);
    this.postFbo.setSize(w, h);
  }
}

export { glEffectBase };
