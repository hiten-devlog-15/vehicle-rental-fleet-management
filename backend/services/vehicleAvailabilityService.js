// services/vehicleAvailabilityService.js — Safe Vehicle Availability & Status Reconciler
//
// Safety Guarantees:
//   1. Vehicles under 'Maintenance' are NEVER marked 'Available'.
//   2. Vehicles needed by another valid, non-expired 'Confirmed' or 'Active' booking remain 'Booked'.
//   3. When all bookings are completed/cancelled and vehicle is not in maintenance, it becomes 'Available'.
//   4. Emits real-time Socket.IO event 'vehicleAvailabilityUpdated' on state changes.

const Vehicle = require('../models/Vehicle');
const Booking = require('../models/Booking');
const { emitVehicleAvailabilityUpdated } = require('../socket');

/**
 * Returns today's local date string formatted as YYYY-MM-DD
 */
const getLocalDateString = (d = new Date()) => {
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Reconciles the availability and status of a vehicle based on its maintenance status
 * and any other valid, overlapping, or ongoing bookings.
 *
 * @param {string|ObjectId} vehicleId - ID of vehicle to reconcile
 * @param {string|ObjectId|null} excludeBookingId - Optional booking ID to exclude from consideration
 * @param {ClientSession|null} session - Optional MongoDB transaction session
 * @returns {Promise<Object|null>} - The updated vehicle document, or null if not found
 */
const reconcileVehicleAvailability = async (vehicleId, excludeBookingId = null, session = null) => {
  if (!vehicleId) return null;

  const vehicle = await Vehicle.findById(vehicleId).session(session || null);
  if (!vehicle) return null;

  // Rule 1: Maintenance takes precedence. If under maintenance, must NOT be Available.
  if (vehicle.status === 'Maintenance') {
    if (vehicle.available !== false) {
      vehicle.available = false;
      await vehicle.save({ session });
      emitVehicleAvailabilityUpdated(vehicle);
    }
    return vehicle;
  }

  // Rule 2: Check if another valid (Confirmed or Active) non-expired booking requires this vehicle
  const todayStr = getLocalDateString();
  const bookingFilter = {
    vehicleId: vehicle._id,
    status: { $in: ['Confirmed', 'Active'] },
    returnDate: { $gte: todayStr },
  };

  if (excludeBookingId) {
    bookingFilter._id = { $ne: excludeBookingId };
  }

  const otherActiveBooking = await Booking.findOne(bookingFilter).session(session || null);

  let statusChanged = false;

  if (otherActiveBooking) {
    // Vehicle is still needed by another active or upcoming confirmed reservation
    if (vehicle.status !== 'Booked' || vehicle.available !== false) {
      vehicle.status = 'Booked';
      vehicle.available = false;
      statusChanged = true;
    }
  } else {
    // No other valid booking and not in maintenance → Vehicle is genuinely Available
    if (vehicle.status !== 'Available' || vehicle.available !== true) {
      vehicle.status = 'Available';
      vehicle.available = true;
      statusChanged = true;
    }
  }

  if (statusChanged) {
    await vehicle.save({ session });
    emitVehicleAvailabilityUpdated(vehicle);
  }

  return vehicle;
};

module.exports = {
  getLocalDateString,
  reconcileVehicleAvailability,
};
