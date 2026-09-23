// Turn a Fahrenheit temperature into the season tag(s) whose clothing would
// be appropriate. Items are already tagged with one or more of
// spring/summer/fall/winter/all, so weather-based filtering just needs to
// pick the right season bucket(s) and reuse the existing filterBySeason logic
// — no change to how items are tagged.
const BANDS = [
  { max: 35, seasons: ["winter"] },
  { max: 50, seasons: ["fall", "winter"] },
  { max: 65, seasons: ["spring", "fall"] },
  { max: 78, seasons: ["spring", "summer"] },
  { max: Infinity, seasons: ["summer"] },
];

const temperatureToSeasons = (temperatureF) => {
  const band =
    BANDS.find((b) => temperatureF < b.max) || BANDS[BANDS.length - 1];
  return band.seasons;
};

module.exports = { temperatureToSeasons };
