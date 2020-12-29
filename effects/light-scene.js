import {
  Scene,
  MeshStandardMaterial,
  PointLight,
  FloatType,
  sRGBEncoding,
  PMREMGenerator,
  Group,
  Vector2,
  BackSide,
  RectAreaLight,
  Mesh,
  IcosahedronBufferGeometry,
} from "../third_party/three.module.js";
import { RGBELoader } from "../third_party/RGBELoader.js";
import { sakura } from "./sakura.js";
import { RectAreaLightUniformsLib } from "../third_party/RectAreaLightUniformsLib.js";
RectAreaLightUniformsLib.init();
import { addPromise, loadTexture, loadObject } from "../js/loader.js";
import Maf from "../third_party/Maf.js";
import { settings } from "../js/settings.js";

const scene = new Scene();
scene.rotation.y = Math.PI;
scene.add(sakura);

const mapTexture = loadTexture("assets/props.jpg");
mapTexture.encoding = sRGBEncoding;

const roughnessTexture = loadTexture("assets/props_rough.jpg");
const normalTexture = loadTexture("assets/props_normal.jpg");

const material = new MeshStandardMaterial({
  color: 0xffffff,
  map: mapTexture,
  roughness: 0.52,
  metalness: 0,
  roughnessMap: roughnessTexture,
  normalMap: normalTexture,
  envMap: null,
});

const objects = [
  { id: "cloud01", x: 7.6, y: 14.817, z: 3.5 },
  { id: "cloud02", x: -3.75, y: 11.46, z: 6.21 },
  { id: "cloud03", x: -4.3675, y: 4.16, z: -0.295 },
  { id: "cloud04", x: 4.6332, y: 5.162, z: -3.057 },
  { id: "strawberry", x: -4.38, y: 1.5355, z: 2.44 },
  { id: "heart", x: 3.5981, y: -1.105, z: 2.12 },
  { id: "star", x: -1.661, y: 0.896, z: 5.465 },
  { id: "star", x: 3.8574, y: -0.216, z: -1.6077 },
];

const objectMap = {};
for (const object of objects) {
  loadObject(`assets/${object.id}.obj`, (e) => {
    const obj = e.children[0];
    obj.material = material;
    scene.add(obj);
    obj.position.set(object.x, object.z, -object.y);
    //obj.lookAt(scene.position);
    objectMap[object.id] = obj;
  });
}

const nekoTexture = loadTexture("assets/manekineko_light_AO.jpg");
nekoTexture.encoding = sRGBEncoding;

const nekoRoughnessTexture = loadTexture(
  "assets/manekineko_light_roughness.jpg"
);
const nekoNormalTexture = loadTexture("assets/manekineko_light_normal.jpg");

const nekoMat = new MeshStandardMaterial({
  color: 0xffffff,
  map: nekoTexture,
  roughness: 0.52,
  metalness: 0,
  roughnessMap: nekoRoughnessTexture,
  normalMap: nekoNormalTexture,
  envMap: null,
  normalScale: new Vector2(0.05, 0.05),
});

const pivot = new Group();
loadObject("assets/neko.obj", (e) => {
  const neko = new Group();
  pivot.position.set(-0.54326, 1.6598, 0);
  const arm = e.children[0];
  arm.position.copy(pivot.position).multiplyScalar(-1);
  pivot.add(arm);
  const body = e.children[0];
  neko.add(body);

  body.material = nekoMat;
  arm.material = nekoMat;
  neko.add(pivot);

  scene.add(neko);
});

const backdrop = new Mesh(
  new IcosahedronBufferGeometry(20, 3),
  new MeshStandardMaterial({
    color: 0xffffff,
    roughness: 1,
    metalness: 0,
    side: BackSide,
  })
);
scene.add(backdrop);

const light1 = new PointLight(0xff0045);
light1.position.set(-12, 0, -12);
scene.add(light1);

const light2 = new PointLight(0xff8d00);
light2.position.set(17, 0, 0);
scene.add(light2);

const width = 20;
const height = 20;
const intensity = 1;
const rectLight = new RectAreaLight(0xf900ff, intensity, width, height);
rectLight.color.set(0xffffff);
rectLight.position.set(0, 20, 0);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);

function initHdrEnv(renderer) {
  let radianceMap = null;
  const loaded = addPromise();
  new RGBELoader()
    //.setDataType(UnsignedByteType)
    .setDataType(FloatType)
    .setPath("assets/")
    .load(settings.hdriMap, (texture) => {
      radianceMap = pmremGenerator.fromEquirectangular(texture).texture;
      pmremGenerator.dispose();
      material.envMap = radianceMap;
      nekoMat.envMap = radianceMap;
      backdrop.envMap = radianceMap;
      loaded();
    });

  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
}

function update(t) {
  const d = 2 * 1.254;
  const tt = (t % d) / d;
  const v = 0.5 + 0.5 * Math.sin(t * 2 * Math.PI - Math.PI / 2);
  pivot.rotation.x = Maf.mix(-Math.PI / 4, Math.PI / 16, v);

  objectMap["strawberry"].rotation.x += 0.0005;
  objectMap["strawberry"].rotation.y += 0.01;
  objectMap["strawberry"].rotation.z += 0.00075;

  objectMap["heart"].rotation.x += 0.0005;
  objectMap["heart"].rotation.y += 0.01;
  objectMap["heart"].rotation.z += 0.00075;

  sakura.update();
}

function init(renderer, camera) {
  renderer.compile(scene, camera);
}

export { scene, init, initHdrEnv, update };
