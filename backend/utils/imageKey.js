// build a safe S3 key for a wardrobe item (never undefined/empty)
const buildImageKey = (originalname) => {
  const safeName = (originalname || "item").replace(/[^a-zA-Z0-9._-]/g, "_");
  return `wardrobe/${Date.now()}-${safeName}`;
};

module.exports = { buildImageKey };
