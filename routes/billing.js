const express = require('express');
const router = express.Router();
const db = require('../db/database');

// Home (list + latest)
router.get('/', (req, res) => {
  db.all('SELECT *, id FROM records ORDER BY "date" DESC', (err, rows) => {
    if (err) {
      console.error('Fetch error:', err.message);
      return res.status(500).send('Database error');
    }

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
    });

    const latest = rows[0];
    res.render('index', { record: latest, records: rows });
  });
});

// Create record
router.post('/', (req, res) => {
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

  const additionalCharges = (actualBill - (jmBill + genBillComputed)) / 2;
  const jmBillWithCharges = parseFloat((jmBill + additionalCharges).toFixed(2));
  const genBillWithCharges = parseFloat((genBillComputed + additionalCharges).toFixed(2));

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

  db.run(sql, params, (err) => {
    if (err) {
      console.error('Insert error:', err.message);
      return res.status(500).send('Insert error');
    }
    res.redirect('/');
  });
});

// DELETE with password
router.post("/delete/:id", (req, res) => {
  const PASSWORD = "1234";
  const enteredPass = req.body.password;

  if (enteredPass !== PASSWORD) {
    return res.send("<h3>Wrong password. <a href='/'>Go Back</a></h3>");
  }

  const id = req.params.id;

  const sql = `DELETE FROM records WHERE id = $1`;

  db.run(sql, [id], (err) => {
    if (err) {
      console.error("Delete error:", err.message);
      return res.send("Error deleting record.");
    }
    res.redirect("/");
  });
});

module.exports = router;
