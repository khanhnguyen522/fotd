const Anthropic = require("@anthropic-ai/sdk");
const sharp = require("sharp");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tagClothingImage = async (imagePath) => {
  // resize to a sane max dimension and re-encode as JPEG — Claude's vision
  // pipeline downscales large images internally anyway, and JPEG compression
  // keeps the payload well under the 10MB base64 limit (PNG was ballooning
  // phone photos up to 15-20MB since it's lossless).
  const jpegBuffer = await sharp(imagePath)
    .resize(1568, 1568, { fit: "inside", withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const base64Image = jpegBuffer.toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-haiku-4-5-20251001",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/jpeg",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `Look at this clothing item image and respond ONLY with a JSON object, no other text, no markdown fences, in this exact format:
{"category": "top|midlayer|bottom|shoes|outerwear|accessory", "color": "main color in one word", "seasons": ["spring", "summer", "fall", "winter"]}

Category guide:
- "top": worn directly against skin (t-shirts, tank tops, button-downs, blouses)
- "midlayer": too warm, thick, or itchy to wear against bare skin, but not a true weatherproof outer layer either (sweaters, cardigans, fleece pullovers, vests) — these need a "top" underneath them
- "outerwear": the outermost layer, typically weatherproof or structured (coats, jackets, blazers)
- "bottom", "shoes", "accessory": as usual

For "seasons", include every season this item is reasonably suited for as an array (a heavy wool sweater might just be ["fall", "winter"], a light t-shirt might be ["spring", "summer"], a versatile item might be all four). Use ["all"] only if it truly works in every season equally.`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock.text.trim();
  const clean = raw.replace(/```json|```/g, "").trim();
  const parsed = JSON.parse(clean);

  // guard against malformed/missing seasons from the model
  if (!Array.isArray(parsed.seasons) || parsed.seasons.length === 0) {
    parsed.seasons = ["all"];
  }

  return parsed;
};

module.exports = { tagClothingImage };
