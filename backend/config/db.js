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
      season VARCHAR(20),
      note VARCHAR(100),
      seasons TEXT[] DEFAULT '{}',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await pool.query(
    `ALTER TABLE items ADD COLUMN IF NOT EXISTS note VARCHAR(100)`,
  );
  await pool.query(
    `ALTER TABLE items ADD COLUMN IF NOT EXISTS seasons TEXT[] DEFAULT '{}'`,
  );

  console.log("FOTD tables ready");
};

createTables();

module.exports = pool;
