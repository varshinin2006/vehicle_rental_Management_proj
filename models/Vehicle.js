const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema({
  vehicle_id: {
    type: String,
    required: true,
    unique: true
  },
  brand: {
    type: String,
    required: true
  },
  model: {
    type: String,
    required: true
  },
  fuel: {
    type: String,
    enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid'],
    required: true
  },
  daily_rate: {
    type: Number,
    required: true
  },
  availability: {
    type: String,
    enum: ['Available', 'Rented'],
    default: 'Available'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Vehicle', vehicleSchema);