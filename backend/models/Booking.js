// models/Booking.js — Mongoose schema for DriveFleet bookings
// Experiment 5 additions: email regex validation at schema level.
// Fields match the existing frontend booking data structure exactly.

const mongoose = require('mongoose');

const bookingSchema = new mongoose.Schema(
  {
    // Customer information
    customerId: {
      type: String,
      required: [true, 'Customer ID is required'],
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
      minlength: [2, 'Customer name must be at least 2 characters'],
      maxlength: [100, 'Customer name cannot exceed 100 characters'],
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
      // Schema-level email format validation using regex
      // This ensures even if data bypasses express-validator, Mongoose will still reject invalid emails
      match: [
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
        'Please provide a valid email address',
      ],
    },
    customerPhone: {
      type: String,
      default: '',
      trim: true,
    },

    // Vehicle information
    // vehicleId stores the MongoDB ObjectId of the booked vehicle
    vehicleId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Vehicle',
      required: [true, 'Vehicle ID is required'],
    },
    vehicleName: {
      type: String,
      required: [true, 'Vehicle name is required'],
      trim: true,
    },
    vehicleType: {
      type: String,
      default: '',
    },

    // Booking dates
    pickupDate: {
      type: String,
      required: [true, 'Pickup date is required'],
    },
    returnDate: {
      type: String,
      required: [true, 'Return date is required'],
    },
    days: {
      type: Number,
      min: [1, 'Duration must be at least 1 day'],
      required: [true, 'Number of days is required'],
    },

    // Pricing
    pricePerDay: {
      type: Number,
      min: [0, 'Price per day cannot be negative'],
      default: 0,
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },

    // Location and notes
    pickupLocation: {
      type: String,
      required: [true, 'Pickup location is required'],
      trim: true,
    },
    notes: {
      type: String,
      default: '',
      maxlength: [500, 'Notes cannot exceed 500 characters'],
    },

    // Booking status
    status: {
      type: String,
      enum: {
        values: ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'],
        message: 'Status must be Pending, Confirmed, Active, Completed, or Cancelled',
      },
      default: 'Confirmed',
    },

    // The date the booking was made (stored as string to match frontend format)
    bookingDate: {
      type: String,
      default: () => new Date().toISOString().split('T')[0],
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Booking', bookingSchema);
