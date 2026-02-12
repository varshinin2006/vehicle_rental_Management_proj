require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const session = require('express-session');
const path = require('path');

const app = express();

// ======================
// 📌 MongoDB Connection
// ======================
mongoose.connect("mongodb://127.0.0.1:27017/vehicle_rental", {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => console.log("MongoDB Connected"))
.catch((err) => console.log("Error: ", err));

// ======================
// 📌 Middlewares
// ======================
app.set('view engine', 'ejs');
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ======================
// 📌 Sessions
// ======================
app.use(
  session({
    secret: process.env.SESSION_SECRET || "mysecret",
    resave: false,
    saveUninitialized: false,
    cookie: { maxAge: 24 * 60 * 60 * 1000 }, // 24 hours
  })
);

// ======================
// 📌 Global variables
// ======================
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  res.locals.success = req.session.success || null;
  res.locals.error = req.session.error || null;

  delete req.session.success;
  delete req.session.error;

  next();
});

// ======================
// 📌 Routes
// ======================
app.use('/', require('./routes/auth'));       // LOGIN ROUTES
app.use('/vehicles', require('./routes/vehicles'));
app.use('/customers', require('./routes/customers'));
app.use('/rentals', require('./routes/rentals'));
app.use("/invoice", require("./routes/invoice"));

// ======================
// 📌 Email alerts (Overdue, Low availability)
// ======================
const { checkOverdueRentals, checkLowAvailability } = require('./utils/emailService');

setInterval(async () => {
  await checkOverdueRentals();
  await checkLowAvailability();
}, 60 * 60 * 1000);

// ======================
// 📌 Home Route
// ======================
app.get('/', (req, res) => {
  if (req.session.user) return res.redirect('/dashboard');
  res.redirect('/login');
});

// ======================
// 📌 Dashboard
// ======================
app.get('/dashboard', (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('dashboard', { title: 'Dashboard' });
});

// ======================
// 📌 Dashboard Stats API
// ======================
app.get('/api/stats', async (req, res) => {
  if (!req.session.user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  try {
    const Vehicle = require('./models/Vehicle');
    const Customer = require('./models/Customer');
    const Rental = require('./models/Rental');

    const totalVehicles = await Vehicle.countDocuments();
    const availableVehicles = await Vehicle.countDocuments({ availability: 'Available' });
    const activeRentals = await Rental.countDocuments({ status: 'Active' });
    const overdueRentals = await Rental.countDocuments({ status: 'Overdue' });
    const totalCustomers = await Customer.countDocuments();

    res.json({
      totalVehicles,
      availableVehicles,
      activeRentals,
      overdueRentals,
      totalCustomers,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to fetch stats' });
  }
});

// ======================
// 📌 Error Handler
// ======================
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).send('Internal Server Error');
});

// ======================
// 📌 Start Server
// ======================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () =>
  console.log(`🚀 Server running on http://localhost:${PORT}`)
);
