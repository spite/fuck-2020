import { Matrix4, Quaternion, Vector3 } from "../third_party/three.module.js";
import Maf from "../third_party/Maf.js";

import { path as cute1 } from "../paths/cute001.js";
import { path as cute2 } from "../paths/cute002.js";
import { path as cute3 } from "../paths/cute003.js";
import { path as cute4 } from "../paths/cute004.js";
import { path as cute5 } from "../paths/cute005.js";
import { path as cute6 } from "../paths/cute006.js";
import { path as cute7 } from "../paths/cute007.js";

import { path as dark1 } from "../paths/dark001.js"; // slow boom down from back
import { path as dark2 } from "../paths/dark002.js"; // dolly out from bell
import { path as dark3 } from "../paths/dark003.js"; // dolly in to left side
import { path as dark4 } from "../paths/dark004.js"; // truck from above
import { path as dark5 } from "../paths/dark005.js"; // truck/roll from bottom close up
import { path as dark6 } from "../paths/dark006.js"; // slow boom up from side
import { path as dark7 } from "../paths/dark007.js"; // slow dolly in from below
import { path as dark8 } from "../paths/dark008.js"; // orbit up and down
import { path as dark9 } from "../paths/dark009.js"; // exagerated orbit around
import { path as dark10 } from "../paths/dark010.js"; //
import { path as dark11 } from "../paths/dark011.js";
import { path as dark12 } from "../paths/dark012.js";

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

  dark001: { keyframes: parsePath(dark1), loops: false },
  dark002: { keyframes: parsePath(dark2), loops: false },
  dark003: { keyframes: parsePath(dark3), loops: false },
  dark004: { keyframes: parsePath(dark4), loops: false },
  dark005: { keyframes: parsePath(dark5), loops: false },
  dark006: { keyframes: parsePath(dark6), loops: false },
  dark007: { keyframes: parsePath(dark7), loops: false },
  dark008: { keyframes: parsePath(dark8), loops: true }, // orbit
  dark009: { keyframes: parsePath(dark9), loops: true }, // orbit
  dark010: { keyframes: parsePath(dark10), loops: true }, // orbit
  dark011: { keyframes: parsePath(dark11), loops: true }, // orbit
  dark012: { keyframes: parsePath(dark12), loops: true }, // orbit
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
    t = Maf.mod(t, frames);
  } else {
    t = Math.min(t, frames - 1);
  }
  const frame = Math.floor(t);
  const delta = t - frame;
  const from = keyframes[frame];
  let toFrame = frame + 1;
  if (path.loops) {
    toFrame = Maf.mod(toFrame, frames);
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
