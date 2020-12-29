const low = {
  scale: 0.5,
  tessellation: 4,
  blur: 5,
  chromaticSteps: 6,
  blurSteps: 3,
  reflectionSize: 512,
};

const medium = {
  scale: 1,
  tessellation: 5,
  blur: 5,
  chromaticSteps: 12,
  blurSteps: 4,
  reflectionSize: 1024,
};

const high = {
  scale: 1,
  tessellation: 7,
  blur: 13,
  chromaticSteps: 24,
  blurSteps: 5,
  reflectionSize: 2048,
};

const ultra = {
  scale: 1,
  tessellation: 7,
  blur: 13,
  chromaticSteps: 100,
  blurSteps: 5,
  reflectionSize: 4096,
};

const presets = {
  low: low,
  medium: medium,
  high: high,
  ultra: ultra,
};

let settings = high;

function setPreset(quality) {
  settings = presets[quality] ? presets[quality] : high;
}

export { settings, presets, setPreset };
