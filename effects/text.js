import {
  MeshNormalMaterial,
  Group,
  Font,
  Mesh,
  ShapeBufferGeometry,
  DoubleSide,
  Scene,
  OrthographicCamera,
  PlaneBufferGeometry,
  MeshBasicMaterial,
  BoxBufferGeometry,
} from "../third_party/three.module.js";
import { TTFLoader } from "../third_party/TTFLoader.js";
import { getFBO } from "../js/FBO.js";

let font = null;
const loader = new TTFLoader();

loader.load("assets/iCiel Ultra.ttf", function (json) {
  font = new Font(json);
});

let mesh = null;
const scene = new Scene();
const material = new MeshBasicMaterial({ color: 0xffffff, side: DoubleSide });

const w = 2048;
const h = 512;
const renderTarget = getFBO(w, h);
const camera = new OrthographicCamera(-16 / 2, 16 / 2, 4 / 2, -4 / 2, 0.1, 20);
camera.position.z = 0.1;
camera.lookAt(scene.position);

function renderText(renderer, text) {
  if (mesh) {
    scene.remove(mesh);
    mesh.geometry.dispose();
  }

  const shapes = font.generateShapes(text, 1);
  const geometry = new ShapeBufferGeometry(shapes);
  geometry.computeBoundingBox();

  mesh = new Mesh(geometry, material);
  const w = geometry.boundingBox.max.x - geometry.boundingBox.min.x;
  const h = geometry.boundingBox.max.y - geometry.boundingBox.min.y;
  mesh.position.x -= 0.5 * w;
  mesh.position.y -= 0.5 * h;

  scene.add(mesh);

  renderer.setRenderTarget(renderTarget);
  renderer.render(scene, camera);
  renderer.setRenderTarget(null);
}

export { renderText, renderTarget };
