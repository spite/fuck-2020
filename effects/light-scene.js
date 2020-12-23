import {
  Scene,
  MeshStandardMaterial,
  TextureLoader,
  PointLight,
  CubeTextureLoader,
  UnsignedByteType,
  FloatType,
  sRGBEncoding,
  PMREMGenerator,
  Group,
  Vector3,
  Vector2,
  BackSide,
  RectAreaLight,
  Mesh,
  IcosahedronBufferGeometry,
} from "../third_party/three.module.js";
import { OBJLoader } from "../third_party/OBJLoader.js";
import { RGBELoader } from "../third_party/RGBELoader.js";

const scene = new Scene();

const loader = new TextureLoader();

const cubeTexLoader = new CubeTextureLoader();
cubeTexLoader.setPath("./assets/");
const f = "pisa_";
const ext = "png";
const environmentMap = cubeTexLoader.load([
  `${f}posx.${ext}`,
  `${f}negx.${ext}`,
  `${f}posy.${ext}`,
  `${f}negy.${ext}`,
  `${f}posz.${ext}`,
  `${f}negz.${ext}`,
]);
environmentMap.encoding = sRGBEncoding;

const mapTexture = loader.load("assets/props.png");
mapTexture.encoding = sRGBEncoding;

const material = new MeshStandardMaterial({
  color: 0xffffff,
  map: mapTexture,
  roughness: 0.52,
  metalness: 0,
  roughnessMap: loader.load("assets/props_rough.png"),
  normalMap: loader.load("assets/props_normal.png"),
  envMap: environmentMap,
});

const objLoader = new OBJLoader();
objLoader.load("assets/star.obj", (e) => {
  const strawberry = e.children[0];
  strawberry.material = material;
  scene.add(strawberry);
});

const nekoTexture = loader.load("assets/manekineko_light_AO.png");
nekoTexture.encoding = sRGBEncoding;

const nekoMat = new MeshStandardMaterial({
  color: 0xffffff,
  map: nekoTexture,
  roughness: 0.52,
  metalness: 0,
  roughnessMap: loader.load("assets/manekineko_light_roughness.png"),
  normalMap: loader.load("assets/manekineko_light_normal.png"),
  envMap: environmentMap,
  normalScale: new Vector2(0.05, 0.05),
});

objLoader.load("assets/neko.obj", (e) => {
  const neko = new Group();
  const pivot = new Group();
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

// const light3 = new PointLight(0xffffff);
// light3.position.set(0, 20, 0);
// scene.add(light3);

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
  new RGBELoader()
    //.setDataType(UnsignedByteType)
    .setDataType(FloatType)
    .setPath("../assets/")
    .load("lythwood_room_2k.hdr", function (texture) {
      radianceMap = pmremGenerator.fromEquirectangular(texture).texture;
      pmremGenerator.dispose();

      //scene.background = radianceMap;
      material.envMap = radianceMap;
      nekoMat.envMap = radianceMap;
      backdrop.envMap = radianceMap;

      /*const geometry = new THREE.SphereBufferGeometry(0.4, 32, 32);

      for (let x = 0; x <= 10; x++) {
        for (let y = 0; y <= 2; y++) {
          const material = new THREE.MeshPhysicalMaterial({
            roughness: x / 10,
            metalness: y < 1 ? 1 : 0,
            color: y < 2 ? 0xffffff : 0x000000,
            envMap: radianceMap,
            envMapIntensity: 1,
          });

          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.x = x - 5;
          mesh.position.y = 1 - y;
          scene.add(mesh);
        }
      }*/

      //render();
    });

  const pmremGenerator = new PMREMGenerator(renderer);
  pmremGenerator.compileEquirectangularShader();
}
export { scene, initHdrEnv };
