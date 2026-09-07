// routes/bookingRoutes.js — Express routes for booking API endpoints

const express = require('express');
const router = express.Router();
const {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
} = require('../controllers/bookingController');

// GET    /api/bookings          — get all bookings
// POST   /api/bookings          — create a new booking
router.route('/').get(getAllBookings).post(createBooking);

// PATCH  /api/bookings/:id/status — update booking status only
// (mounted before /:id so Express matches correctly)
router.patch('/:id/status', updateBookingStatus);

// GET    /api/bookings/:id      — get one booking
// PUT    /api/bookings/:id      — update booking details
// DELETE /api/bookings/:id      — delete a booking
router.route('/:id').get(getBookingById).put(updateBooking).delete(deleteBooking);

module.exports = router;
