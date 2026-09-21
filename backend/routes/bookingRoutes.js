// routes/bookingRoutes.js — Experiment 5: secure booking API routes
//
// Changes from Experiment 4:
//   • validateObjectId applied to all /:id routes
//   • express-validator rules applied to POST and PUT (with validate middleware)
//   • writeLimiter applied to write operations (POST, PUT, PATCH, DELETE)
//
// Middleware chain for a POST /api/bookings request:
//   writeLimiter → createBookingRules → validate → createBooking
//   ──────────────────────────────────────────────────────────────
//   writeLimiter        → rate limit check
//   createBookingRules  → validates customerEmail format, vehicleId as ObjectId, dates, etc.
//   validate            → returns 400 with errors list if any validation failed
//   createBooking       → controller runs only when all validation passed

const express = require('express');
const router = express.Router();

// Controllers
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} = require('../controllers/bookingController');

// Experiment 5 middleware and validators
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { writeLimiter } = require('../middleware/rateLimiter');
const {
  createBookingRules,
  updateBookingRules,
  updateBookingStatusRules,
} = require('../validators/bookingValidators');

// ── GET /api/bookings, POST /api/bookings ────────────────────────────────────
router.route('/')
  .get(getAllBookings)
  .post(writeLimiter, createBookingRules, validate, createBooking);

// ── PATCH /api/bookings/:id/status ─────────────────────────────────────────
// Must be defined before /:id to avoid Express matching "status" as an id
router.patch(
  '/:id/status',
  validateObjectId('booking'),
  writeLimiter,
  updateBookingStatusRules,
  validate,
  updateBookingStatus
);

// ── GET /api/bookings/:id, PUT /api/bookings/:id, DELETE /api/bookings/:id ──
router.route('/:id')
  .get(validateObjectId('booking'), getBookingById)
  .put(validateObjectId('booking'), writeLimiter, updateBookingRules, validate, updateBooking)
  .delete(validateObjectId('booking'), writeLimiter, deleteBooking);

module.exports = router;
