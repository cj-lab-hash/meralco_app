// db/database.js
require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  // Your DB requires TLS; enable it explicitly
  ssl: { rejectUnauthorized: false },
  // Set the schema for every session without issuing a separate query
  options: '-c search_path=meralco_app,public'
});
pool.on("connect", (client) => {
  client.query("SET search_path TO meralco_app, public");
});

// Minimal shim to keep existing code working
const db = {
  query: (text, params) => pool.query(text, params),
  all: (text, cb) =>
    pool.query(text).then(r => cb && cb(null, r.rows)).catch(e => cb && cb(e)),
  run: (text, params, cb) =>
    pool.query(text, params).then(r => cb && cb(null, r)).catch(e => cb && cb(e)),
};

module.exports = db;
