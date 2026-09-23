const bcrypt = require("bcryptjs");
const express = require("express");
const jwt = require("jsonwebtoken");
const { asyncHandler } = require("../utils/asyncHandler");

const router = express.Router();

// login — single shared password for the one owner of this app
router.post(
  "/login",
  asyncHandler("LOGIN", async (req, res) => {
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
  }),
);

module.exports = router;
