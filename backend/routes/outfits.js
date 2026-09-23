const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { generateOutfits } = require("../services/outfitGenerator");
const { fetchCurrentWeather } = require("../services/weather");
const { asyncHandler } = require("../utils/asyncHandler");
const { signOutfit } = require("../utils/signedItems");
const { isRainy, isWindy } = require("../utils/weatherConditions");
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

router.get(
  "/weather",
  requireAuth,
  asyncHandler("GET OUTFITS BY WEATHER", async (req, res) => {
    const { lat, lon } = req.query;
    if (!lat || !lon) {
      return res.status(400).json({ error: "lat and lon are required" });
    }

    const { temperatureF, precipitationMm, windSpeedMph } =
      await fetchCurrentWeather(lat, lon);
    const seasons = temperatureToSeasons(temperatureF);
    const rainy = isRainy(precipitationMm);
    const windy = isWindy(windSpeedMph);

    const result = await pool.query("SELECT * FROM items");
    const outfits = generateOutfits(result.rows, { season: seasons, count: 5 });

    const weather = { temperatureF, seasons, isRainy: rainy, isWindy: windy };

    if (outfits.error) {
      return res.json({ ...weather, ...outfits });
    }

    const signedOutfits = await Promise.all(outfits.map(signOutfit));
    res.json({ ...weather, outfits: signedOutfits });
  }),
);

module.exports = router;
