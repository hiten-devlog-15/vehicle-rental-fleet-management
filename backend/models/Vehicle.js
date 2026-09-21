// models/Vehicle.js — Mongoose schema for DriveFleet vehicles
// Experiment 5 additions: minLength on strings, maxLength limits, stricter year range.
// Fields match the existing frontend vehicle data structure exactly.

const mongoose = require('mongoose');

const vehicleSchema = new mongoose.Schema(
  {
    // Basic identification
    name: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
      minlength: [2, 'Vehicle name must be at least 2 characters'],
      maxlength: [100, 'Vehicle name cannot exceed 100 characters'],
    },
    type: {
      // e.g. Sedan, SUV, Hatchback, MPV, Motorcycle, Electric Sedan, 4x4 SUV
      type: String,
      required: [true, 'Vehicle type is required'],
      trim: true,
      minlength: [2, 'Vehicle type must be at least 2 characters'],
      maxlength: [50, 'Vehicle type cannot exceed 50 characters'],
    },
    brand: {
      type: String,
      required: [true, 'Brand is required'],
      trim: true,
      minlength: [2, 'Brand must be at least 2 characters'],
      maxlength: [50, 'Brand cannot exceed 50 characters'],
    },

    // Vehicle photo URL (Unsplash or any hosted image URL)
    image: {
      type: String,
      default: '',
    },

    // Specifications
    fuel: {
      type: String,
      enum: {
        values: ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'],
        message: 'Fuel must be Petrol, Diesel, Electric, Hybrid, or CNG',
      },
      default: 'Petrol',
    },
    transmission: {
      type: String,
      enum: {
        values: ['Manual', 'Automatic'],
        message: 'Transmission must be Manual or Automatic',
      },
      default: 'Manual',
    },
    seats: {
      type: Number,
      min: [1, 'Seats must be at least 1'],
      max: [20, 'Seats cannot exceed 20'],
      default: 5,
    },
    mileage: {
      // Stored as string because it can be "17.8 kmpl" or "566 km range"
      type: String,
      default: '',
    },
    year: {
      type: Number,
      min: [1990, 'Year must be 1990 or later'],
      max: [2030, 'Year cannot exceed 2030'],
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
      min: [1, 'Price per day must be at least 1'],
    },

    // Rating & reviews
    rating: {
      type: Number,
      min: [0, 'Rating cannot be negative'],
      max: [5, 'Rating cannot exceed 5'],
      default: 4.0,
    },
    reviews: {
      type: Number,
      min: [0, 'Reviews count cannot be negative'],
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
      maxlength: [1000, 'Description cannot exceed 1000 characters'],
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
