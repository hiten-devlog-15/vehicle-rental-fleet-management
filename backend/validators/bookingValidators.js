// validators/bookingValidators.js — Experiment 5: Booking Input Validation Rules
//
// These express-validator rules protect the POST /api/bookings and PUT /api/bookings/:id endpoints.
// The validate middleware (middleware/validate.js) reads these results after they run.
//
// Important validations:
//   • customerEmail must be a valid email format
//   • vehicleId must be a valid MongoDB ObjectId
//   • returnDate must come after pickupDate (cross-field validation)
//   • days and totalAmount must be positive numbers
//   • status must be one of the defined booking statuses

const { body } = require('express-validator');
const mongoose = require('mongoose');

// ── Allowed booking statuses ─────────────────────────────────────────────────
const BOOKING_STATUSES = ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'];

// ── Create Booking Validation Rules ─────────────────────────────────────────
// Applied to: POST /api/bookings
const createBookingRules = [
  // Customer ID must not be empty
  body('customerId')
    .trim()
    .notEmpty().withMessage('Customer ID is required'),

  // Customer name must not be empty
  body('customerName')
    .trim()
    .notEmpty().withMessage('Customer name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2 and 100 characters'),

  // Customer email must be a valid email address
  // isEmail() checks format: user@domain.tld
  body('customerEmail')
    .trim()
    .notEmpty().withMessage('Customer email is required')
    .isEmail().withMessage('Customer email must be a valid email address')
    .normalizeEmail(),           // converts to lowercase, removes dots in Gmail, etc.

  // Vehicle ID must be a valid MongoDB ObjectId
  // This is a security check — prevents garbage IDs from reaching the database
  body('vehicleId')
    .notEmpty().withMessage('Vehicle ID is required')
    .custom((value) => {
      if (!mongoose.Types.ObjectId.isValid(value)) {
        throw new Error('vehicleId must be a valid MongoDB ObjectId');
      }
      return true;
    }),

  // Pickup date must be a valid date string
  body('pickupDate')
    .notEmpty().withMessage('Pickup date is required')
    .isISO8601().withMessage('Pickup date must be a valid date (YYYY-MM-DD)'),

  // Return date must be valid and must come AFTER pickup date
  body('returnDate')
    .notEmpty().withMessage('Return date is required')
    .isISO8601().withMessage('Return date must be a valid date (YYYY-MM-DD)')
    .custom((returnDate, { req }) => {
      // Cross-field validation: compare returnDate with pickupDate
      if (returnDate <= req.body.pickupDate) {
        throw new Error('Return date must be after pickup date');
      }
      return true;
    }),

  // Number of days must be at least 1
  body('days')
    .notEmpty().withMessage('Number of days is required')
    .isInt({ min: 1 }).withMessage('Days must be a positive integer (at least 1)'),

  // Total amount must be 0 or more (cannot be negative)
  body('totalAmount')
    .notEmpty().withMessage('Total amount is required')
    .isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),

  // Pickup location must not be empty
  body('pickupLocation')
    .trim()
    .notEmpty().withMessage('Pickup location is required'),
];

// ── Update Booking Validation Rules ─────────────────────────────────────────
// Applied to: PUT /api/bookings/:id
// All fields are optional for updates, but if provided they must still be valid.
const updateBookingRules = [
  body('customerName')
    .optional()
    .trim()
    .notEmpty().withMessage('Customer name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Customer name must be between 2 and 100 characters'),

  body('customerEmail')
    .optional()
    .trim()
    .isEmail().withMessage('Customer email must be a valid email address')
    .normalizeEmail(),

  body('pickupDate')
    .optional()
    .isISO8601().withMessage('Pickup date must be a valid date (YYYY-MM-DD)'),

  body('returnDate')
    .optional()
    .isISO8601().withMessage('Return date must be a valid date (YYYY-MM-DD)'),

  body('days')
    .optional()
    .isInt({ min: 1 }).withMessage('Days must be a positive integer (at least 1)'),

  body('totalAmount')
    .optional()
    .isFloat({ min: 0 }).withMessage('Total amount must be a non-negative number'),

  body('status')
    .optional()
    .isIn(BOOKING_STATUSES).withMessage(`Status must be one of: ${BOOKING_STATUSES.join(', ')}`),
];

// ── Update Status Validation Rules ──────────────────────────────────────────
// Applied to: PATCH /api/bookings/:id/status
const updateBookingStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(BOOKING_STATUSES).withMessage(`Status must be one of: ${BOOKING_STATUSES.join(', ')}`),
];

module.exports = { createBookingRules, updateBookingRules, updateBookingStatusRules };
