require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // USE EXTERNAL URL
  ssl: { rejectUnauthorized: false }
});
pool.on("connect", (client) => {
  client.query("SET search_path TO meralco_app, public");
});

const sql = `
CREATE SCHEMA IF NOT EXISTS meralco_app;

CREATE TABLE IF NOT EXISTS meralco_app.records (
  id SERIAL PRIMARY KEY,
  actual_bill NUMERIC,
  total_consumption NUMERIC,
  rate NUMERIC,
  current_reading NUMERIC,
  previous_reading NUMERIC,
  gen_previous NUMERIC,
  gen_current NUMERIC,
  gen_consumption NUMERIC,
  gen_bill NUMERIC,
  jm_bill NUMERIC,
  "date" TEXT
);

SET search_path TO meralco_app, public;
SELECT COUNT(*) FROM records;
`;

pool.query(sql)
  .then(() => console.log("Schema + table created"))
  .catch(err => console.error(err))
  .finally(() => pool.end());
