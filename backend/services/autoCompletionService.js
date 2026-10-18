// services/autoCompletionService.js — Automatic Expired Booking Completion Service
//
// Features:
//   1. Checks for bookings whose return date has passed (returnDate < today).
//   2. Verifies eligibility: only 'Confirmed' or 'Active' bookings are completed.
//   3. Atomic & Idempotent: uses findOneAndUpdate with precondition to avoid race conditions.
//   4. Reconciles vehicle availability safely via reconcileVehicleAvailability (respects Maintenance & overlapping bookings).
//   5. Emits real-time Socket.IO events (bookingStatusUpdated + vehicleAvailabilityUpdated).
//   6. Dispatches in-app notifications to customer and fleet managers.
//   7. Protected scheduler: runs on startup (catches offline misses) and periodic interval with dev reload deduplication.

const Booking = require('../models/Booking');
const User = require('../models/User');
const { emitBookingStatusUpdated } = require('../socket');
const { reconcileVehicleAvailability, getLocalDateString } = require('./vehicleAvailabilityService');
const { notify, notifyMany } = require('./notificationService');

// Concurrency lock to prevent overlapping runs
let isProcessing = false;

// Interval frequency: run check every 30 seconds
const AUTO_COMPLETION_INTERVAL_MS = 30000;

/**
 * Checks whether a booking's returnDate has completely passed.
 * For date-only 'YYYY-MM-DD' strings, a booking is expired if returnDate < today's local date.
 * During the return date itself (returnDate === today), it is NOT considered passed.
 * If returnDate contains timestamp/time, compares against current millisecond timestamp.
 *
 * @param {string} returnDate - Return date from booking model
 * @param {Date} [referenceDate] - Current reference date (defaults to now)
 * @returns {boolean} - True if return date has passed
 */
const isReturnDatePassed = (returnDate, referenceDate = new Date()) => {
  if (!returnDate) return false;
  const trimmed = String(returnDate).trim();

  // Standard YYYY-MM-DD date-only string
  if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
    const todayStr = getLocalDateString(referenceDate);
    return trimmed < todayStr;
  }

  // ISO timestamp or date with time
  const parsed = new Date(trimmed);
  if (!isNaN(parsed.getTime())) {
    return parsed.getTime() < referenceDate.getTime();
  }

  return false;
};

/**
 * Scans for overdue bookings, completes eligible ones, frees their vehicles safely,
 * and notifies connected clients via Socket.IO and in-app notifications.
 *
 * @param {Date} [referenceDate] - Optional override reference date for testing
 * @returns {Promise<Array<Object>>} - Array of completed booking objects
 */
