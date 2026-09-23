const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { generateOutfits } = require("../services/outfitGenerator");
const { fetchCurrentTemperatureF } = require("../services/weather");
const { asyncHandler } = require("../utils/asyncHandler");
const { signOutfit } = require("../utils/signedItems");
const { temperatureToSeasons } = require("../utils/weatherToSeasons");

const router = express.Router();

router.get(
  "/",
  requireAuth,
  asyncHandler("GET OUTFITS", async (req, res) => {
    const { season } = req.query; // optional
    const result = await pool.query("SELECT * FROM items");
    const outfits = generateOutfits(result.rows, { season, count: 5 });

    if (outfits.error) {
      return res.json(outfits); // pass through the "not enough items" message as-is
    }

    const signedOutfits = await Promise.all(outfits.map(signOutfit));
    res.json(signedOutfits);
  }),
);

// weather-based generation — same ranking logic as "/", but the season
// filter is derived from the current temperature at the given coordinates
// instead of a manually picked season pill
router.get(
  "/weather",
  requireAuth,
  asyncHandler("GET OUTFITS BY WEATHER", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon are required" });
    }

    const temperatureF = await fetchCurrentTemperatureF(lat, lon);
    const seasons = temperatureToSeasons(temperatureF);

    const result = await pool.query("SELECT * FROM items");
    const outfits = generateOutfits(result.rows, { season: seasons, count: 5 });

    if (outfits.error) {
      return res.json({ temperatureF, seasons, ...outfits });
    }

    const signedOutfits = await Promise.all(outfits.map(signOutfit));
    res.json({ temperatureF, seasons, outfits: signedOutfits });
  }),
);

module.exports = router;
