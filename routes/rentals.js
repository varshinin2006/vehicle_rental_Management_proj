const express = require('express');
const router = express.Router();
const Rental = require('../models/Rental');
const Vehicle = require('../models/Vehicle');
const Customer = require('../models/Customer');
const { generateInvoicePDF } = require('../utils/pdfGenerator');
const { transporter } = require('../utils/emailService');

// Middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// =============================
// VIEW ALL RENTALS
// =============================
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const rentals = await Rental.find()
      .populate('customer_id')
      .populate('vehicle_id')
      .sort({ createdAt: -1 });

    res.render('rentals', { title: 'Rentals', rentals });
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to load rentals';
    res.redirect('/dashboard');
  }
});

// =============================
// ADD RENTAL PAGE
// =============================
router.get('/add', isAuthenticated, async (req, res) => {
  try {
    const customers = await Customer.find();
    const vehicles = await Vehicle.find({ availability: 'Available' });

    res.render('add-rental', {
      title: 'Add Rental',
      customers,
      vehicles,
    });
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to load form';
    res.redirect('/rentals');
  }
});

// =============================
// ADD RENTAL + EMAIL NOTIFICATIONS
// =============================
router.post('/add', isAuthenticated, async (req, res) => {
  try {
    const { customer_id, vehicle_id, start_date, end_date, total_amount } = req.body;

    const vehicle = await Vehicle.findById(vehicle_id);
    if (!vehicle || vehicle.availability !== 'Available') {
      req.session.error = 'Vehicle not available';
      return res.redirect('/rentals/add');
    }

    const days = Math.ceil(
      (new Date(end_date) - new Date(start_date)) /
        (1000 * 60 * 60 * 24)
    );

    const final_amount =
      total_amount && total_amount > 0
        ? total_amount
        : days * vehicle.daily_rate;

    const rental_id = 'RNT' + Date.now();

    const rental = new Rental({
      rental_id,
      customer_id,
      vehicle_id,
      start_date,
      end_date,
      total_amount: final_amount,
    });

    await rental.save();

    vehicle.availability = 'Rented';
    await vehicle.save();

    const customer = await Customer.findById(customer_id);

    // ===============================
    // ADMIN EMAIL
    // ===============================
    try {
      const adminEmail = process.env.ADMIN_EMAIL;

      if (adminEmail) {
        await transporter.sendMail({
          from: process.env.EMAIL_USER,
          to: adminEmail,
          subject: `🚗 New Rental Created (${rental_id})`,
          html: `
            <h2>New Rental Created</h2>
            <ul>
              <li><strong>Rental ID:</strong> ${rental_id}</li>
              <li><strong>Customer:</strong> ${customer.name} (${customer.email})</li>
              <li><strong>Vehicle:</strong> ${vehicle.brand} ${vehicle.model}</li>
              <li><strong>Total Amount:</strong> ₹${final_amount}</li>
            </ul>
          `,
        });
      }
    } catch (err) {
      console.error('Admin email failed:', err);
    }

    // ===============================
    // CUSTOMER EMAIL
    // ===============================
    try {
      await transporter.sendMail({
        from: process.env.EMAIL_USER,
        to: customer.email,
        subject: `✔ Your Vehicle Rental is Confirmed (${rental_id})`,
        html: `
          <h2>Hello ${customer.name},</h2>
          <p>Your rental has been successfully booked.</p>

          <h3>Rental Summary:</h3>
          <ul>
            <li><strong>Vehicle:</strong> ${vehicle.brand} ${vehicle.model}</li>
            <li><strong>Total Amount:</strong> ₹${final_amount}</li>
          </ul>
        `,
      });
    } catch (err) {
      console.error('Customer email failed:', err);
    }

    req.session.success = 'Rental created successfully!';
    res.redirect('/rentals');
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to create rental';
    res.redirect('/rentals/add');
  }
});

// =============================
// RETURN VEHICLE
// =============================
router.post('/return/:id', isAuthenticated, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id);

    if (!rental) {
      req.session.error = 'Rental not found';
      return res.redirect('/rentals');
    }

    rental.status = 'Completed';
    await rental.save();

    const vehicle = await Vehicle.findById(rental.vehicle_id);
    vehicle.availability = 'Available';
    await vehicle.save();

    req.session.success = 'Vehicle returned successfully!';
    res.redirect('/rentals');
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to return vehicle';
    res.redirect('/rentals');
  }
});

// =============================
// GENERATE INVOICE
// =============================
router.get('/invoice/:id', isAuthenticated, async (req, res) => {
  try {
    const rental = await Rental.findById(req.params.id)
      .populate('customer_id')
      .populate('vehicle_id');

    if (!rental) {
      req.session.error = 'Rental not found';
      return res.redirect('/rentals');
    }

    await generateInvoicePDF(rental, res);
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to generate invoice';
    res.redirect('/rentals');
  }
});

module.exports = router;
