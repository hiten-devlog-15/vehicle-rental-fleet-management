// routes/bookingRoutes.js — Experiment 6: JWT-protected booking API routes
//
// Experiment 6 additions over Experiment 5:
//   • protect middleware applied to all routes — requires a valid JWT Bearer token
//   • authorize middleware applied to manager-only operations:
//       - PATCH /:id/status  → fleet_manager, manager, admin
//       - DELETE /:id        → fleet_manager, manager, admin
//   • Customers can create bookings and view individual bookings (ownership
//     enforced by the controller — see bookingController.js)
//   • GET / returns all bookings for managers; customers see all (controller filters by role if needed)
//
// Middleware chain for a POST /api/bookings request (Experiment 6):
//   protect → writeLimiter → createBookingRules → validate → createBooking
//   ──────────────────────────────────────────────────────────────────────
//   protect             → verifies JWT, populates req.user
//   writeLimiter        → rate limit check (30 per 15 min per IP)
//   createBookingRules  → validates customerEmail, vehicleId, dates, etc.
//   validate            → returns 400 with error list if any check failed
//   createBooking       → controller creates booking (sets customerId from req.user)

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

// Experiment 6: JWT auth and role authorization
const { protect, authorize } = require('../middleware/auth');

// Management roles that can perform privileged booking operations
const MANAGER_ROLES = ['fleet_manager', 'manager', 'admin'];

// ── GET /api/bookings — protected: any authenticated user ─────────────────────
// ── POST /api/bookings — protected: any authenticated user (customer creates booking) ─
router.route('/')
  .get(protect, getAllBookings)
  .post(protect, writeLimiter, createBookingRules, validate, createBooking);

// ── PATCH /api/bookings/:id/status — manager only ────────────────────────────
// Must be defined before /:id to avoid Express matching "status" as an id
router.patch(
  '/:id/status',
  protect,
  authorize(...MANAGER_ROLES),
  validateObjectId('booking'),
  writeLimiter,
  updateBookingStatusRules,
  validate,
  updateBookingStatus
);

// ── GET /api/bookings/:id — protected: auth required, ownership check in controller ──
// ── PUT /api/bookings/:id — protected: auth required, ownership check in controller ──
// ── DELETE /api/bookings/:id — manager only ──────────────────────────────────
router.route('/:id')
  .get(protect, validateObjectId('booking'), getBookingById)
  .put(protect, validateObjectId('booking'), writeLimiter, updateBookingRules, validate, updateBooking)
  .delete(protect, authorize(...MANAGER_ROLES), validateObjectId('booking'), writeLimiter, deleteBooking);

module.exports = router;
