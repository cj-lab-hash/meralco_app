const express = require('express');
const router = express.Router();
const db = require('../db/database');

// -------------------------------
// GET HOME — List all + Latest
// -------------------------------
router.get('/', async (req, res) => {
  try {
    const sql = `SELECT * FROM meralco_app.records ORDER BY "date" DESC`;
    const result = await db.query(sql);
    const rows = result.rows;

    const formatPeso = (amount) =>
      '₱' + parseFloat(amount || 0).toLocaleString('en-PH', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    rows.forEach((record) => {
      record.formattedActualBill = formatPeso(record.actual_bill);
      record.formattedRate = formatPeso(record.rate);
      record.formattedGenBill = formatPeso(record.gen_bill);
      record.formattedJmBill = formatPeso(record.jm_bill);
      record.jm_consumption = record.total_consumption - record.gen_consumption;
    });

    const latest = rows[0] || null;

    res.render("index", { 
    record: latest,
    records: rows,
    lastCurrent: latest ? latest.current_reading : "",
    lastGenCurrent: latest ? latest.gen_current : ""
    });

  } catch (err) {
    console.error("SELECT error:", err.message);
    res.status(500).send("Database error");
  }
});


// -------------------------------
// POST — Add a New Billing Record
// -------------------------------
router.post('/', async (req, res) => {
  try {
    const {
      actual_bill,
      current_consumption,
      previous_consumption,
      rate_per_kwh,
      gen_current,
      gen_previous,
      billing_date,
    } = req.body;

    const actualBill = parseFloat(actual_bill);
    const current = parseFloat(current_consumption);
    const previous = parseFloat(previous_consumption);
    const rate = parseFloat(rate_per_kwh);
    const genCurrentNum = parseFloat(gen_current);
    const genPreviousNum = parseFloat(gen_previous);

    const consumption = current - previous;
    const genConsumption = parseFloat((genCurrentNum - genPreviousNum).toFixed(2));
    const generalCons = consumption - genConsumption;

    const genBillComputed = parseFloat((genConsumption * rate).toFixed(2));
    const jmBill = parseFloat((generalCons * rate).toFixed(2));

    const extra = (actualBill - (jmBill + genBillComputed)) / 2;

    const jmBillWithCharges = parseFloat((jmBill + extra).toFixed(2));
    const genBillWithCharges = parseFloat((genBillComputed + extra).toFixed(2));

    const sql = `
      INSERT INTO records (
        actual_bill,
        total_consumption,
        rate,
        current_reading,
        previous_reading,
        gen_previous,
        gen_current,
        gen_consumption,
        gen_bill,
        jm_bill,
        "date"
      ) VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11)
    `;

    const params = [
      actualBill,
      consumption,
      rate,
      current,
      previous,
      genPreviousNum,
      genCurrentNum,
      genConsumption,
      genBillWithCharges,
      jmBillWithCharges,
      billing_date,
    ];

    await db.query(sql, params);

    res.redirect("/");

  } catch (err) {
    console.error("INSERT error:", err.message);
    res.status(500).send("Insert error");
  }
});


// -------------------------------
// DELETE — With Password Security
// -------------------------------
router.post("/delete/:id", async (req, res) => {
  const PASSWORD = "112924";

  if (req.body.password !== PASSWORD) {
    return res.send("<h3>Wrong password. <a href='/'>Go Back</a></h3>");
  }

  try {
    const id = req.params.id;

    await db.query("DELETE FROM records WHERE id = $1", [id]);

    res.redirect("/");

  } catch (err) {
    console.error("DELETE ERROR:", err.message);
    res.send("Error deleting record: " + err.message);
  }
});
// API — Return all records for charts
router.get("/api/records", async (req, res) => {
  try {
    const sql = `SELECT * FROM records ORDER BY "date" ASC`;
    const result = await db.query(sql);

    res.json(result.rows);
  } catch (err) {
    console.error("API ERROR:", err.message);
    res.status(500).json({ error: "Could not fetch records" });
  }
});

module.exports = router;
