import { TextureLoader } from "../third_party/three.module.js";
import { addPromise } from "../js/loader.js";
import { OBJLoader } from "../third_party/OBJLoader.js";
import { GLTFLoader } from "../third_party/GLTFLoader.js";
import { ColladaLoader } from "../third_party/ColladaLoader.js";

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

export { loadTexture, loadObject, loadGLTF, loadDAE };
