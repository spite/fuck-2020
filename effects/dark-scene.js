import {
  Scene,
  MeshStandardMaterial,
  TextureLoader,
  PointLight,
  CubeTextureLoader,
  UnsignedByteType,
  FloatType,
  WebGLCubeRenderTarget,
  RGBAFormat,
  LinearMipmapLinearFilter,
  sRGBEncoding,
  CubeCamera,
  Group,
  Vector3,
  Vector2,
  BackSide,
  RectAreaLight,
  Mesh,
  IcosahedronBufferGeometry,
} from "../third_party/three.module.js";
import { OBJLoader } from "../third_party/OBJLoader.js";
import { CylinderMaterial } from "./cylinder-material.js";
import { NekoMaterial } from "./neko-material.js";
import { RectAreaLightUniformsLib } from "../third_party/RectAreaLightUniformsLib.js";
RectAreaLightUniformsLib.init();
import { addPromise } from "../js/loader.js";
import { loadTexture } from "./loader.js";

const scene = new Scene();

const loader = new TextureLoader();
const objLoader = new OBJLoader();

const cylinder = new Group();
const cylinderMat = new CylinderMaterial();

const cubeRenderTarget = new WebGLCubeRenderTarget(2048, {
  format: RGBAFormat,
  //type: canDoFloatLinear() ? FloatType : HalfFloatType,
  generateMipmaps: true,
  minFilter: LinearMipmapLinearFilter,
});

const cubeCamera = new CubeCamera(0.1, 20, cubeRenderTarget);
scene.add(cubeCamera);

const objLoaded = addPromise();
objLoader.load("assets/cylinder3.obj", (e) => {
  cylinder.position.y = -5;
  while (e.children.length) {
    const m = e.children[0];
    m.material = cylinderMat;
    cylinder.add(m);
  }
  scene.add(cylinder);
  objLoaded();
});

const nekoTexture = loadTexture("assets/manekineko_dark.png");
nekoTexture.encoding = sRGBEncoding;

const nekoMat = new NekoMaterial({
  color: 0xffffff,
  emissive: 0xfffff,
  emissiveMap: nekoTexture,
  roughness: 0,
  metalness: 1,
});
nekoMat.envMap = cubeRenderTarget.texture;

const neko = new Group();

objLoader.load("assets/neko.obj", (e) => {
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

const width = 20;
const height = 20;
const intensity = 1;
const rectLight = new RectAreaLight(0xf900ff, intensity, width, height);
rectLight.position.set(-3, 1.5, -5);
rectLight.lookAt(0, 0, 0);
scene.add(rectLight);

const rectLight2 = new RectAreaLight(0x00aaff, intensity, width, height);
rectLight2.position.set(4.8, 3.8, 5.7);
rectLight2.lookAt(0, 0, 0);
scene.add(rectLight2);

const backdrop = new Mesh(
  new IcosahedronBufferGeometry(30, 3),
  new MeshStandardMaterial({
    color: 0,
    roughness: 1,
    metalness: 0,
    side: BackSide,
  })
);
scene.add(backdrop);

function updateEnv(renderer) {
  neko.visible = false;
  cubeCamera.update(renderer, scene);
  neko.visible = true;
}

function setDistortion(v) {
  cylinderMat.uniforms.distortion.value = v;
}

export { scene, updateEnv, setDistortion };
