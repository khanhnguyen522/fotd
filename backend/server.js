require("dotenv").config();

const cors = require("cors");
const express = require("express");
const authRoutes = require("./routes/auth");
const healthRoutes = require("./routes/health");
const itemsRoutes = require("./routes/items");
const outfitsRoutes = require("./routes/outfits");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/health", healthRoutes);
app.use("/auth", authRoutes);
app.use("/items", itemsRoutes);
app.use("/outfits", outfitsRoutes);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Backend running on port ${PORT}`));
