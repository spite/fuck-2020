import { moveToKeyframe } from "./paths.js";
import Maf from "../third_party/Maf.js";
import Easings from "../third_party/easings.js";

function beat(t) {
  const d = 0.631;
  const tt = Maf.mod(0 + ((t - 30.313) % d) / d, 1);
  return tt;
}

function isEven(n) {
  return n % 2 == 0;
}

function pathEaser(t) {
  const baseT = t - 30.313;
  const beatDuration = 1 * 0.631;
  const beats = Math.floor(baseT / beatDuration);
  let newT = 0;
  if (!isEven(beats)) {
    newT += 0.5 * beats * beatDuration;
  } else {
    newT += 0.5 * (beats - 1) * beatDuration;
    newT +=
      Easings.OutQuint(Maf.mod(baseT, beatDuration) / beatDuration) *
      beatDuration;
  }
  return newT;
}

const segments = [];

let from = 0;
function addSegment(path, to, offset = 0, easer = null) {
  const duration = to - from;
  segments.push({
    path,
    from,
    to,
    offset,
    easer,
  });
  from += duration;
}

function addRandomSegment(path, time) {
  let offset = 0;
  switch (path) {
    case "cute001":
      offset = 1.5 + Math.random() * 2;
      break;
    case "cute002":
      offset = 3.6 + Math.random() * 0;
      break;
    case "cute003":
      offset = 1.9 + Math.random() * 3.3;
      break;
    case "cute004":
      offset = 1.5 + Math.random() * 2;
      break;
    case "cute005":
      offset = 0 + Math.random() * 1.5;
      break;
    case "dark004":
      offset = 1 + Math.random() * 4;
      break;
    case "dark008":
      offset = Math.random() * 100;
      break;
    case "dark009":
      offset = Math.random() * 100;
      break;
    case "dark010":
      offset = Math.random() * 100;
      break;
    case "dark012":
      offset = Math.random() * 100;
      break;
  }
  addSegment(path, time, offset);
}

addSegment("cute001", 5.092);
addSegment("cute002", 10.121);
addSegment("cute003", 14.552);

addRandomSegment("cute002", 14.591);
addRandomSegment("cute003", 14.639);
addRandomSegment("cute004", 14.695);
addRandomSegment("cute002", 14.76);
addRandomSegment("cute003", 14.84);
addRandomSegment("cute002", 14.932);
addRandomSegment("cute001", 15.044);
addRandomSegment("cute002", 15.189);

addSegment("cute004", 19.376);

addSegment("cute005", 27.787);

addRandomSegment("cute002", 27.943);
addRandomSegment("cute001", 28.102);
addRandomSegment("cute003", 28.257);
addRandomSegment("cute004", 28.417);
addRandomSegment("cute002", 28.733);
addRandomSegment("cute005", 28.89);
addRandomSegment("cute001", 29.205);
addRandomSegment("cute004", 29.36);
addRandomSegment("cute003", 29.522);
addRandomSegment("cute001", 29.668);
addRandomSegment("cute002", 30.313);

addSegment("dark002", 35.366);
addSegment("dark008", 40.421, null, pathEaser);
addSegment("dark009", 45.473, null, pathEaser);

addRandomSegment("dark008", 47.999);
addRandomSegment("dark009", 48.315);
addRandomSegment("dark004", 48.471);
addRandomSegment("dark008", 48.628);
addRandomSegment("dark009", 48.785);
addRandomSegment("dark012", 48.943);
addRandomSegment("dark008", 49.103);
addRandomSegment("dark009", 49.4);
addRandomSegment("dark012", 49.556);
addRandomSegment("dark008", 49.576);
addRandomSegment("dark009", 49.72);
addRandomSegment("dark012", 49.878);
addRandomSegment("dark008", 50.02);
addRandomSegment("dark009", 50.196);
addRandomSegment("dark012", 50.353);
addRandomSegment("dark008", 50.517);

//addSegment("dark012", 50.517, null, pathEaser);

addSegment("dark008", 55.574, null, pathEaser);
addSegment("dark009", 60.623, null, pathEaser);
addSegment("dark012", 65.683, null, pathEaser);
addSegment("dark008", 70.736, null, pathEaser);

addSegment("dark001", 75.801);
addSegment("dark003", 80.856);
addSegment("dark006", 85.835);
addSegment("dark007", 90.362);

addSegment("dark002", 90.943); // FUCK!

addSegment("dark012", 95.999);
addSegment("dark008", 101.05);
addSegment("dark009", 106.103);
addSegment("dark003", 111.153);

addSegment("dark008", 200);

function findSegmentByTime(t) {
  for (let segment of segments) {
    if (t >= segment.from && t < segment.to) {
      return segment;
    }
  }
}

function keyframe(t, object) {
  const segment = findSegmentByTime(t);
  if (!segment) return;
  if (segment.easer) {
    t = segment.easer(t);
  }
  moveToKeyframe(segment.path, object, t - segment.from + segment.offset);
}

export { keyframe };
