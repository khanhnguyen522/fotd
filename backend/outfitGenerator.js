// basic color compatibility rules — pairs of colors considered to go well together
const COLOR_COMPATIBILITY = {
  black: ["white", "gray", "red", "blue", "beige", "pink", "black"],
  white: ["black", "blue", "red", "green", "gray", "brown", "white"],
  blue: ["white", "gray", "beige", "brown", "black"],
  gray: ["black", "white", "blue", "pink", "red"],
  beige: ["blue", "brown", "white", "black", "green"],
  brown: ["beige", "white", "blue", "green"],
  red: ["black", "white", "gray", "beige"],
  green: ["white", "beige", "brown", "gray"],
  pink: ["gray", "white", "black"],
};

// score how well two colors pair together
const colorScore = (colorA, colorB) => {
  if (!colorA || !colorB) {
    return 0;
  }
  const a = colorA.toLowerCase();
  const b = colorB.toLowerCase();
  if (a === b) {
    return 1; // matching colors are a safe pairing
  }
  if (COLOR_COMPATIBILITY[a]?.includes(b)) {
    return 2; // known good pairing
  }
  return 0; // unknown pairing, neutral/no bonus
};

// filter items by season — items can belong to multiple seasons
// (e.g. seasons: ["fall", "winter"]). Items tagged "all", or with no
// seasons set at all, match every season filter.
const filterBySeason = (items, season) => {
  if (!season) {
    return items;
  }
  return items.filter((item) => {
    const seasons = item.seasons || [];
    if (!seasons.length) {
      return true;
    }
    if (seasons.includes("all")) {
      return true;
    }
    return seasons.includes(season);
  });
};

// group items by category
const groupByCategory = (items) => {
  const groups = {
    top: [],
    midlayer: [],
    bottom: [],
    shoes: [],
    outerwear: [],
    accessory: [],
  };
  items.forEach((item) => {
    if (groups[item.category]) {
      groups[item.category].push(item);
    }
  });
  return groups;
};

// score a full outfit combination by summing pairwise color compatibility
const scoreOutfit = (outfit) => {
  const pieces = Object.values(outfit).filter(Boolean);
  let score = 0;
  for (let i = 0; i < pieces.length; i++) {
    for (let j = i + 1; j < pieces.length; j++) {
      score += colorScore(pieces[i].color, pieces[j].color);
    }
  }
  return score;
};

// generate outfit suggestions: sample random combinations, then rank by color score
const generateOutfits = (items, { season = null, count = 5 } = {}) => {
  const filtered = filterBySeason(items, season);
  const grouped = groupByCategory(filtered);

  // must have at least one top, bottom, and shoes to form a valid outfit
  if (!grouped.top.length || !grouped.bottom.length || !grouped.shoes.length) {
    return {
      error:
        "Not enough items to generate an outfit. Need at least one top, bottom, and shoes.",
    };
  }

  const candidates = [];
  const SAMPLE_SIZE = 20; // how many random combinations to try before ranking

  for (let i = 0; i < SAMPLE_SIZE; i++) {
    const outfit = {
      top: grouped.top[Math.floor(Math.random() * grouped.top.length)],
      midlayer: grouped.midlayer.length
        ? grouped.midlayer[Math.floor(Math.random() * grouped.midlayer.length)]
        : null,
      bottom: grouped.bottom[Math.floor(Math.random() * grouped.bottom.length)],
      shoes: grouped.shoes[Math.floor(Math.random() * grouped.shoes.length)],
      outerwear: grouped.outerwear.length
        ? grouped.outerwear[
            Math.floor(Math.random() * grouped.outerwear.length)
          ]
        : null,
    };
    candidates.push({ outfit, score: scoreOutfit(outfit) });
  }

  // sort by score descending, take the top N, and de-duplicate identical combinations
  const seen = new Set();
  const ranked = candidates
    .sort((a, b) => b.score - a.score)
    .filter((c) => {
      const key = Object.values(c.outfit)
        .map((i) => i?.id)
        .join("-");
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    })
    .slice(0, count);

  return ranked.map((c) => c.outfit);
};

module.exports = { generateOutfits };
