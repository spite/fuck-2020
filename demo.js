import {
  WebGLRenderer,
  sRGBEncoding,
  PCFSoftShadowMap,
  ACESFilmicToneMapping,
} from "./third_party/three.module.js";
import { OrbitControls } from "./third_party/OrbitControls.js";
import { Effect as NekoEffect } from "./effects/neko.js";
import { Composer } from "./js/Composer.js";
import * as dat from "./third_party/dat.gui.module.js";
import { canDoTexLOD, canDoFloatLinear } from "./js/features.js";
import { settings } from "./js/settings.js";

const gui = new dat.GUI();

const params = {
  blurExposure: 0.5,
  blurRadius: 1,
  blurStrength: 1,
  aberration: 0.1,
  opacity: 1,
  distortion: 0.05,
};

const postFolder = gui.addFolder("Post");
postFolder.add(params, "blurExposure", 0, 3, 0.01);
postFolder.add(params, "blurRadius", 0, 1, 0.01);
postFolder.add(params, "blurStrength", 0, 2, 0.01);
postFolder.add(params, "aberration", 0, 1, 0.01);
postFolder.add(params, "opacity", 0, 1, 0.01);
postFolder.add(params, "distortion", 0, 0.5, 0.01);
postFolder.open();

const canvas = document.createElement("canvas");
document.body.append(canvas);
//const context = canvas.getContext("webgl");

const renderer = new WebGLRenderer({
  canvas,
  preserveDrawingBuffer: false,
  antialias: false,
  powerPreference: "high-performance",
});
renderer.setPixelRatio(window.devicePixelRatio);
renderer.setClearColor(0, 1);
renderer.outputEncoding = sRGBEncoding;
//renderer.gammaFactor = 2.2;
renderer.toneMapping = ACESFilmicToneMapping;
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = PCFSoftShadowMap;
renderer.extensions.get("OES_standard_derivatives");
if (canDoTexLOD()) {
  renderer.extensions.get("EXT_shader_texture_lod");
}
if (canDoFloatLinear()) {
  renderer.extensions.get("OES_texture_float");
  renderer.extensions.get("OES_texture_float_linear");
  renderer.extensions.get("WEBGL_color_buffer_float");
} else {
  renderer.extensions.get("OES_texture_half_float");
  renderer.extensions.get("OES_texture_half_float_linear");
  renderer.extensions.get("EXT_color_buffer_half_float");
}

const composer = new Composer(renderer, 1, 1);

const effects = [];
const intro = new NekoEffect(renderer, gui);

effects.push(intro);

const controls = new OrbitControls(intro.camera, renderer.domElement);
controls.screenSpacePanning = true;

const loading = document.querySelector("#loading");
const start = document.querySelector("#start");
start.addEventListener("click", () => {
  run();
});

function render(t) {
  intro.final.shader.uniforms.radius.value = params.blurRadius;
  intro.blurStrength = params.blurStrength;
  intro.final.shader.uniforms.exposure.value = params.blurExposure;
  intro.post.shader.uniforms.opacity.value = params.opacity;
  intro.post.shader.uniforms.aberration.value = params.aberration;
  intro.cylinderMat.uniforms.distortion.value = params.distortion;

  intro.render(audio.currentTime);
  //composer.render(intro.post.fbo);
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
  intro.setSize(w, h);
  composer.setSize(w, h);
}

window.addEventListener("resize", resize);

const audio = document.createElement("audio");
audio.src = "./assets/track.mp3";
audio.preload = true;
const audioPromise = new Promise((resolve, reject) => {
  audio.addEventListener("canplay", (e) => {
    resolve();
  });
});

window.promises = [];

async function init() {
  console.log("Loading...");
  const preload = []; //[audioPromise];
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
  //audio.play();
  //audio.controls = true;
  //document.body.append(audio);
  render();
}

init();
