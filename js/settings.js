const low = {
  scale: 0.5,
  tessellation: 4,
  blur: 5,
  chromaticSteps: 6,
  blurSteps: 3,
  reflectionSize: 512,
  textureSize: "1k",
  textScale: 0.5,
  NSFW: true,
};

const medium = {
  scale: 1,
  tessellation: 5,
  blur: 5,
  chromaticSteps: 12,
  blurSteps: 4,
  reflectionSize: 1024,
  textureSize: "2k",
  textScale: 1,
  NSFW: true,
};

const high = {
  scale: 1,
  tessellation: 7,
  blur: 13,
  chromaticSteps: 24,
  blurSteps: 5,
  reflectionSize: 2048,
  textScale: 1,
  textureSize: "4k",
  NSFW: true,
};

const ultra = {
  scale: 1,
  tessellation: 7,
  blur: 13,
  chromaticSteps: 100,
  blurSteps: 5,
  reflectionSize: 4096,
  textScale: 1,
  textureSize: "4k",
  NSFW: true,
};

const presets = {
  low: low,
  medium: medium,
  high: high,
  ultra: ultra,
};

let settings = high;

function setPreset(quality, NSFW) {
  settings = presets[quality] ? presets[quality] : high;
  settings.NSFW = NSFW;
}

export { settings, presets, setPreset };
