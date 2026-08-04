require("dotenv").config();
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const pool = require("./db");
const { tagClothingImage } = require("./aiTagging");
const { generateOutfits } = require("./outfitGenerator");

const app = express();
app.use(cors());
app.use(express.json());

// serve uploaded images as static files, e.g. http://localhost:3001/uploads/filename.jpg
app.use("/uploads", express.static("uploads"));

// configure multer: save files to uploads/ folder, generate unique filenames
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => {
    const uniqueName =
      Date.now() +
      "-" +
      Math.round(Math.random() * 1e9) +
      path.extname(file.originalname);
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

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

// upload route — accepts a single file from the field named "image"
app.post("/items", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: "No image file was uploaded" });
    }

    const imageUrl = `${process.env.BASE_URL}/uploads/${req.file.filename}`;
    const imagePath = req.file.path;

    // call Claude to auto-tag the clothing item
    let tags = { category: null, color: null, season: null };
    try {
      tags = await tagClothingImage(imagePath);
    } catch (aiErr) {
      console.error(
        "AI tagging failed, saving item without tags:",
        aiErr.message,
      );
    }

    const result = await pool.query(
      "INSERT INTO items (image_url, category, color, season) VALUES ($1, $2, $3, $4) RETURNING *",
      [imageUrl, tags.category, tags.color, tags.season],
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/outfits", async (req, res) => {
  try {
    const { season } = req.query; // optional
    const result = await pool.query("SELECT * FROM items");
    const outfits = generateOutfits(result.rows, { season, count: 5 });
    res.json(outfits);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// get all wardrobe items
app.get("/items", async (req, res) => {
  try {
    const result = await pool.query(
      "SELECT * FROM items ORDER BY created_at DESC",
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// update an item's tags (category, color, season)
app.put("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { category, color, season } = req.body;
    const result = await pool.query(
      "UPDATE items SET category = $1, color = $2, season = $3 WHERE id = $4 RETURNING *",
      [category, color, season, id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// delete an item and its uploaded image file
app.delete("/items/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const result = await pool.query(
      "DELETE FROM items WHERE id = $1 RETURNING *",
      [id],
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: "Item not found" });
    }

    // best-effort cleanup of the image file on disk
    const deletedItem = result.rows[0];
    const filename = deletedItem.image_url.split("/uploads/")[1];
    if (filename) {
      const filePath = path.join("uploads", filename);
      fs.unlink(filePath, (err) => {
        if (err) {
          console.error("Failed to delete image file:", err.message);
        }
      });
    }
    res.json({ success: true, deleted: deletedItem });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
