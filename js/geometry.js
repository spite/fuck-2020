import { Vector3 } from "../third_party/three.module.js";
import Maf from "../third_party/maf.js";

function dot2(v) {
  return v.dot(v);
}

function sdTetrahedron(p, size, roundness) {
  const k = Math.sqrt(2.0);

  p.multiplyScalar(size);

  p.x = Math.abs(p.x);
  p.z = Math.abs(p.z);

  let m = 2.0 * p.z - k * p.y - 1.0;

  p = m > 0.0 ? p : new Vector3(p.z, -p.y, p.x);

  let s1 = Maf.clamp(p.x, 0.0, 1.0);
  let s2 = Maf.clamp((p.x - p.y * k - p.z + 2.0) / 4.0, 0.0, 1.0);

  m = 2.0 * p.z - k * p.y - 1.0;

  const d =
    Math.sign(m) *
    Math.sqrt(
      Math.sign(p.y * k + p.z + 1.0) +
        Math.sign(2.0 - 3.0 * p.x - k * p.y - p.z) <
        1.0
        ? Math.min(
            dot2(new Vector3(s1, -k * 0.5, 0).sub(p)),
            dot2(new Vector3(s2, k * 0.5 - k * s2, 1.0 - s2).sub(p))
          )
        : (m * m) / 6.0
    );

  return d / size - roundness;
}

function sdRoundBox(p, b, r) {
  const q = new Vector3();
  q.set(Math.abs(p.x), Math.abs(p.y), Math.abs(p.z));
  q.sub(b);
  const t1 = q.clone().max(new Vector3(0, 0, 0)).length();
  return t1 + Math.min(Math.max(q.x, Math.max(q.y, q.z)), 0.0) - r;
}

function sdSphere(p, s) {
  return p.length() - s;
}

export { sdSphere, sdTetrahedron, sdRoundBox };
