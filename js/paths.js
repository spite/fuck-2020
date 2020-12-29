import { Matrix4, Quaternion, Vector3 } from "../third_party/three.module.js";
import { path as cute1 } from "../paths/cute001.js";
import { path as cute2 } from "../paths/cute002.js";
import { path as cute3 } from "../paths/cute003.js";
import { path as cute4 } from "../paths/cute004.js";
import { path as cute5 } from "../paths/cute005.js";
import { path as cute6 } from "../paths/cute006.js";
import { path as cute7 } from "../paths/cute007.js";

const rot = new Matrix4();
rot.matrixWorldNeedsUpdate = true;
rot.set(1, 0, 0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 0, 1);

function parsePath(path, loops) {
  const values = path.split(" ").map((v) => parseFloat(v));
  const keyframes = [];
  const m = new Matrix4();
  do {
    const elements = values.splice(0, 16);
    m.set(...elements);
    m.multiply(rot);
    const position = new Vector3();
    const rotation = new Quaternion();
    const scale = new Vector3();
    m.decompose(position, rotation, scale);
    keyframes.push({ position, rotation, matrix: m.clone() });
  } while (values.length > 0);
  return keyframes;
}

const paths = {
  cute001: { keyframes: parsePath(cute1), loops: false },
  cute002: { keyframes: parsePath(cute2), loops: false },
  cute003: { keyframes: parsePath(cute3), loops: false },
  cute004: { keyframes: parsePath(cute4), loops: false },
  cute005: { keyframes: parsePath(cute5), loops: false },
  cute006: { keyframes: parsePath(cute6), loops: false },
  cute007: { keyframes: parsePath(cute7), loops: false },
};

const lerpPos = new Vector3();
const lerpQuat = new Quaternion();

function moveToKeyframe(pathName, object, time) {
  //console.log(pathName, time);
  const path = paths[pathName];
  const keyframes = path.keyframes;
  const frames = keyframes.length;
  const duration = frames / 60;
  let t = (time * frames) / duration;
  if (path.loops) {
    t = t % frames;
  } else {
    t = Math.min(t, frames - 1);
  }
  const frame = Math.floor(t);
  const delta = t - frame;
  const from = keyframes[frame];
  let toFrame = frame + 1;
  if (path.loops) {
    toFrame = toFrame % frames;
  } else {
    toFrame = Math.min(toFrame, frames - 1);
  }
  const to = keyframes[toFrame];
  lerpPos.copy(from.position).lerp(to.position, delta);
  lerpQuat.copy(from.rotation).slerp(to.rotation, delta);
  object.position.copy(lerpPos);
  object.quaternion.copy(lerpQuat);
}

export { moveToKeyframe };
