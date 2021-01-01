import Maf from "../third_party/Maf.js";
import Easings from "../third_party/easings.js";
import { settings } from "../js/settings.js";

const fuckings = [
  "Coronavirus",
  "Bushfires",
  "Trump",
  "Scalpers",
  "exceptionalism",
  "24H news cycle",
  "Influencers",
  "totalitarism",
  "The GOP",
  "Trump",
  "QRedditAnon",
  "Nazis",
  "Facebook",
  "Fragile male egos",
  "",
  "",
  "Jordan Peterson",
  "Cyclones",
  "the stock market",
  "Behringer",
  "Trump",
  "Society",
  "Selfishness",
  "Bitcoin",
  "harvey weinstein",
  "Wildfires",
  "Ebola",
  "Joe Rogan",
  "First wave",
  "Second wave",
  "Third Wave",
  "Trump",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "",
  "2020",
  "Global warming",
  "No healthcare",
  "Speculation",
  "Anti-maskers",
  "Terrorism",
  "Global warming",
  "$$$ Depression",
  "Police Brutality",
  "Trump",
  "Oil prices",
  "Racism",
  "Brexit",
  "Anti-vaxxers",
  "Social media",
  "Wild capitalism",
  "this wasted year",
  "2020",
  "2020",
  "2020",
  "2020",
  "2020",
].map((v) => v.toUpperCase());

function isEven(n) {
  return n % 2 == 0;
}

function getFuck() {
  return settings.NSFW ? "FUCK" : "F**K";
}

function getFucking(t) {
  if (t >= 70.736 && t < 75.801) {
    const v = Maf.map(70.736, 75.801, 0, 1, t);
    return { text: "F*MMXX", opacity: Maf.parabola(v, 1), color: 0xffffff };
  }
  if (t >= 75.801 && t < 80.856) {
    const v = Maf.map(75.801, 80.856, 0, 1, t);
    return {
      text: "ART ACIDBEAT",
      opacity: Maf.parabola(v, 1),
      color: 0xffffff,
    };
  }
  if (t >= 80.856 && t < 85.835) {
    const v = Maf.map(80.856, 85.835, 0, 1, t);
    return {
      text: "MUSIC GLOOM",
      opacity: Maf.parabola(v, 1),
      color: 0xffffff,
    };
  }
  if (t >= 85.835 && t < 90.362) {
    const v = Maf.map(85.835, 90.362, 0, 1, t);
    return { text: "CODE SPITE", opacity: Maf.parabola(v, 1), color: 0xffffff };
  }
  if (t > 111.09) {
    const v = Maf.clamp(t - 111.09, 0, 1);
    return { text: `${getFuck()} 2020`, opacity: v, color: 0xffffff };
  }

  const et = t - 30.313;
  const beatDuration = 1 * 0.631;
  const beats = Math.floor(et / beatDuration) - 1;

  if (beats >= 27 && beats < 31) {
    return { text: "", opacity: 0, color: 0xffffff };
  }

  const text = isEven(beats) ? fuckings[beats / 2] : getFuck();
  const opacity = Easings.InOutQuint(
    Maf.parabola(Maf.mod(et, beatDuration) / beatDuration, 1)
  );
  const alternate = isEven((beats - 1) / 2);
  return {
    text,
    opacity,
    color: isEven(beats) ? 0xffffff : alternate ? 0xf900ff : 0x00d3ff,
  };
}

export { getFucking };
