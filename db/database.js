// db/database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // If you ever switch to Render's external DB URL that enforces SSL, enable:
  // ssl: { rejectUnauthorized: false },
});

// Always target this app's schema
pool.on('connect', async (client) => {
  await client.query('SET search_path TO meralco_app, public');
});

// Minimal shim so existing code using db.run/db.all continues to work
const db = {
  // General query (promise style)
  query: (text, params) => pool.query(text, params),

  // db.all(sql, callback) -> returns rows[]
  all: (text, cb) =>
    pool.query(text)
      .then((res) => cb && cb(null, res.rows))
      .catch((err) => cb && cb(err)),

  // db.run(sql, params, callback) -> for inserts/updates/deletes
  run: (text, params, cb) =>
    pool.query(text, params)
      .then((res) => cb && cb(null, res))
      .catch((err) => cb && cb(err)),
};

module.exports = db;