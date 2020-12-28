import { TextureLoader } from "../third_party/three.module.js";
import { OBJLoader } from "../third_party/OBJLoader.js";
import { GLTFLoader } from "../third_party/GLTFLoader.js";
import { ColladaLoader } from "../third_party/ColladaLoader.js";
import { TTFLoader } from "../third_party/TTFLoader.js";
import { Font } from "../third_party/three.module.js";

const queue = [];
let total = 0;
let itemsLoaded = 0;
let onProgressFn = null;

function onProgress(fn) {
  onProgressFn = fn;
}

function progress() {
  itemsLoaded++;
  if (onProgressFn) {
    onProgressFn((itemsLoaded * 100) / total);
  }
}

function addPromise() {
  let fn;
  const p = new Promise((resolve, reject) => {
    fn = resolve;
  }).then(() => {
    progress();
  });
  queue.push(p);
  total++;
  return fn;
}

function loaded() {
  return Promise.all(queue);
}

const loader = new TextureLoader();

function loadTexture(file) {
  const resolve = addPromise();
  const tex = loader.load(file, () => {
    resolve();
  });
  return tex;
}

const objLoader = new OBJLoader();

function loadObject(file, callback) {
  const resolve = addPromise();
  objLoader.load(file, (e) => {
    callback(e);
    resolve();
  });
}

const gltfLoader = new GLTFLoader();

function loadGLTF(file, callback) {
  const resolve = addPromise();
  gltfLoader.load(file, (e) => {
    callback(e);
    resolve();
  });
}

const colladaLoader = new ColladaLoader();

function loadDAE(file, callback) {
  const resolve = addPromise();
  colladaLoader.load(file, (e) => {
    callback(e.scene);
    resolve();
  });
}

function loadAudio(file, callback) {
  const resolve = addPromise();
  const audio = document.createElement("audio");
  audio.src = file;
  audio.preload = true;
  document.body.append(audio);
  audio.addEventListener("canplay", (e) => {
    if (callback) {
      callback(e);
    }
    resolve();
  });
  return audio;
}

const ttfLoader = new TTFLoader();

function loadTTF(file, callback) {
  const resolve = addPromise();
  ttfLoader.load(file, (json) => {
    if (callback) {
      callback(new Font(json));
    }
    resolve();
  });
}

export {
  addPromise,
  loadTexture,
  loadObject,
  loadGLTF,
  loadDAE,
  loadAudio,
  loadTTF,
  loaded,
  onProgress,
};
