import { setPreset, presets } from "./js/settings.js";

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
  setPreset(preset, true);
  document.body.requestFullscreen();
  await import("./demo.js");
}

//load("medium");
