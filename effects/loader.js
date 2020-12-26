import { TextureLoader } from "../third_party/three.module.js";
import { addPromise } from "../js/loader.js";
import { OBJLoader } from "../third_party/OBJLoader.js";

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

export { loadTexture, loadObject };
