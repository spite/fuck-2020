import Maf from "../third_party/Maf.js";
import Easings from "../third_party/easings.js";

const fuckings = [
  "Coronavirus",
  "Bushfires",
  "Trump",
  "Scalpers",
  "2020",
  "24H news cycle",
  "Influencers",
  "Anti-maskers",
  "The GOP",
  "Trump",
  "QRedditAnon",
  "Nazis",
  "Facebook",
  "Cyclones",
  "Joe Rogan",
  "Fragile male egos",
  "Jordan Petersen",
  "2020",
  "the stock market",
  "Behringer",
  "Trump",
  "Society",
  "Selfishness",
  "Bitcoin",
  "harvey weinstein",
  "Wildfires",
  "Ebola",
  "2020",
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
  "Cryptoart",
  "Terrorism",
  "Global warming",
  "Economic depression",
  "Police Brutality",
  "Trump",
  "Oil prices",
  "institutional racism",
  "Brexit",
  "Anti-vaxxers",
  "Social media",
  "Runaway capitalism",
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

function getFucking(t) {
  if (t >= 70.736 && t < 75.801) {
    const v = Maf.map(70.736, 75.801, 0, 1, t);
    return { text: "FMMXX", opacity: Maf.parabola(v, 1) };
  }
  if (t >= 75.801 && t < 80.856) {
    const v = Maf.map(75.801, 80.856, 0, 1, t);
    return { text: "ART ACIDBEAT", opacity: Maf.parabola(v, 1) };
  }
  if (t >= 80.856 && t < 85.835) {
    const v = Maf.map(80.856, 85.835, 0, 1, t);
    return { text: "MUSIC GLOOM", opacity: Maf.parabola(v, 1) };
  }
  if (t >= 85.835 && t < 90.362) {
    const v = Maf.map(85.835, 90.362, 0, 1, t);
    return { text: "CODE SPITE", opacity: Maf.parabola(v, 1) };
  }
  if (t > 111.09) {
    const v = Maf.clamp(t - 111.09, 0, 1);
    return { text: "FUCK 2020", opacity: v };
  }

  const et = t - 30.313;
  const beatDuration = 1 * 0.631;
  const beats = Math.floor(et / beatDuration) - 1;
  const text = isEven(beats) ? fuckings[beats / 2] : "FUCK";
  const opacity = Easings.InOutQuint(
    Maf.parabola(Maf.mod(et, beatDuration) / beatDuration, 1)
  );
  return { text, opacity };
}

export { getFucking };
