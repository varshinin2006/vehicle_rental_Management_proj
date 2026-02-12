const nodemailer = require('nodemailer');
const Vehicle = require('../models/Vehicle');
const Rental = require('../models/Rental');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Check Low Vehicle Availability
async function checkLowAvailability() {
  try {
    const availableCount = await Vehicle.countDocuments({ availability: 'Available' });
    
    if (availableCount < 2) {
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: '⚠️ Low Vehicle Availability Alert',
        html: `
          <h2>Low Vehicle Availability Warning</h2>
          <p>The number of available vehicles has dropped below the threshold.</p>
          <p><strong>Available Vehicles: ${availableCount}</strong></p>
          <p>Please add more vehicles or ensure timely returns.</p>
          <hr>
          <p><small>This is an automated alert from Vehicle Rental Management System</small></p>
        `
      };

      await transporter.sendMail(mailOptions);
      console.log('✅ Low availability alert sent');
    }
  } catch (error) {
    console.error('❌ Error checking vehicle availability:', error);
  }
}

// Check Overdue Rentals
async function checkOverdueRentals() {
  try {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const overdueRentals = await Rental.find({
      status: 'Active',
      end_date: { $lt: today }
    }).populate('customer_id').populate('vehicle_id');

    for (const rental of overdueRentals) {
      // Update rental status to overdue
      rental.status = 'Overdue';
      await rental.save();

      // Send email to admin
      const mailOptions = {
        from: process.env.EMAIL_USER,
        to: process.env.ADMIN_EMAIL,
        subject: '🚨 Overdue Rental Alert',
        html: `
          <h2>Overdue Rental Notification</h2>
          <p>A rental has exceeded its return date.</p>
          <h3>Rental Details:</h3>
          <ul>
            <li><strong>Rental ID:</strong> ${rental.rental_id}</li>
            <li><strong>Customer:</strong> ${rental.customer_id.name}</li>
            <li><strong>Customer Email:</strong> ${rental.customer_id.email}</li>
            <li><strong>Vehicle:</strong> ${rental.vehicle_id.brand} ${rental.vehicle_id.model}</li>
            <li><strong>Expected Return Date:</strong> ${rental.end_date.toDateString()}</li>
            <li><strong>Days Overdue:</strong> ${Math.ceil((today - rental.end_date) / (1000 * 60 * 60 * 24))}</li>
          </ul>
          <p>Please contact the customer immediately.</p>
          <hr>
          <p><small>This is an automated alert from Vehicle Rental Management System</small></p>
        `
      };

      await transporter.sendMail(mailOptions);

      // Optionally send email to customer
      const customerMailOptions = {
        from: process.env.EMAIL_USER,
        to: rental.customer_id.email,
        subject: '⏰ Rental Return Reminder',
        html: `
          <h2>Dear ${rental.customer_id.name},</h2>
          <p>This is a reminder that your rental is overdue.</p>
          <h3>Rental Details:</h3>
          <ul>
            <li><strong>Vehicle:</strong> ${rental.vehicle_id.brand} ${rental.vehicle_id.model}</li>
            <li><strong>Expected Return Date:</strong> ${rental.end_date.toDateString()}</li>
          </ul>
          <p>Please return the vehicle as soon as possible to avoid additional charges.</p>
          <p>Thank you for your cooperation.</p>
          <hr>
          <p><small>Vehicle Rental Management System</small></p>
        `
      };

      await transporter.sendMail(customerMailOptions);
      console.log(`✅ Overdue alert sent for rental ${rental.rental_id}`);
    }
  } catch (error) {
    console.error('❌ Error checking overdue rentals:', error);
  }
}

module.exports = {
  checkLowAvailability,
  checkOverdueRentals,
  transporter
};