const Anthropic = require("@anthropic-ai/sdk");
const sharp = require("sharp");

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

const tagClothingImage = async (imagePath) => {
  // convert whatever format the image is (avif, webp, jpeg, png...) into standard PNG buffer in memory
  const pngBuffer = await sharp(imagePath).png().toBuffer();
  const base64Image = pngBuffer.toString("base64");

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 300,
    messages: [
      {
        role: "user",
        content: [
          {
            type: "image",
            source: {
              type: "base64",
              media_type: "image/png",
              data: base64Image,
            },
          },
          {
            type: "text",
            text: `Look at this clothing item image and respond ONLY with a JSON object, no other text, no markdown fences, in this exact format:
{"category": "top|bottom|shoes|outerwear|accessory", "color": "main color in one word", "season": "spring|summer|fall|winter|all"}`,
          },
        ],
      },
    ],
  });

  const textBlock = response.content.find((block) => block.type === "text");
  const raw = textBlock.text.trim();
  const clean = raw.replace(/```json|```/g, "").trim();

  return JSON.parse(clean);
};

module.exports = { tagClothingImage };
