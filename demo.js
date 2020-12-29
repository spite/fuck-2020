import {
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  ACESFilmicToneMapping,
  Vector3,
} from "./third_party/three.module.js";
import { OrbitControls } from "./third_party/OrbitControls.js";
import { Effect as NekoEffect } from "./effects/neko.js";
import { Composer } from "./js/Composer.js";
import * as dat from "./third_party/dat.gui.module.js";
import { settings } from "./js/settings.js";

import { loadAudio, loaded as allLoaded, onProgress } from "./js/loader.js";
import { keyframe } from "./js/storyline.js";

const camera = new PerspectiveCamera(27, 1, 0.1, 100);

const gui = new dat.GUI();

const params = {
  controls: !true,
  blurExposure: 0.3,
  blurRadius: 1,
  blurStrength: 1,
  aberration: 0.1,
  opacity: 1,
  distortion: 0.05,
  badness: 0,
  explosion: 0,
};

const postFolder = gui.addFolder("Post");
postFolder.add(params, "controls");
postFolder.add(params, "blurExposure", 0, 3, 0.01);
postFolder.add(params, "blurRadius", 0, 1, 0.01);
postFolder.add(params, "blurStrength", 0, 2, 0.01);
postFolder.add(params, "aberration", 0, 1, 0.01);
postFolder.add(params, "opacity", 0, 1, 0.01);
postFolder.add(params, "distortion", 0, 0.5, 0.01);
postFolder.add(params, "badness", 0, 1, 0.01);
postFolder.add(params, "explosion", 0, 1, 0.01);
postFolder.open();

const canvas = document.createElement("canvas");
3 * document.body.append(canvas);

const renderer = new WebGLRenderer({
  canvas,
  preserveDrawingBuffer: false,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0, 1);
renderer.outputEncoding = sRGBEncoding;
// renderer.gammaFactor = 2.2;
renderer.toneMapping = ACESFilmicToneMapping;

const composer = new Composer(renderer, 1, 1);

const effects = [];
const neko = new NekoEffect(renderer, gui);

effects.push(neko);

camera.position.set(0, 0, -20);
camera.lookAt(new Vector3(0, 0, 0));

const controls = new OrbitControls(camera, renderer.domElement);
controls.screenSpacePanning = true;

const overlay = document.querySelector(".overlay");
const loading = document.querySelector("#loading");
const progress = loading.querySelector("p.progress");
const start = document.querySelector("#start");
start.addEventListener("click", () => {
  run();
});

function render(t) {
  const et = audio.currentTime;
  if (!params.controls) {
    keyframe(et, camera);
  }

  neko.final.shader.uniforms.radius.value = params.blurRadius;
  neko.blurStrength = params.blurStrength;
  neko.final.shader.uniforms.exposure.value =
    params.badness * params.blurExposure;
  neko.post.shader.uniforms.opacity.value = params.opacity;
  neko.post.shader.uniforms.aberration.value = params.aberration;
  neko.badness = params.badness;
  neko.distortion = params.distortion;
  neko.explosion = params.explosion;

  //const et = performance.now() / 1000;
  neko.render(et, camera);
  //composer.render(neko.post.fbo);
  requestAnimationFrame(render);
}

function resize() {
  let w = window.innerWidth * settings.scale;
  let h = window.innerHeight * settings.scale;
  renderer.setSize(w, h);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  camera.aspect = w / h;
  camera.updateProjectionMatrix();
  const dPR = window.devicePixelRatio;
  w *= dPR;
  h *= dPR;
  neko.setSize(w, h);
  composer.setSize(w, h);
}

window.addEventListener("resize", resize);

const audio = loadAudio("assets/track.mp3");

onProgress((p) => {
  progress.textContent = `${p.toFixed(0)}%`;
});

async function init() {
  loading.style.display = "flex";
  console.log("Loading...");
  await allLoaded();
  console.log("All loaded");
  setTimeout(async () => {
    const preload = [];
    for (const effect of effects) {
      preload.push(effect.initialise());
    }
    await Promise.all(preload);
    resize();
    loading.style.display = "none";
    start.style.display = "flex";
    console.log("Ready...");
    run();
  }, 100);
}

function run() {
  overlay.classList.add("hidden");
  console.log("Start");
  audio.play();
  render();
}

init();
