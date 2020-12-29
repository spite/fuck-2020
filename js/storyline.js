import { moveToKeyframe } from "./paths.js";

const segments = [];

let from = 0;
function addSegment(path, to, offset = 0) {
  const duration = to - from;
  segments.push({
    path,
    from,
    to,
    offset,
  });
  from += duration;
}

function parseSegments() {
  console.log(segments);
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

parseSegments();

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
  moveToKeyframe(segment.path, object, t - segment.from + segment.offset);
}

export { keyframe };
