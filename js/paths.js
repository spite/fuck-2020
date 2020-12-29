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

function parsePath(path) {
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
  cute001: parsePath(cute1),
  cute002: parsePath(cute2),
  cute003: parsePath(cute3),
  cute004: parsePath(cute4),
  cute005: parsePath(cute5),
  cute006: parsePath(cute6),
  cute007: parsePath(cute7),
};

const lerpPos = new Vector3();
const lerpQuat = new Quaternion();

function moveToKeyframe(pathName, object, time) {
  const path = paths[pathName];
  const frames = path.length;
  const duration = frames / 60;
  const t = ((time * frames) / duration) % frames;
  const frame = Math.floor(t);
  const delta = t - frame;
  const from = path[frame];
  const to = path[(frame + 1) % frames];
  lerpPos.copy(from.position).lerp(to.position, delta);
  lerpQuat.copy(from.rotation).slerp(to.rotation, delta);
  object.position.copy(lerpPos);
  object.quaternion.copy(lerpQuat);
}

export { moveToKeyframe };
