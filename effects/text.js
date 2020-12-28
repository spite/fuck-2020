import {
  Mesh,
  ShapeBufferGeometry,
  DoubleSide,
  Scene,
  OrthographicCamera,
  MeshBasicMaterial,
} from "../third_party/three.module.js";
import { loadTTF } from "../js/loader.js";
import { getFBO } from "../js/FBO.js";

const fontMap = new Map();

loadTTF("assets/iCiel Ultra.ttf", (font) => {
  fontMap.set("ultra", font);
});

const material = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });

class Text extends Scene {
  constructor(fontName) {
    super();
    this.mesh = null;
    this.font = null;
    this.fontName = fontName;

    const w = 2048;
    const h = 512;
    this.renderTarget = getFBO(w, h);
    this.camera = new OrthographicCamera(
      -16 / 2,
      16 / 2,
      4 / 2,
      -4 / 2,
      0.1,
      20
    );
    this.camera.position.z = 0.1;
    this.camera.lookAt(this.position);
  }

  render(renderer, text) {
    if (this.mesh) {
      this.remove(this.mesh);
      this.mesh.geometry.dispose();
    }

    if (!this.font) {
      this.font = fontMap.get(this.fontName);
    }

    const shapes = this.font.generateShapes(text, 1);
    const geometry = new ShapeBufferGeometry(shapes);
    geometry.computeBoundingBox();

    this.mesh = new Mesh(geometry, material);
    const w = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const h = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    this.mesh.position.x -= 0.5 * w;
    this.mesh.position.y -= 0.5 * h;

    this.add(this.mesh);

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this, this.camera);
    renderer.setRenderTarget(null);
  }
}

export { Text };
