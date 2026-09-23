const express = require("express");
const multer = require("multer");
const pool = require("../config/db");
const { requireAuth } = require("../middleware/auth");
const { tagClothingImage } = require("../services/aiTagging");
const { deleteFromS3, uploadToS3 } = require("../services/s3");
const { asyncHandler } = require("../utils/asyncHandler");
const { buildImageKey } = require("../utils/imageKey");
const { withSignedUrl } = require("../utils/signedItems");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.use(requireAuth);

// upload route — accepts a single file from the field named "image"
router.post(
  "/",
  upload.single("image"),
  asyncHandler("UPLOAD ITEM", async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ error: "No image file was uploaded" });
    }

    // call Claude to auto-tag the clothing item — this also returns a
    // resized/compressed JPEG buffer, which is what we upload to S3
    let tags = { category: null, color: null, seasons: ["all"] };
    let uploadBuffer = req.file.buffer;
    let uploadMimeType = req.file.mimetype;
    try {
      const result = await tagClothingImage(req.file.buffer);
      tags = result.tags;
      uploadBuffer = result.buffer;
      uploadMimeType = result.mimeType;
    } catch (aiErr) {
      console.error("AI tagging failed, saving item without tags:", aiErr);
    }

    const key = buildImageKey(req.file.originalname);
    await uploadToS3(uploadBuffer, key, uploadMimeType);

    const result = await pool.query(
      "INSERT INTO items (image_url, category, color, seasons) VALUES ($1, $2, $3, $4) RETURNING *",
      [key, tags.category, tags.color, tags.seasons],
    );

    res.status(201).json(await withSignedUrl(result.rows[0]));
  }),
);

// get all wardrobe items
router.get(
  "/",
  asyncHandler("GET ITEMS", async (req, res) => {
    const result = await pool.query(
      "SELECT * FROM items ORDER BY created_at DESC",
    );
    const withUrls = await Promise.all(
      result.rows.map(async (row) => {
        try {
          return await withSignedUrl(row);
        } catch (signErr) {
          console.error(
            "SIGN URL ERROR for item",
            row.id,
            "key:",
            row.image_url,
            signErr,
          );
          return { ...row, image_url: null };
        }
      }),
    );
    res.json(withUrls);
  }),
);

// update an item's tags (category, color, seasons, note)
router.put(
  "/:id",
  asyncHandler("UPDATE ITEM", async (req, res) => {
    const { id } = req.params;
    const { category, color, seasons, note } = req.body;

    const result = await pool.query(
      "UPDATE items SET category = $1, color = $2, seasons = $3, note = $4 WHERE id = $5 RETURNING *",
      [category, color, seasons, note, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(await withSignedUrl(result.rows[0]));
  }),
);

// delete an item and its S3 image
router.delete(
  "/:id",
  asyncHandler("DELETE ITEM", async (req, res) => {
    const { id } = req.params;

    const result = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    const deletedItem = result.rows[0];
    await deleteFromS3(deletedItem.image_url);

    res.json({ success: true, deleted: deletedItem });
  }),
);

module.exports = router;