const completeExpiredBookings = async (referenceDate = new Date()) => {
  if (isProcessing) {
    return [];
  }

  isProcessing = true;
  const completedList = [];

  try {
    const todayStr = getLocalDateString(referenceDate);

    // Find candidate bookings that are Confirmed or Active and might be overdue
    // Using returnDate query when formatted as YYYY-MM-DD, or general candidate query
    const candidates = await Booking.find({
      status: { $in: ['Confirmed', 'Active'] },
      $or: [
        { returnDate: { $lt: todayStr } },
        { returnDate: { $regex: /T/ } }, // in case timestamp format was used
      ],
    });

    for (const booking of candidates) {
      // Precise expiration check ensuring no premature completion on the return date itself
      if (!isReturnDatePassed(booking.returnDate, referenceDate)) {
        continue;
      }

      // Atomic update with precondition: only update if still Confirmed or Active
      // Prevents concurrent worker, manual manager change, or customer cancellation collisions
      const updatedBooking = await Booking.findOneAndUpdate(
        {
          _id: booking._id,
          status: { $in: ['Confirmed', 'Active'] },
        },
        {
          $set: { status: 'Completed' },
        },
        { new: true }
      );

      // If null, booking was already updated or cancelled concurrently; skip safely
      if (!updatedBooking) {
        continue;
      }

      // Reconcile vehicle availability (ensures maintenance & overlapping bookings are respected)
      const updatedVehicle = await reconcileVehicleAvailability(
        updatedBooking.vehicleId,
        updatedBooking._id
      );

      // Emit Socket.IO real-time events immediately after MongoDB update succeeds
      emitBookingStatusUpdated(updatedBooking);

      // Send persistent in-app notifications and email notice (fault-tolerant)
      try {
        if (updatedBooking.customerId) {
          const customer = await User.findById(updatedBooking.customerId).select('email').lean();
          await notify({
            recipientId: updatedBooking.customerId,
            recipientEmail: customer?.email || updatedBooking.customerEmail,
            type: 'success',
            title: 'Booking Completed Automatically',
            message: `🏁 Rental period for ${updatedBooking.vehicleName || 'your vehicle'} ended on ${updatedBooking.returnDate} and has been marked Completed.`,
            metadata: {
              bookingId: updatedBooking._id.toString(),
              vehicleName: updatedBooking.vehicleName,
              status: 'Completed',
              autoCompleted: true,
            },
          });
        }

        // Notify fleet managers
        const managers = await User.find({
          role: { $in: ['fleet_manager', 'manager', 'admin'] },
        }).select('_id email').lean();

        await notifyMany(managers, {
          type: 'status',
          title: 'Booking Auto-Completed',
          message: `Rental for ${updatedBooking.vehicleName} by ${updatedBooking.customerName || 'Customer'} (Return: ${updatedBooking.returnDate}) was automatically completed.`,
          metadata: {
            bookingId: updatedBooking._id.toString(),
            vehicleName: updatedBooking.vehicleName,
            status: 'Completed',
            autoCompleted: true,
          },
        });
      } catch (notifErr) {
        console.warn('⚠️ [AutoCompletion] Notification warning:', notifErr.message);
      }

      completedList.push({
        booking: updatedBooking,
        vehicle: updatedVehicle,
      });

      console.log(`🏁 [AutoCompletion] Completed expired booking ${updatedBooking._id} (${updatedBooking.vehicleName}, returned ${updatedBooking.returnDate})`);
    }
  } catch (error) {
    console.error('❌ [AutoCompletion] Error during execution:', error.message);
  } finally {
    isProcessing = false;
  }

  return completedList;
};

/**
 * Initializes the background scheduler to check for expired bookings periodically.
 * Safeguarded against duplicate timers during nodemon development reloads.
 */
const initAutoCompletionScheduler = () => {
  // Clear any existing timer instance in current Node process (handles dev reload)
  if (global.__bookingCompletionInterval) {
    clearInterval(global.__bookingCompletionInterval);
    global.__bookingCompletionInterval = null;
  }

  console.log('⏰ [AutoCompletion] Initializing Expired Booking Scheduler (interval: 30s)...');

  // Run immediate initial check to handle overdue bookings missed while server was offline
  completeExpiredBookings().catch((err) => {
    console.warn('⚠️ [AutoCompletion] Initial check error:', err.message);
  });

  // Schedule recurring checks
  global.__bookingCompletionInterval = setInterval(() => {
    completeExpiredBookings().catch((err) => {
      console.warn('⚠️ [AutoCompletion] Recurring check error:', err.message);
    });
  }, AUTO_COMPLETION_INTERVAL_MS);

  // Unref timer so it doesn't keep node process alive during tests or shutdown
  if (global.__bookingCompletionInterval.unref) {
    global.__bookingCompletionInterval.unref();
  }

  // Graceful shutdown handlers
  const cleanup = () => {
    if (global.__bookingCompletionInterval) {
      clearInterval(global.__bookingCompletionInterval);
      global.__bookingCompletionInterval = null;
    }
  };
  process.once('SIGINT', cleanup);
  process.once('SIGTERM', cleanup);
};

const stopAutoCompletionScheduler = () => {
  if (global.__bookingCompletionInterval) {
    clearInterval(global.__bookingCompletionInterval);
    global.__bookingCompletionInterval = null;
  }
};

module.exports = {
  isReturnDatePassed,
  completeExpiredBookings,
  initAutoCompletionScheduler,
  stopAutoCompletionScheduler,
};
