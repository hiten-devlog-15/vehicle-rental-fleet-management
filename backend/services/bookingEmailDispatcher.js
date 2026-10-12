// services/bookingEmailDispatcher.js — Reliable Multi-Channel Booking Notification & Email Dispatcher
//
// Key Responsibilities:
//   1. Dynamically resolves Customer and responsible Fleet Manager from MongoDB records.
//   2. Dispatches two distinct professional emails (Customer acknowledgement + Fleet Manager notification).
//   3. Records delivery audit trail and ensures idempotency via EmailLog (no duplicate emails).
//   4. Guarantees fault isolation: email failures NEVER roll back or abort database bookings.
//   5. Attempts Customer and Fleet Manager deliveries independently (one failure does not block the other).
//   6. Preserves existing in-app persistent notifications and Socket.IO real-time alerts.

const User = require('../models/User');
const Vehicle = require('../models/Vehicle');
const EmailLog = require('../models/EmailLog');
const {
  sendCustomerBookingEmail,
  sendFleetManagerBookingEmail,
} = require('./emailService');
const { notify, notifyMany } = require('./notificationService');

/**
 * Resolves the Fleet Manager responsible for a specific vehicle
 * @param {Object} vehicle - Vehicle document from MongoDB
 * @returns {Promise<Object|null>} - Responsible manager user object
 */
const resolveResponsibleFleetManager = async (vehicle) => {
  try {
    // 1. Direct assignment check: vehicle.managerId or vehicle.assignedManager
    if (vehicle && (vehicle.managerId || vehicle.assignedManager)) {
      const assignedId = vehicle.managerId || vehicle.assignedManager;
      const assignedManager = await User.findById(assignedId).select('_id name email role phone').lean();
      if (assignedManager && assignedManager.email) {
        return assignedManager;
      }
    }

    // 2. Query registered fleet_manager user from database
    // Sort by newest or active fleet_manager
    const fleetManager = await User.findOne({ role: 'fleet_manager' })
      .select('_id name email role phone')
      .sort({ createdAt: -1 })
      .lean();

    if (fleetManager && fleetManager.email) {
      return fleetManager;
    }

    // 3. Fallback: general manager role
    const generalManager = await User.findOne({ role: 'manager' })
      .select('_id name email role phone')
      .lean();

    if (generalManager && generalManager.email) {
      return generalManager;
    }

    // 4. Fallback: admin account if no fleet_manager exists in database
    const admin = await User.findOne({ role: 'admin' })
      .select('_id name email role phone')
      .lean();

    return admin || null;
  } catch (err) {
    console.error('⚠️ [Dispatcher] Failed to resolve responsible fleet manager:', err.message);
    return null;
  }
};

/**
 * Dispatches automatic booking emails and updates delivery audit logs
 * @param {Object} options
 * @param {Object} options.booking - The newly saved Booking document
 * @param {Object} options.vehicle - The booked Vehicle document
 * @param {string} [options.clientUrl] - Public frontend URL
 */
