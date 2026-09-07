// models/Booking.js — Mongoose schema for DriveFleet bookings
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
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      trim: true,
      lowercase: true,
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
