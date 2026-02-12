const express = require('express');
const router = express.Router();
const Customer = require('../models/Customer');

// Middleware
const isAuthenticated = (req, res, next) => {
  if (!req.session.user) {
    return res.redirect('/login');
  }
  next();
};

const isAdmin = (req, res, next) => {
  if (req.session.user.role !== 'admin') {
    req.session.error = 'Access denied. Admin only.';
    return res.redirect('/dashboard');
  }
  next();
};

// View All Customers
router.get('/', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const customers = await Customer.find().sort({ createdAt: -1 });
    res.render('customers', { title: 'Customers', customers });
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to load customers';
    res.redirect('/dashboard');
  }
});

// Add Customer Page
router.get('/add', isAuthenticated, isAdmin, (req, res) => {
  res.render('add-customer', { title: 'Add Customer' });
});

// Add Customer Post
router.post('/add', isAuthenticated, isAdmin, async (req, res) => {
  try {
    const { customer_id, name, phone, email, address } = req.body;

    const customer = new Customer({
      customer_id,
      name,
      phone,
      email,
      address
    });

    await customer.save();
    req.session.success = 'Customer added successfully!';
    res.redirect('/customers');
  } catch (error) {
    console.error(error);
    if (error.code === 11000) {
      req.session.error = 'Customer ID already exists';
    } else {
      req.session.error = 'Failed to add customer';
    }
    res.redirect('/customers/add');
  }
});

// Delete Customer
router.post('/delete/:id', isAuthenticated, isAdmin, async (req, res) => {
  try {
    await Customer.findByIdAndDelete(req.params.id);
    req.session.success = 'Customer deleted successfully!';
    res.redirect('/customers');
  } catch (error) {
    console.error(error);
    req.session.error = 'Failed to delete customer';
    res.redirect('/customers');
  }
});

module.exports = router;