const dispatchBookingCreatedNotifications = async ({ booking, vehicle, clientUrl }) => {
  const results = {
    customerEmail: { attempted: false, success: false },
    managerEmail: { attempted: false, success: false },
  };

  const url = clientUrl || process.env.CLIENT_URL || process.env.FRONTEND_URL || 'http://localhost:5173';

  // ── Step 1: Resolve Customer Record ─────────────────────────────────────────
  let customer = null;
  try {
    if (booking.customerId) {
      customer = await User.findById(booking.customerId).select('_id name email phone role').lean();
    }
  } catch (err) {
    console.warn('⚠️ [Dispatcher] Customer DB lookup error:', err.message);
  }

  // Fallback to booking's stored customer details if User query is empty
  if (!customer) {
    customer = {
      _id: booking.customerId,
      name: booking.customerName,
      email: booking.customerEmail,
      phone: booking.customerPhone,
    };
  }

  // ── Step 2: Resolve Responsible Fleet Manager Record ───────────────────────
  const manager = await resolveResponsibleFleetManager(vehicle);

  // ── Step 3: Send Customer Email (with Idempotency Guard) ────────────────────
  if (customer && customer.email) {
    results.customerEmail.attempted = true;
    try {
      // Check if an email was already successfully sent for this booking creation
      const existingCustomerLog = await EmailLog.findOne({
        bookingId: booking._id,
        recipientType: 'customer',
        status: 'sent',
      });

      if (existingCustomerLog) {
        console.log(`ℹ️ [Dispatcher] Customer email already recorded for booking ${booking._id}. Skipping duplicate.`);
        results.customerEmail.success = true;
        results.customerEmail.skipped = true;
      } else {
        const sendResult = await sendCustomerBookingEmail({
          booking,
          vehicle,
          customer,
          clientUrl: url,
        });

        results.customerEmail.success = Boolean(sendResult.success);

        // Record in EmailLog audit table
        await EmailLog.create({
          bookingId: booking._id,
          recipientType: 'customer',
          recipientEmail: customer.email,
          recipientName: customer.name || '',
          subject: `DriveFleet Booking | ${vehicle?.name || 'Vehicle'} | ${booking._id}`,
          status: sendResult.success ? 'sent' : (sendResult.skipped ? 'skipped' : 'failed'),
          messageId: sendResult.messageId || '',
          error: sendResult.reason || '',
        });
      }
    } catch (custErr) {
      console.error('❌ [Dispatcher] Customer email dispatch exception:', custErr.message);
      try {
        await EmailLog.create({
          bookingId: booking._id,
          recipientType: 'customer',
          recipientEmail: customer.email,
          recipientName: customer.name || '',
          subject: `DriveFleet Booking | ${vehicle?.name || 'Vehicle'} | ${booking._id}`,
          status: 'failed',
          error: custErr.message,
        });
      } catch {
        // Silently preserve stability
      }
    }
  }

  // ── Step 4: Send Fleet Manager Email (Independent Attempt) ─────────────────
  if (manager && manager.email) {
    results.managerEmail.attempted = true;
    try {
      // Check if manager email was already successfully sent for this booking
      const existingManagerLog = await EmailLog.findOne({
        bookingId: booking._id,
        recipientType: 'fleet_manager',
        status: 'sent',
      });

      if (existingManagerLog) {
        console.log(`ℹ️ [Dispatcher] Manager email already recorded for booking ${booking._id}. Skipping duplicate.`);
        results.managerEmail.success = true;
        results.managerEmail.skipped = true;
      } else {
        const sendResult = await sendFleetManagerBookingEmail({
          booking,
          vehicle,
          manager,
          customer,
          clientUrl: url,
        });

        results.managerEmail.success = Boolean(sendResult.success);

        // Record in EmailLog audit table
        await EmailLog.create({
          bookingId: booking._id,
          recipientType: 'fleet_manager',
          recipientEmail: manager.email,
          recipientName: manager.name || '',
          subject: `New Booking Request | ${vehicle?.name || 'Vehicle'} | ${booking._id}`,
          status: sendResult.success ? 'sent' : (sendResult.skipped ? 'skipped' : 'failed'),
          messageId: sendResult.messageId || '',
          error: sendResult.reason || '',
        });
      }
    } catch (mgrErr) {
      console.error('❌ [Dispatcher] Fleet Manager email dispatch exception:', mgrErr.message);
      try {
        await EmailLog.create({
          bookingId: booking._id,
          recipientType: 'fleet_manager',
          recipientEmail: manager.email,
          recipientName: manager.name || '',
          subject: `New Booking Request | ${vehicle?.name || 'Vehicle'} | ${booking._id}`,
          status: 'failed',
          error: mgrErr.message,
        });
      } catch {
        // Silently preserve stability
      }
    }
  } else {
    console.warn(`⚠️ [Dispatcher] No fleet manager found in database with valid email to notify for vehicle ${vehicle?.name}.`);
  }

  // ── Step 5: Preserve In-App Persistent Notifications ────────────────────────
  try {
    const routeText = booking.destination ? `(${booking.pickupLocation} → ${booking.destination})` : `(${booking.pickupLocation})`;

    // Notify Customer in-app
    await notify({
      recipientId: booking.customerId,
      recipientEmail: null, // Email already sent above with dedicated branded template
      type: 'booking',
      title: booking.status === 'Pending' ? 'Booking Request Submitted' : 'Booking Confirmed',
      message: `Your booking for ${vehicle?.name || 'vehicle'} ${routeText} is ${booking.status}.`,
      metadata: {
        bookingId: booking._id.toString(),
        vehicleName: vehicle?.name,
        pickupLocation: booking.pickupLocation,
        destination: booking.destination,
      },
    });

    // Notify all Managers in-app
    const allManagers = await User.find({ role: { $in: ['fleet_manager', 'manager', 'admin'] } })
      .select('_id')
      .lean();

    if (allManagers.length > 0) {
      await notifyMany(allManagers, {
        type: 'booking',
        title: 'New Booking Received',
        message: `${booking.customerName} booked ${vehicle?.name || 'vehicle'} ${routeText} for ${booking.days} day(s) — ₹${(booking.totalAmount || 0).toLocaleString('en-IN')}`,
        metadata: {
          bookingId: booking._id.toString(),
          vehicleName: vehicle?.name,
          pickupLocation: booking.pickupLocation,
          destination: booking.destination,
          status: booking.status,
        },
      });
    }
  } catch (notifErr) {
    console.warn('⚠️ [Dispatcher] In-app notification creation encountered a warning:', notifErr.message);
  }

  return results;
};

module.exports = {
  resolveResponsibleFleetManager,
  dispatchBookingCreatedNotifications,
};
