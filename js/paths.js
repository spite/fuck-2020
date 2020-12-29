import { Matrix4, Quaternion, Vector3 } from "../third_party/three.module.js";
import { path as light1 } from "../paths/light1.js";

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

const path1 = parsePath(light1);

const lerpPos = new Vector3();
const lerpQuat = new Quaternion();

function moveToKeyframe(path, object, time) {
  const frames = path1.length;
  const duration = frames / 60;
  const t = ((time * frames) / duration) % frames;
  const frame = Math.floor(t);
  const delta = t - frame;
  const from = path1[frame];
  const to = path1[(frame + 1) % frames];
  lerpPos.copy(from.position).lerp(to.position, delta);
  lerpQuat.copy(from.rotation).slerp(to.rotation, delta);
  object.position.copy(lerpPos);
  object.quaternion.copy(lerpQuat);
}

export { moveToKeyframe };
