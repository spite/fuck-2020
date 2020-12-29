import { moveToKeyframe } from "./paths.js";

const segments = [];

let from = 0;
function addSegment(path, to) {
  segments.push({
    path,
    from,
    to,
  });
  const duration = to - from;
  from += duration;
}

function parseSegments() {
  console.log(segments);
}

addSegment("cute001", 5.092);
addSegment("cute002", 10.121);
addSegment("cute003", 14.552);

addSegment("cute007", 14.591);
addSegment("cute006", 14.639);
addSegment("cute007", 14.695);
addSegment("cute006", 14.76);
addSegment("cute007", 14.84);
addSegment("cute006", 14.932);
addSegment("cute007", 15.044);
addSegment("cute006", 15.189);

addSegment("cute004", 19.376);

addSegment("cute005", 27.787);

//repique in out
//addSegment("cute006", 16.26);
//addSegment("cute007", 19.376);

// addSegment("cute006", 27.787);
// addSegment("cute007", 127.787);

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
  moveToKeyframe(segment.path, object, t - segment.from);
}

export { keyframe };
