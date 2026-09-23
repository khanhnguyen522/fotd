const express = require("express");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { generateOutfits } = require("../services/outfitGenerator");
const { asyncHandler } = require("../utils/asyncHandler");
const { signOutfit } = require("../utils/signedItems");

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

module.exports = router;
