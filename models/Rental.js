const mongoose = require('mongoose');

const rentalSchema = new mongoose.Schema({
  rental_id: {
    type: String,
    required: true,
    unique: true
  },
  customer_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Customer',
    required: true
  },
  vehicle_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Vehicle',
    required: true
  },
  start_date: {
    type: Date,
    required: true
  },
  end_date: {
    type: Date,
    required: true
  },
  total_amount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['Active', 'Completed', 'Overdue'],
    default: 'Active'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Rental', rentalSchema);