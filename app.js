// app.js
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); // fine w/ Express 5
const billingRoutes = require('./routes/billing');
const db = require('./db/database');


db.query("SHOW search_path;")
  .then(r => console.log("search_path =", r.rows[0].search_path))
  .catch(err => console.error("SHOW search_path failed:", err));


const app = express();


// Views & static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));


// Parse forms
app.use(bodyParser.urlencoded({ extended: true }));


app.use((req, res, next) => {
  res.setHeader("Cache-Control", "no-store");
  next();
});

// Routes
app.use('/', billingRoutes);

// DB health check
app.get('/db/health', async (req, res) => {
  try {
    const { rows } = await db.query('SELECT 1 AS ok');
    res.json({ ok: rows[0].ok === 1 });
  } catch (e) {
    console.error(e);
    res.status(500).json({ ok: false, error: e.message });
  }
});

// Start
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
