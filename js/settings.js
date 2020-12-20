const low = {
  scale: 0.5,
  tessellation: 4,
  blur: 5,
  chromaticSteps: 6,
  blurSteps: 3,
};

const medium = {
  scale: 1,
  tessellation: 5,
  blur: 5,
  chromaticSteps: 12,
  blurSteps: 4,
};

const high = {
  scale: 1,
  tessellation: 7,
  blur: 13,
  chromaticSteps: 24,
  blurSteps: 5,
};

const ultra = {
  scale: 1,
  tessellation: 7,
  blur: 13,
  chromaticSteps: 100,
  blurSteps: 5,
};

const preset = window.location.hash.substr(1);

const presets = {
  low: low,
  medium: medium,
  high: high,
  ultra: ultra,
};

const settings = presets[preset] ? presets[preset] : high;

export { settings };
