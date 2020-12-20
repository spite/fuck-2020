import {
  Vector3,
  LatheGeometry,
  Face3,
  Vector2,
} from "../third_party/three.module.js";
import Maf from "../third_party/Maf.js";

function RoundedFlatTorus(
  radius1,
  radius2,
  radius3,
  radius4,
  steps = 18,
  segments = 72,
  angleStart = 0,
  angleLength = Maf.TAU,
  closed = false
) {
  const cx = radius1;
  const cy = 0;
  const r = 0.1;
  const pts = [];
  const step = Maf.TAU / steps;
  for (let a = 0; a < Maf.TAU; a += step) {
    const ao = a + Maf.TAU / 8;
    const x =
      Math.pow(Math.abs(Math.cos(ao)), radius4 || 0.5) *
      r *
      Math.sign(Math.cos(ao));
    const y =
      Math.pow(Math.abs(Math.sin(ao)), radius4 || 0.5) *
      r *
      Math.sign(Math.sin(ao));
    pts.push(new Vector3(cx + radius2 * x, cy + radius3 * y, 0));
  }
  pts.push(pts[0].clone());
  const geometry = new LatheGeometry(pts, segments, angleStart, angleLength);
  geometry.computeVertexNormals();
  geometry.computeFaceNormals();
  geometry.normalsNeedUpdate = true;
  const l = geometry.vertices.length;

  if (closed) {
    const tmp = new Vector3();
    pts.forEach((p) => tmp.add(p));
    tmp.divideScalar(pts.length);

    const sin = Math.sin(angleStart);
    const cos = Math.cos(angleStart);
    const vv = new Vector3(tmp.x * sin, tmp.y, tmp.x * cos);
    geometry.vertices.push(vv);
    const p = geometry.vertices.length - 1;
    const uu = new Vector3(0, 1, 0);
    const n = vv.clone().normalize().cross(uu);
    for (let i = 0; i < pts.length; i++) {
      geometry.faces.push(new Face3(i, (i + 1) % pts.length, p, n));
      geometry.faceVertexUvs[0].push([
        new Vector2(),
        new Vector2(),
        new Vector2(),
      ]);
    }

    const sin2 = Math.sin(angleStart + angleLength);
    const cos2 = Math.cos(angleStart + angleLength);
    const vv2 = new Vector3(tmp.x * sin2, tmp.y, tmp.x * cos2);
    geometry.vertices.push(vv2);
    const p2 = geometry.vertices.length - 1;
    const ptr = l - pts.length;
    const n2 = vv2.clone().normalize().cross(uu);
    for (let i = 0; i < pts.length; i++) {
      geometry.faces.push(
        new Face3(p2, ptr + ((i + 1) % pts.length), ptr + i, n2)
      );
      geometry.faceVertexUvs[0].push([
        new Vector2(),
        new Vector2(),
        new Vector2(),
      ]);
    }
  }

  return geometry;
}

export { RoundedFlatTorus };
