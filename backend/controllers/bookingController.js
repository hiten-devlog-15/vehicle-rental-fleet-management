// controllers/bookingController.js — CRUD operations for bookings
// Important: creating a booking checks vehicle availability and updates vehicle status.
// Cancelling a booking sets the vehicle back to Available.

const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// ── GET /api/bookings ─────────────────────────────────────────────────────────
// Returns all bookings, populated with vehicle details
const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find().populate('vehicleId', 'name type image status');
    res.status(200).json(bookings);
  } catch (error) {
    res.status(500).json({ message: 'Server error: could not fetch bookings', error: error.message });
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
// Returns a single booking by its MongoDB _id
const getBookingById = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicleId', 'name type image');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    res.status(500).json({ message: 'Server error: could not fetch booking', error: error.message });
  }
};

// ── POST /api/bookings ────────────────────────────────────────────────────────
// Creates a new booking
// Business rules:
//   1. Find the vehicle by ID
//   2. Check that it is Available (not Booked or Maintenance)
//   3. Create the booking
//   4. Update vehicle status → Booked, available → false
const createBooking = async (req, res) => {
  try {
    const {
      customerId, customerName, customerEmail, vehicleId,
      pickupDate, returnDate, days, totalAmount, pickupLocation,
    } = req.body;

    // Basic required field validation
    if (!customerId || !customerName || !customerEmail || !vehicleId || !pickupDate || !returnDate || !pickupLocation) {
      return res.status(400).json({
        message: 'customerId, customerName, customerEmail, vehicleId, pickupDate, returnDate, and pickupLocation are required',
      });
    }

    // Validate dates — returnDate must be after pickupDate
    if (returnDate <= pickupDate) {
      return res.status(400).json({ message: 'Return date must be after pickup date' });
    }

    // Find the vehicle
    const vehicle = await Vehicle.findById(vehicleId);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }

    // Check vehicle availability
    if (vehicle.status === 'Booked') {
      return res.status(400).json({ message: `${vehicle.name} is already booked and not available` });
    }
    if (vehicle.status === 'Maintenance') {
      return res.status(400).json({ message: `${vehicle.name} is under maintenance and cannot be booked` });
    }

    // Create the booking
    const booking = await Booking.create({
      ...req.body,
      vehicleName: vehicle.name,
      vehicleType: vehicle.type,
      pricePerDay: vehicle.pricePerDay,
      bookingDate: new Date().toISOString().split('T')[0],
    });

    // Update vehicle status to Booked
    await Vehicle.findByIdAndUpdate(vehicleId, { status: 'Booked', available: false });

    res.status(201).json(booking);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vehicle ID format' });
    }
    res.status(500).json({ message: 'Server error: could not create booking', error: error.message });
  }
};

// ── PUT /api/bookings/:id ─────────────────────────────────────────────────────
// Updates a booking's details
const updateBooking = async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    res.status(500).json({ message: 'Server error: could not update booking', error: error.message });
  }
};

// ── PATCH /api/bookings/:id/status ────────────────────────────────────────────
// Updates booking status and adjusts vehicle availability accordingly
// - Cancelled / Completed → vehicle becomes Available
// - Confirmed / Active    → vehicle becomes Booked
const updateBookingStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Confirmed', 'Active', 'Completed', 'Cancelled'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    // Sync vehicle status based on booking status change
    if (status === 'Cancelled' || status === 'Completed') {
      // Vehicle is free again
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        status: 'Available',
        available: true,
      });
    } else if (status === 'Confirmed' || status === 'Active') {
      // Vehicle is occupied
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        status: 'Booked',
        available: false,
      });
    }

    res.status(200).json(booking);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    res.status(500).json({ message: 'Server error: could not update status', error: error.message });
  }
};

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
// Deletes a booking (and frees the vehicle if it was active)
const deleteBooking = async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Free the vehicle if the booking was active/confirmed
    if (booking.status === 'Confirmed' || booking.status === 'Active') {
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        status: 'Available',
        available: true,
      });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ message: 'Booking deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid booking ID format' });
    }
    res.status(500).json({ message: 'Server error: could not delete booking', error: error.message });
  }
};

module.exports = {
  getAllBookings,
  getBookingById,
  createBooking,
  updateBooking,
  updateBookingStatus,
  deleteBooking,
};
