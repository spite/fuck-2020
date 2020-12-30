import {
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  ACESFilmicToneMapping,
  Vector3,
} from "./third_party/three.module.js";
import { OrbitControls } from "./third_party/OrbitControls.js";
import { Effect as NekoEffect } from "./effects/neko.js";
import * as dat from "./third_party/dat.gui.module.js";
import { settings } from "./js/settings.js";

import { loadAudio, loaded as allLoaded, onProgress } from "./js/loader.js";
import { keyframe } from "./js/storyline.js";
import Maf from "./third_party/Maf.js";
import Easings from "./third_party/easings.js";
import { getFucking } from "./effects/data.js";

const camera = new PerspectiveCamera(27, 1, 0.1, 200);

const gui = new dat.GUI();

const params = {
  controls: !true,
  glitch: 0,
  blurExposure: 0.15,
  blurRadius: 1,
  blurStrength: 2,
  aberration: 0.07,
  opacity: 1,
  distortion: 0.05,
  badness: 0,
  explosion: 0,
};

const postFolder = gui.addFolder("Post");
postFolder.add(params, "controls");
postFolder.add(params, "glitch", 0, 1, 0.01);
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

  if (et >= 22.911 && et < 30.313) {
    const v = Maf.map(22.911, 30.313, 0, 1, et);
    neko.post.shader.uniforms.white.value = Easings.InQuint(v);
  } else {
    neko.post.shader.uniforms.white.value = 0;
  }

  if (et < 30.313) {
    neko.badness = 0;
  } else {
    neko.badness = 1;
  }

  neko.glitchAmount = 0;
  neko.glitch2Amount = 0;
  if (et > 6.087 && et < 7.745) {
    const v = Maf.map(6.087, 7.745, 0, 1, et);
    neko.glitchAmount = 0.2 * Maf.parabola(v, 1);
    neko.glitch2Amount = 0.2 * Maf.parabola(v, 1);
  }
  if (et > 14.208 && et < 15.1) {
    const v = Maf.map(14.208, 15.1, 0, 1, et);
    neko.glitchAmount = 0.4 * Maf.parabola(v, 1);
    neko.glitch2Amount = 0.1 * Maf.parabola(v, 1);
  }
  if (et > 19.376 && et < 27.787) {
    const v = Maf.map(19.376, 27.787, 0, 1, et);
    neko.glitchAmount = 0.5 * Easings.InQuad(v);
    neko.glitch2Amount = 0.1 * Easings.InQuad(v);
  }
  if (et > 29.668 && et < 30.313) {
    const v = Maf.map(29.668, 30.313, 0, 1, et);
    neko.glitchAmount = 2 * Easings.OutQuint(v);
  }

  neko.explosion = 0;
  if (et >= 90.362 && et < 90.943) {
    const v = Maf.map(90.362, 90.943, 0, 1, et);
    neko.explosion = 0.005 * Easings.InQuad(v);
  }
  if (et >= 90.943 && et < 119) {
    const v = Maf.map(90.943, 119, 0.005, 0.1, et);
    neko.explosion = v;
  }

  neko.fucking = getFucking(et);

  neko.final.shader.uniforms.radius.value = params.blurRadius;
  neko.blurStrength = params.blurStrength;
  neko.final.shader.uniforms.exposure.value = params.blurExposure;
  neko.post.shader.uniforms.opacity.value = params.opacity;
  neko.post.shader.uniforms.aberration.value = params.aberration;
  neko.distortion = params.distortion;

  neko.render(et, camera);
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
}

window.addEventListener("resize", resize);

const audio = loadAudio("assets/track.ogg");

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
  audio.controls = true;
  audio.style.width = "100%";
  document.body.append(audio);
  render();
}

init();
