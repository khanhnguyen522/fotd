const asyncHandler = (routeName, handler) => async (req, res) => {
  try {
    await handler(req, res);
  } catch (err) {
    console.error(`${routeName} ERROR:`, err);
    res.status(500).json({ error: err.message });
  }
};

module.exports = { asyncHandler };
