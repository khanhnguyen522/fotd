const { Pool } = require("pg");
require("dotenv").config();

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
      season VARCHAR(20),
      note VARCHAR(100),
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  // migrate existing databases created before the "note" column existed
  await pool.query(`
    ALTER TABLE items ADD COLUMN IF NOT EXISTS note VARCHAR(100)
  `);

  console.log("FOTD tables ready");
};

createTables();

module.exports = pool;
