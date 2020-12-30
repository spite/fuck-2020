import {
  Mesh,
  ShapeBufferGeometry,
  DoubleSide,
  Scene,
  Group,
  OrthographicCamera,
  MeshBasicMaterial,
  PlaneBufferGeometry,
} from "../third_party/three.module.js";
import { loadTTF } from "../js/loader.js";
import { getFBO } from "../js/FBO.js";
import { SVGLoader } from "../third_party/SVGLoader.js";
import Easings from "../third_party/easings.js";

const fontMap = new Map();

loadTTF("assets/ultra.ttf", (font) => {
  fontMap.set("ultra", font);
});

// loadTTF("assets/bellota.ttf", (font) => {
//   fontMap.set("bellota", font);
// });

const material = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });
const outMaterial = new MeshBasicMaterial({
  color: 0xffffff,
  emissive: 0xffffff,
  transparent: true,
});
const matDark = new MeshBasicMaterial({
  color: 0x000000,
  transparent: true,
});

class Text extends Scene {
  constructor(fontName) {
    super();
    this.mesh = new Mesh(new PlaneBufferGeometry(1, 1), material);
    this.add(this.mesh);

    this.outMesh = new Group();
    this.outMesh.scale.setScalar(0.9);
    this.textMesh = new Mesh(new PlaneBufferGeometry(1, 1), outMaterial);
    this.strokeText = new Group();
    this.outMesh.add(this.strokeText);
    this.outMesh.add(this.textMesh);
    this.strokeText.position.z = -0.1;

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
    this.mesh.geometry.dispose();

    if (!this.font) {
      this.font = fontMap.get(this.fontName);
    }

    const shapes = this.font.generateShapes(text, 1);
    const geometry = new ShapeBufferGeometry(shapes);
    geometry.computeBoundingBox();
    geometry.needsUpdate = true;

    this.mesh.geometry = geometry;
    const w = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
    const h = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
    this.mesh.position.x = -0.5 * w;
    this.mesh.position.y = -0.5 * h;

    this.textMesh.geometry = geometry;
    this.outMesh.position.x = -0.5 * w * this.outMesh.scale.x;
    this.outMesh.position.y = -0.5 * h * this.outMesh.scale.y;

    renderer.setRenderTarget(this.renderTarget);
    renderer.render(this, this.camera);
    renderer.setRenderTarget(null);

    const holeShapes = [];

    while (this.strokeText.children.length) {
      const m = this.strokeText.children[0];
      this.strokeText.remove(m);
      m.geometry.dispose();
    }

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];

      if (shape.holes && shape.holes.length > 0) {
        for (let j = 0; j < shape.holes.length; j++) {
          const hole = shape.holes[j];
          holeShapes.push(hole);
        }
      }
    }

    shapes.push.apply(shapes, holeShapes);

    const style = SVGLoader.getStrokeStyle(0.1, "#ffffff");

    for (let i = 0; i < shapes.length; i++) {
      const shape = shapes[i];

      const points = shape.getPoints();

      const geometry = SVGLoader.pointsToStroke(points, style);

      //geometry.translate(-0.5 * w, -0.5 * h, 0);

      const strokeMesh = new Mesh(geometry, matDark);
      this.strokeText.add(strokeMesh);
    }
  }
}

function setColor(color, opacity) {
  outMaterial.opacity = opacity;
  outMaterial.color.set(color);
  matDark.opacity = Easings.InQuint(opacity);
}

export { Text, setColor };
