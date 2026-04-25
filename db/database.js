
require('dotenv').config();
const { Pool } = require('pg');

const isLocal = process.env.DATABASE_URL?.includes('localhost');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: isLocal ? false : { rejectUnauthorized: false },
  options: '-c search_path=meralco_app',
  max: parseInt(process.env.PGPOOL_MAX || '5', 10),
  idleTimeoutMillis: 10000
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
