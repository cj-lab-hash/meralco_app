// scripts/migrate-sqlite-to-postgres.js
require('dotenv').config();
const sqlite3 = require('sqlite3').verbose();
const { Pool } = require('pg');


const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false } // enable SSL for external URL
});

(async () => {
  const sqlite = new sqlite3.Database('./db/billing.db');
  const pool = new Pool({ connectionString: process.env.DATABASE_URL });
  await pool.query('SET search_path TO meralco_app, public');

  const all = (db, sql, params=[]) => new Promise((res, rej) => {
    db.all(sql, params, (err, rows) => (err ? rej(err) : res(rows)));
  });

  try {
    const rows = await all(sqlite, `
      SELECT
        actual_bill, total_consumption, rate,
        current_reading, previous_reading,
        gen_previous, gen_current, gen_consumption,
        gen_bill, jm_bill, date
      FROM records
    `);

    for (const r of rows) {
      await pool.query(
        `INSERT INTO records (
          actual_bill, total_consumption, rate,
          current_reading, previous_reading,
          gen_previous, gen_current, gen_consumption,
          gen_bill, jm_bill, "date"
        ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
        ON CONFLICT DO NOTHING`,
        [
          r.actual_bill, r.total_consumption, r.rate,
          r.current_reading, r.previous_reading,
          r.gen_previous, r.gen_current, r.gen_consumption,
          r.gen_bill, r.jm_bill, r.date
        ]
      );
    }

    console.log(`Migrated ${rows.length} rows`);
  } catch (e) {
    console.error(e);
  } finally {
    sqlite.close();
    await pool.end();
  }
})();