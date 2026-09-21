// controllers/bookingController.js — Experiment 5 upgrade
//
// Changes from Experiment 4:
//   1. Consistent { success, data } response format across all handlers
//   2. Mass-assignment protection: explicitly lists allowed fields
//   3. Errors forwarded to the centralized errorHandler via next(err)
//   4. ObjectId validation now handled by validateObjectId middleware (not here)
//
// Business logic preserved from Experiment 4:
//   - Create booking checks vehicle availability, sets vehicle → Booked
//   - Cancel/Complete booking sets vehicle → Available

const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');

// ── Allowed fields for booking creation (mass-assignment protection) ──────────
// Explicitly list every field the client is allowed to supply.
// Fields like _id, createdAt, updatedAt, vehicleName, vehicleType, pricePerDay are
// set by the backend — the client cannot override them.
const ALLOWED_BOOKING_FIELDS = [
  'customerId', 'customerName', 'customerEmail', 'customerPhone',
  'vehicleId', 'pickupDate', 'returnDate', 'days',
  'totalAmount', 'pickupLocation', 'notes', 'status',
];

const ALLOWED_UPDATE_FIELDS = [
  'customerName', 'customerEmail', 'customerPhone',
  'pickupDate', 'returnDate', 'days',
  'totalAmount', 'pickupLocation', 'notes',
];

/**
 * pickFields — extracts only the allowed fields from an object.
 * Prevents mass-assignment: clients cannot inject _id, vehicleName, pricePerDay, etc.
 */
const pickFields = (obj, allowedFields) => {
  const result = {};
  allowedFields.forEach((field) => {
    if (obj[field] !== undefined) {
      result[field] = obj[field];
    }
  });
  return result;
};

// ── GET /api/bookings ─────────────────────────────────────────────────────────
// Returns all bookings, populated with vehicle details
const getAllBookings = async (req, res, next) => {
  try {
    const bookings = await Booking.find().populate('vehicleId', 'name type image status');
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
// Returns a single booking by its MongoDB _id
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicleId', 'name type image');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/bookings ────────────────────────────────────────────────────────
// Creates a new booking.
// Business rules (from Experiment 4, preserved):
//   1. Find the vehicle by ID
//   2. Check that it is Available (not Booked or Maintenance)
//   3. Create the booking with server-controlled fields (vehicleName, pricePerDay, etc.)
//   4. Update vehicle status → Booked, available → false
//
// express-validator createBookingRules already ran before this.
// Mass-assignment protection: only ALLOWED_BOOKING_FIELDS are taken from req.body.
// Backend sets vehicleName, vehicleType, pricePerDay, bookingDate — clients cannot fake these.
const createBooking = async (req, res, next) => {
  try {
    // Extract only safe client-supplied fields
    const clientData = pickFields(req.body, ALLOWED_BOOKING_FIELDS);

    // Find the vehicle
    const vehicle = await Vehicle.findById(clientData.vehicleId);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }

    // Check vehicle availability
    if (vehicle.status === 'Booked') {
      return res.status(400).json({
        success: false,
        message: `${vehicle.name} is already booked and not available`,
      });
    }
    if (vehicle.status === 'Maintenance') {
      return res.status(400).json({
        success: false,
        message: `${vehicle.name} is under maintenance and cannot be booked`,
      });
    }

    // Create the booking — server sets vehicleName, vehicleType, pricePerDay, bookingDate
    // These are read from the database, NOT from req.body (prevents price manipulation)
    const booking = await Booking.create({
      ...clientData,
      vehicleName: vehicle.name,          // server-set: client cannot override vehicle name
      vehicleType: vehicle.type,          // server-set
      pricePerDay: vehicle.pricePerDay,   // server-set: client cannot submit a fake price
      bookingDate: new Date().toISOString().split('T')[0],
    });

    // Update vehicle status to Booked
    await Vehicle.findByIdAndUpdate(clientData.vehicleId, { status: 'Booked', available: false });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/bookings/:id ─────────────────────────────────────────────────────
// Updates a booking's editable details (mass-assignment protected)
const updateBooking = async (req, res, next) => {
  try {
    const updateData = pickFields(req.body, ALLOWED_UPDATE_FIELDS);

    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }
    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/bookings/:id/status ────────────────────────────────────────────
// Updates booking status and adjusts vehicle availability accordingly.
// express-validator updateBookingStatusRules already validated status before this.
//
// Status transitions (Experiment 4 business logic preserved):
//   Cancelled / Completed → vehicle becomes Available
//   Confirmed / Active    → vehicle becomes Booked
const updateBookingStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
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

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
// Deletes a booking and frees the vehicle if it was active/confirmed
const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Free the vehicle if the booking was active/confirmed
    if (booking.status === 'Confirmed' || booking.status === 'Active') {
      await Vehicle.findByIdAndUpdate(booking.vehicleId, {
        status: 'Available',
        available: true,
      });
    }

    await Booking.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: 'Booking deleted successfully' });
  } catch (error) {
    next(error);
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
