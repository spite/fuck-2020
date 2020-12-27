import {
  WebGLRenderer,
  sRGBEncoding,
  PerspectiveCamera,
  ACESFilmicToneMapping,
} from "./third_party/three.module.js";
import { OrbitControls } from "./third_party/OrbitControls.js";
import { Effect as NekoEffect } from "./effects/neko.js";
import { Composer } from "./js/Composer.js";
import * as dat from "./third_party/dat.gui.module.js";
import { settings } from "./js/settings.js";

import { loadAudio, loaded as allLoaded, onProgress } from "./js/loader.js";

const camera = new PerspectiveCamera(50, 1, 0.1, 100);

// async function loadPath(file, callback) {
//   const res = await fetch(file);
//   const xmlStr = await res.text();
//   const parser = new DOMParser();
//   const dom = parser.parseFromString(xmlStr, "application/xml");
//   debugger;
// }

// loadPath("assets/camera_test.dae", (e) => {
//   debugger;
// });
const gui = new dat.GUI();

// function keyframe(t) {
//   const step = Math.floor((t * 100) / animation.duration) % 100;
//   const positions = animation.tracks[0].values;
//   const x = positions[3 * step];
//   const y = positions[3 * step + 1];
//   const z = positions[3 * step + 2];
//   const rotations = animation.tracks[1].values;
//   const qx = rotations[4 * step];
//   const qy = rotations[4 * step + 1];
//   const qz = rotations[4 * step + 2];
//   const qw = rotations[4 * step + 3];
//   console.log(qx, qy, qz, qw);
//   camera.quaternion.set(qx, qy, qz, qw);
//   // const steps = animation.tracks[-]
//   // const step = t * steps * animation.duration;
//   // const keyframe = animation[step];
// }

const params = {
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

const controls = new OrbitControls(neko.camera, renderer.domElement);
controls.screenSpacePanning = true;

const loading = document.querySelector("#loading");
const start = document.querySelector("#start");
start.addEventListener("click", () => {
  run();
});

function render(t) {
  //keyframe(audio.currentTime);
  neko.final.shader.uniforms.radius.value = params.blurRadius;
  neko.blurStrength = params.blurStrength;
  neko.final.shader.uniforms.exposure.value =
    params.badness * params.blurExposure;
  neko.post.shader.uniforms.opacity.value = params.opacity;
  neko.post.shader.uniforms.aberration.value = params.aberration;
  neko.badness = params.badness;
  neko.distortion = params.distortion;
  neko.explosion = params.explosion;

  neko.render(audio.currentTime, camera);
  composer.render(neko.post.fbo);
  requestAnimationFrame(render);
}

function resize() {
  let w = window.innerWidth * settings.scale;
  let h = window.innerHeight * settings.scale;
  renderer.setSize(w, h);
  renderer.domElement.style.width = "100%";
  renderer.domElement.style.height = "100%";

  const dPR = window.devicePixelRatio;
  w *= dPR;
  h *= dPR;
  neko.setSize(w, h);
  composer.setSize(w, h);
}

window.addEventListener("resize", resize);

const audio = loadAudio("assets/track.mp3");

onProgress((progress) => {
  loading.textContent = `Loading ${progress.toFixed(0)}%`;
});

async function init() {
  console.log("Loading...");
  await allLoaded();
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
}

function run() {
  start.style.display = "none";
  console.log("Start");
  // audio.muted = true;
  // audio.play();
  //audio.controls = true;
  //document.body.append(audio);
  render();
}

init();
