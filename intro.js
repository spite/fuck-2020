import { setPreset, presets } from "./js/settings.js";

let nsfw = true;

const sfwSpan = document.querySelector(".sfw");
const nsfwSpan = document.querySelector(".nsfw");
sfwSpan.addEventListener("click", () => {
  nsfw = false;
  sfwSpan.style.fontWeight = "bold";
  nsfwSpan.style.fontWeight = "normal";
});
nsfwSpan.addEventListener("click", () => {
  nsfw = true;
  nsfwSpan.style.fontWeight = "bold";
  sfwSpan.style.fontWeight = "normal";
});

const loading = document.querySelector("#loading");
const quality = document.querySelector("#quality");
const presetsDiv = quality.querySelector("p.presets");
for (const preset of Object.keys(presets)) {
  const a = document.createElement("a");
  a.textContent = preset;
  presetsDiv.append(a);
  a.addEventListener("click", (e) => {
    load(preset);
  });
}
presetsDiv.firstChild.remove();

async function load(preset) {
  loading.style.display = "flex";
  quality.style.display = "none";
  setPreset(preset, nsfw);
  if (document.body.webkitRequestFullscreen) {
    document.body.webkitRequestFullscreen();
  } else {
    document.body.requestFullscreen();
  }
  await import("./demo.js");
}

//load("medium");
