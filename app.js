// app.js
const path = require('path');
const express = require('express');
const bodyParser = require('body-parser'); // fine w/ Express 5
const billingRoutes = require('./routes/billing');
const db = require('./db/database');

const app = express();

// Views & static
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static('public'));

// Parse forms
app.use(bodyParser.urlencoded({ extended: true }));

app.post("/delete/:id", (req, res) => {
  const PASSWORD = "112924";   // change to your desired password
  const enteredPass = req.body.password;
  
  if (enteredPass !== PASSWORD) {
    return res.send("<h3>Wrong password. <a href='/'>Go Back</a></h3>");
  }

  const id = req.params.id;

  db.run("DELETE FROM billing WHERE id = ?", id, (err) => {
    if (err) {
      return res.send("Error deleting record.");
    }
    res.redirect("/");
  });
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
