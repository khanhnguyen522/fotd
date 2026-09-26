// hex → HSL conversion, plus a hue-distance-based color harmony score.
// This is a richer alternative to the name-based COLOR_COMPATIBILITY table
// in outfitGenerator.js, used once an item has a dominant_color hex from
// aiTagging.js. Falls back to the old name-based score for items that
// don't have one (e.g. items tagged before this field existed).

const hexToHSL = (hex) => {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h *= 60;
  }

  return { h, s: s * 100, l: l * 100 };
};

// near-black, near-white, near-gray, or heavily desaturated (beige-like)
// colors pair with almost everything — treat them as a special case
// rather than judging them by hue angle, which is meaningless for grays.
const NEUTRAL_SATURATION_MAX = 15;
const NEUTRAL_LIGHTNESS_MIN = 12;
const NEUTRAL_LIGHTNESS_MAX = 92;

const isNeutral = ({ s, l }) =>
  s < NEUTRAL_SATURATION_MAX ||
  l < NEUTRAL_LIGHTNESS_MIN ||
  l > NEUTRAL_LIGHTNESS_MAX;

// known-harmonious hue-distance angles: 0 = monochrome, 30 = analogous,
// 120 = triadic, 180 = complementary
const HARMONY_ANGLES = [0, 30, 120, 180];
const NEUTRAL_SCORE = 90;
const FALLOFF_PER_DEGREE = 2.5; // points lost per degree away from the nearest harmony angle

// score 0-100: how well two hex colors pair together
const colorScore = (hexA, hexB) => {
  const hslA = hexToHSL(hexA);
  const hslB = hexToHSL(hexB);

  if (isNeutral(hslA) || isNeutral(hslB)) {
    return NEUTRAL_SCORE;
  }

  let diff = Math.abs(hslA.h - hslB.h);
  diff = Math.min(diff, 360 - diff); // circular distance

  const closest = Math.min(...HARMONY_ANGLES.map((t) => Math.abs(diff - t)));
  return Math.max(0, 100 - closest * FALLOFF_PER_DEGREE);
};

module.exports = { hexToHSL, isNeutral, colorScore };
