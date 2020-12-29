import {
  Scene,
  MeshStandardMaterial,
  WebGLCubeRenderTarget,
  RGBAFormat,
  LinearMipmapLinearFilter,
  sRGBEncoding,
  CubeCamera,
  Group,
  Vector3,
  BackSide,
  RectAreaLight,
  Mesh,
  IcosahedronBufferGeometry,
  DoubleSide,
} from "../third_party/three.module.js";
import { CylinderMaterial } from "./cylinder-material.js";
import { NekoMaterial } from "./neko-material.js";
import { RectAreaLightUniformsLib } from "../third_party/RectAreaLightUniformsLib.js";
RectAreaLightUniformsLib.init();
import { loadTexture, loadObject, loadDAE } from "../js/loader.js";
import Maf from "../third_party/Maf.js";
import { Text } from "./text.js";
import { plane as banner } from "./dark-banner.js";
import Easings from "../third_party/easings.js";

const scene = new Scene();
scene.rotation.y = Math.PI;
const textRender = new Text("ultra");

scene.add(banner);
banner.material.uniforms.text.value = textRender.renderTarget.texture;

const cylinder = new Group();
const cylinderMat = new CylinderMaterial();
cylinderMat.uniforms.text.value = textRender.renderTarget.texture;

const cubeRenderTarget = new WebGLCubeRenderTarget(4096, {
  format: RGBAFormat,
  //type: canDoFloatLinear() ? FloatType : HalfFloatType,
  generateMipmaps: true,
  minFilter: LinearMipmapLinearFilter,
});

const cubeCamera = new CubeCamera(0.1, 20, cubeRenderTarget);
scene.add(cubeCamera);

loadObject("assets/cylinder3.obj", (e) => {
  cylinder.position.y = -5;
  while (e.children.length) {
    const m = e.children[0];
    m.material = cylinderMat;
    cylinder.add(m);
  }
  scene.add(cylinder);
});

const nekoTexture = loadTexture("assets/manekineko_dark.png");
nekoTexture.encoding = sRGBEncoding;

const nekoMat = new NekoMaterial({
  color: 0xffffff,
  emissive: 0xfffff,
  emissiveMap: nekoTexture,
  roughness: 0,
  metalness: 1,
  side: DoubleSide,
});
nekoMat.envMap = cubeRenderTarget.texture;

const neko = new Group();

const nekoFracture = new Group();
nekoFracture.rotation.y = Math.PI;
const pieces = [];

loadDAE("assets/neko_fracture.dae", (e) => {
  const pivot = new Group();
  pivot.position.set(-0.54326, 1.6598, 0);
  const arm = new Group();
  arm.position.copy(pivot.position).multiplyScalar(-1);
  pivot.add(arm);
  const body = new Group();
  nekoFracture.add(body);
  while (e.children.length) {
    const mesh = e.children[0];
    if (mesh.name.indexOf("body") !== -1) {
      mesh.material = nekoMat;
      body.add(mesh);
      pieces.push({ mesh, position: mesh.position.clone() });
    } else if (mesh.name.indexOf("arm") !== -1) {
      mesh.material = nekoMat;
      arm.add(mesh);
      pieces.push({ mesh, position: mesh.position.clone() });
    } else {
      e.remove(mesh);
    }
  }

  nekoFracture.add(pivot);

  scene.add(nekoFracture);
});

const pivot = new Group();
loadObject("assets/neko.obj", (e) => {
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
  const nfState = nekoFracture.visible;
  const nState = neko.visible;
  nekoFracture.visible = false;
  neko.visible = false;
  cubeCamera.update(renderer, scene);
  nekoFracture.visible = nfState;
  neko.visible = nState;
}

function setDistortion(v) {
  cylinderMat.uniforms.distortion.value = v;
}

const dir = new Vector3();

function setExplosion(t) {
  if (t === 0) {
    nekoFracture.visible = false;
    neko.visible = true;
    return;
  }
  nekoFracture.visible = true;
  neko.visible = false;
  for (let i = 0; i < pieces.length; i++) {
    const distance = (20 + i) * t;
    const mesh = pieces[i].mesh;
    dir.copy(pieces[i].position).normalize().multiplyScalar(distance);
    mesh.position.copy(pieces[i].position).add(dir);
    const s = 0.1;
    const rx = s * t * Math.PI * (10 + i);
    const ry = s * t * Math.PI * (12 + i);
    const rz = s * t * Math.PI * (8 + i);
    mesh.rotation.set(rx, ry, rz);
  }
}

let previousText = "";
function setText(renderer, text) {
  if (text !== previousText) {
    textRender.render(renderer, text);
    previousText = text;
  }
}

function update(t) {
  const d = 1.254;
  const tt = (t % d) / d;
  const v = Easings.InOutQuint(Maf.parabola(tt, 4));
  pivot.rotation.x = Maf.mix(0, Math.PI / 2, v);
}

function init(renderer, camera) {
  renderer.compile(scene, camera);
}

export { scene, init, updateEnv, setDistortion, setExplosion, setText, update };
