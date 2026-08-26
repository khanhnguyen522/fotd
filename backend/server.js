require("dotenv").config(); // MUST be first — local modules (./s3) read process.env at require-time

const express = require("express");
const cors = require("cors");
const multer = require("multer");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const pool = require("./db");
const { tagClothingImage } = require("./aiTagging");
const { generateOutfits } = require("./outfitGenerator");
const { requireAuth } = require("./authMiddleware");
const { uploadToS3, deleteFromS3, getSignedPhotoUrl } = require("./s3");

const app = express();
app.use(cors());
app.use(express.json());

// no more local disk storage — files stay in memory just long enough to upload to S3
const upload = multer({ storage: multer.memoryStorage() });

// build a safe S3 key for a wardrobe item (never undefined/empty)
const buildImageKey = (originalname) => {
  const safeName = (originalname || "item").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `wardrobe/${Date.now()}-${safeName}`;
};

// attach a fresh signed URL to a single item row
const withSignedUrl = async (item) => ({
  ...item,
  image_url: await getSignedPhotoUrl(item.image_url),
});

// attach signed URLs to every item slot in a generated outfit
const signOutfit = async (outfit) => {
  const signed = {};
  for (const [slot, item] of Object.entries(outfit)) {
    signed[slot] = item ? await withSignedUrl(item) : null;
  }
  return signed;
};

app.get("/health", async (req, res) => {
  try {
    await pool.query("SELECT 1");
    res.json({ status: "ok", db: "connected" });
  } catch (err) {
    res
      .status(500)
      .json({ status: "error", db: "disconnected", message: err.message });
  }
});

// login — single shared password for the one owner of this app.
app.post("/auth/login", async (req, res) => {
  try {
    const { password } = req.body;
    if (!password) {
      return res.status(400).json({ error: "Password is required" });
    }

    const validPassword = await bcrypt.compare(
      password,
      process.env.APP_PASSWORD_HASH,
    );

    if (!validPassword) {
      return res.status(401).json({ error: "Wrong password" });
    }

    const token = jwt.sign({ role: "owner" }, process.env.JWT_SECRET, {
      expiresIn: "30d",
    });

    res.json({ token });
  } catch (err) {
    console.error("LOGIN ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// upload route — accepts a single file from the field named "image"
app.post("/items", requireAuth, upload.single("image"), async (req, res) => {
  try {
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
    console.log(
      "UPLOAD: uploading to S3 with key =",
      key,
      "bucket =",
      process.env.S3_BUCKET_NAME,
    );
    await uploadToS3(uploadBuffer, key, uploadMimeType);

    const result = await pool.query(
      "INSERT INTO items (image_url, category, color, seasons) VALUES ($1, $2, $3, $4) RETURNING *",
      [key, tags.category, tags.color, tags.seasons],
    );

    res.status(201).json(await withSignedUrl(result.rows[0]));
  } catch (err) {
    console.error("UPLOAD ITEM ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

app.get("/outfits", requireAuth, async (req, res) => {
  try {
    const { season } = req.query; // optional
    const result = await pool.query("SELECT * FROM items");
    const outfits = generateOutfits(result.rows, { season, count: 5 });

    if (outfits.error) {
      return res.json(outfits); // pass through the "not enough items" message as-is
    }

    const signedOutfits = await Promise.all(outfits.map(signOutfit));
    res.json(signedOutfits);
  } catch (err) {
    console.error("GET OUTFITS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// get all wardrobe items
app.get("/items", requireAuth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error("GET ITEMS ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// update an item's tags (category, color, seasons, note)
app.put("/items/:id", requireAuth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error("UPDATE ITEM ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

// delete an item and its S3 image
app.delete("/items/:id", requireAuth, async (req, res) => {
  try {
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
  } catch (err) {
    console.error("DELETE ITEM ERROR:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
