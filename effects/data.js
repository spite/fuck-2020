const fuckings = [
  "Coronavirus",
  "Bushfires",
  "Trump",
  "Scalpers",
  "2020",
  "24H news cycle",
  "Influencers",
  "Quarantine",
  "Earthquakes",
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
  "Pandemics",
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
  "The GOP",
  "Cryptoart",
  "Terrorism",
  "Global warming",
  "Economic depression",
  "Police Brutality",
  "Trump",
  "Oil prices",
  "institutional racism",
  "Brexit",
  "Ebola",
  "Anti-vaxxers",
  "Social media",
  "Runaway capitalism",
  "Anti-maskers",
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
    return "FMMXX";
  }
  if (t >= 75.801 && t < 80.856) {
    return "ART ACIDBEAT";
  }
  if (t >= 80.856 && t < 85.835) {
    return "MUSIC GLOOM";
  }
  if (t >= 85.835 && t < 90.362) {
    return "CODE SPITE";
  }

  const et = t - 30.313;
  const beatDuration = 1 * 0.631;
  const beats = Math.floor(et / beatDuration) - 1;
  return isEven(beats) ? fuckings[beats / 2] : "FUCK";
}

export { getFucking };
