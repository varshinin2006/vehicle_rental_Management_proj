const express = require('express');
const router = express.Router();
const Vehicle = require('../models/Vehicle');

// Middleware to check if user is logged in
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

// Middleware to check if user is admin
const isAdmin = (req, res, next) => {
  if (req.session.user.role !== 'admin') {
    req.session.error = 'Access denied. Admin only.';
    return res.redirect('/dashboard');
  }
  next();
};

// View All Vehicles
router.get('/', isAuthenticated, async (req, res) => {
  try {
    const vehicles = await Vehicle.find().sort({ createdAt: -1 });
    res.render('vehicles', { title: 'Vehicles', vehicles });
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to load vehicles';
    res.redirect('/dashboard');
  }
});

// Add Vehicle Page
router.get('/add', isAuthenticated, isAdmin, (req, res) => {
  res.render('add-vehicle', { title: 'Add Vehicle' });
});

// Add Vehicle Post
router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { vehicle_id, brand, model, fuel, daily_rate } = req.body;

    const vehicle = new Vehicle({
      vehicle_id,
      brand,
      model,
      fuel,
      daily_rate
    });

    await vehicle.save();
    req.session.success = 'Vehicle added successfully!';
    res.redirect('/vehicles');
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      req.session.error = 'Vehicle ID already exists';
    } else {
      req.session.error = 'Failed to add vehicle';
    }
    res.redirect('/vehicles/add');
  }
});

// Delete Vehicle
router.post('/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Vehicle.findByIdAndDelete(req.params.id);
    req.session.success = 'Vehicle deleted successfully!';
    res.redirect('/vehicles');
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to delete vehicle';
    res.redirect('/vehicles');
  }
});

module.exports = router;