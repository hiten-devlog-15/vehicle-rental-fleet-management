// models/Vehicle.js — Mongoose schema for DriveFleet vehicles
// Fields match the existing frontend vehicle data structure exactly.

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    // Basic identification
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    type: {
      // e.g. Sedan, SUV, Hatchback, MPV, Motorcycle, Electric Sedan, 4x4 SUV
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
    },

    // Vehicle photo URL (Unsplash or any hosted image URL)
    image: {
      type: String,
      default: '',
    },

    // Specifications
    fuel: {
      type: String,
      enum: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
      default: 'Petrol',
    },
    transmission: {
      type: String,
      enum: ['Manual', 'Automatic'],
      default: 'Manual',
    },
    seats: {
      type: Number,
      min: [1, 'Seats must be at least 1'],
      default: 5,
    },
    mileage: {
      // Stored as string because it can be "17.8 kmpl" or "566 km range"
      type: String,
      default: '',
    },
    year: {
      type: Number,
      default: 2023,
    },
    color: {
      type: String,
      default: '',
    },
    registrationNo: {
      type: String,
      default: '',
      trim: true,
    },

    // Pricing
    pricePerDay: {
      type: Number,
      required: [true, 'Price per day is required'],
      min: [0, 'Price cannot be negative'],
    },

    // Rating & reviews
    rating: {
      type: Number,
      min: 0,
      max: 5,
      default: 4.0,
    },
    reviews: {
      type: Number,
      default: 0,
    },

    // Availability & status
    available: {
      type: Boolean,
      default: true,
    },
    status: {
      type: String,
      enum: {
        values: ['Available', 'Booked', 'Maintenance'],
        message: 'Status must be Available, Booked, or Maintenance',
      },
      default: 'Available',
    },

    // Description and features
    description: {
      type: String,
      default: '',
    },
    features: {
      type: [String],
      default: [],
    },
  },
  {
    // Automatically adds createdAt and updatedAt timestamps
    timestamps: true,
  }
);

module.exports = mongoose.model('Vehicle', vehicleSchema);
