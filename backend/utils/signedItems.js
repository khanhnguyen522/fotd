const { getSignedPhotoUrl } = require("../services/s3");

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

module.exports = { signOutfit, withSignedUrl };
