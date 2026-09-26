const { Pool } = require("pg");

const pool = new Pool({
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});

const createTables = async () => {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS items (
      id SERIAL PRIMARY KEY,
      image_url TEXT NOT NULL,
      category VARCHAR(50),
      color VARCHAR(50),
      note VARCHAR(100),
      seasons TEXT[] DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // legacy singular "season" column — replaced by the "seasons" array
  // above, nothing writes to it anymore. Drop it if it still exists from
  // an older schema.
  await pool.query(`ALTER TABLE items DROP COLUMN IF EXISTS season`);

  await pool.query(
    `ALTER TABLE items ADD COLUMN IF NOT EXISTS note VARCHAR(100)`,
  );
  await pool.query(
    `ALTER TABLE items ADD COLUMN IF NOT EXISTS seasons TEXT[] DEFAULT '{}'`,
  );
  // hex color (e.g. "#1A2B4C") of the garment's dominant color, as
  // identified by Claude Vision in aiTagging.js. Null for items tagged
  // before this column existed — outfitGenerator.js falls back to the
  // old name-based color scoring for those.
  await pool.query(
    `ALTER TABLE items ADD COLUMN IF NOT EXISTS dominant_color VARCHAR(7)`,
  );

  console.log("FOTD tables ready");
};

createTables();

module.exports = pool;
