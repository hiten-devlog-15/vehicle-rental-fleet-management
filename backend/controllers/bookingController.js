// controllers/bookingController.js — Experiment 6 upgrade (JWT auth + ownership)
//
// Experiment 6 additions over Experiment 5:
//   1. customerId is now set from req.user.id (JWT payload) — not from client body.
//      This prevents customers from booking on behalf of other users.
//   2. getBookingById: customers can only retrieve their own bookings (403 if not owner).
//      Managers (fleet_manager, manager, admin) can retrieve any booking.
//   3. updateBooking: customers can only update their own bookings.
//      Managers can update any booking.
//   4. DELETE /:id is manager-only — enforced at route level (bookingRoutes.js).
//   5. PATCH /:id/status is manager-only — enforced at route level.
//
// Business logic preserved from Experiments 4 & 5:
//   - Create booking checks vehicle availability, sets vehicle → Booked
//   - Cancel/Complete booking sets vehicle → Available

const Booking = require('../models/Booking');
const Vehicle = require('../models/Vehicle');
const User = require('../models/User');
const {
  emitBookingCreated,
  emitBookingStatusUpdated,
  emitVehicleAvailabilityUpdated,
} = require('../socket');
const { notify, notifyMany } = require('../services/notificationService');
const { dispatchBookingCreatedNotifications } = require('../services/bookingEmailDispatcher');
const { reconcileVehicleAvailability } = require('../services/vehicleAvailabilityService');

// ── Allowed fields for booking creation (mass-assignment protection) ──────────
// customerId is NOT in this list — it is always set from req.user.id server-side.
// Clients cannot fake their identity by injecting a different customerId.
const ALLOWED_BOOKING_FIELDS = [
  'customerName', 'customerEmail', 'customerPhone',
  'vehicleId', 'pickupDate', 'returnDate', 'days',
  'totalAmount', 'pickupLocation', 'destination', 'notes', 'status',
];

const ALLOWED_UPDATE_FIELDS = [
  'customerName', 'customerEmail', 'customerPhone',
  'pickupDate', 'returnDate', 'days',
  'totalAmount', 'pickupLocation', 'destination', 'notes',
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

/**
 * isManager — returns true if the authenticated user has a management role.
 * Used to bypass ownership checks for privileged users.
 */
const MANAGER_ROLES = ['fleet_manager', 'manager', 'admin'];
const isManager = (user) => user && MANAGER_ROLES.includes(user.role);

// ── GET /api/bookings ─────────────────────────────────────────────────────────
// Managers see all bookings.
// Customers see only their own bookings (filtered by customerId matching req.user.id).
const getAllBookings = async (req, res, next) => {
  try {
    let query = {};

    // Customers can only list their own bookings
    if (req.user && !isManager(req.user)) {
      query = {
        $or: [
          { customerId: req.user.id },
          ...(req.user.email ? [{ customerEmail: req.user.email.toLowerCase() }] : []),
        ],
      };
    }

    const bookings = await Booking.find(query).populate('vehicleId', 'name type image status');
    res.status(200).json({ success: true, data: bookings });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/bookings/:id ─────────────────────────────────────────────────────
// Returns a single booking by its MongoDB _id.
// Ownership check: customers can only access their own bookings.
const getBookingById = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('vehicleId', 'name type image');
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check: customers can only see their own bookings
    const isOwner =
      booking.customerId === req.user.id ||
      (req.user.email && booking.customerEmail && booking.customerEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!isManager(req.user) && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to access this booking.',
      });
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/bookings ────────────────────────────────────────────────────────
// Creates a new booking.
// Experiment 6: customerId is set from req.user.id (JWT) — not from client body.
// Business rules (from Experiment 4, preserved):
//   1. Find the vehicle by ID
//   2. Check that it is Available (not Booked or Maintenance)
//   3. Create the booking with server-controlled fields
//   4. Update vehicle status → Booked, available → false
const createBooking = async (req, res, next) => {
  try {
    // Extract only safe client-supplied fields (customerId is excluded from ALLOWED list)
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

    // Create the booking:
    //   - customerId: set from req.user.id (JWT) — client cannot forge this
    //   - vehicleName, vehicleType, pricePerDay: read from DB — client cannot fake price
    //   - bookingDate: set by server
    const booking = await Booking.create({
      ...clientData,
      customerId: req.user.id,            // Experiment 6: always from JWT, never from body
      vehicleName: vehicle.name,          // server-set: client cannot override vehicle name
      vehicleType: vehicle.type,          // server-set
      pricePerDay: vehicle.pricePerDay,   // server-set: client cannot submit a fake price
      bookingDate: new Date().toISOString().split('T')[0],
    });

    // Update vehicle status to Booked
    const updatedVehicle = await Vehicle.findByIdAndUpdate(
      clientData.vehicleId,
      { status: 'Booked', available: false },
      { new: true }
    );

    // Experiment 8: Emit real-time events only AFTER MongoDB operations succeed
    emitBookingCreated(booking);
    if (updatedVehicle) {
      emitVehicleAvailabilityUpdated(updatedVehicle);
    }

    // Automatic Professional Email Notifications (Customer + Fleet Manager)
    // Non-blocking and fault-tolerant: delivery attempts are independent and
    // will NEVER roll back the saved MongoDB booking or block the 201 response.
    dispatchBookingCreatedNotifications({
      booking,
      vehicle,
      clientUrl: req.headers.origin || process.env.CLIENT_URL,
    }).catch((dispatchErr) => {
      console.warn('⚠️ [Booking] Email notification dispatch warning:', dispatchErr.message);
    });

    res.status(201).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/bookings/:id ─────────────────────────────────────────────────────
// Updates a booking's editable details (mass-assignment protected).
// Ownership check: customers can only update their own bookings.
const updateBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    // Ownership check: customers can only update their own bookings
    const isOwner =
      booking.customerId === req.user.id ||
      (req.user.email && booking.customerEmail && booking.customerEmail.toLowerCase() === req.user.email.toLowerCase());

    if (!isManager(req.user) && !isOwner) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to modify this booking.',
      });
    }

    const updateData = pickFields(req.body, ALLOWED_UPDATE_FIELDS);

    const updatedBooking = await Booking.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    res.status(200).json({ success: true, data: updatedBooking });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/bookings/:id/status ────────────────────────────────────────────
// Updates booking status and adjusts vehicle availability accordingly.
// Manager-only — enforced at route level (bookingRoutes.js).
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

    // Role check: If not manager/admin, user can only cancel their own booking
    if (!isManager(req.user)) {
      const isOwner =
        booking.customerId === req.user.id ||
        (req.user.email && booking.customerEmail && booking.customerEmail.toLowerCase() === req.user.email.toLowerCase());

      if (!isOwner) {
        return res.status(403).json({
          success: false,
          message: 'Not authorized to modify this booking.',
        });
      }

      if (status !== 'Cancelled') {
        return res.status(403).json({
          success: false,
          message: 'Customers are only permitted to cancel their own bookings.',
        });
      }
    }

    // Update booking status
    booking.status = status;
    await booking.save();

    let updatedVehicle = null;
    if (status === 'Cancelled' || status === 'Completed') {
      // Reconcile vehicle availability safely (does NOT mark available if Maintenance or if another valid booking exists)
      updatedVehicle = await reconcileVehicleAvailability(booking.vehicleId, booking._id);
    } else if (status === 'Confirmed' || status === 'Active') {
      // Vehicle is occupied unless it is under maintenance
      const v = await Vehicle.findById(booking.vehicleId);
      if (v && v.status !== 'Maintenance') {
        v.status = 'Booked';
        v.available = false;
        await v.save();
        updatedVehicle = v;
      }
    }

    // Experiment 8: Emit real-time events after persistence succeeds
    emitBookingStatusUpdated(booking);
    if (updatedVehicle) {
      emitVehicleAvailabilityUpdated(updatedVehicle);
    }

    // Experiment 9: Send persistent notifications + email for status changes
    try {
      const statusMessages = {
        Confirmed: { title: 'Booking Confirmed', emoji: '✅', color: 'success' },
        Active: { title: 'Booking Active', emoji: '🚗', color: 'status' },
        Completed: { title: 'Booking Completed', emoji: '🏁', color: 'success' },
        Cancelled: { title: 'Booking Cancelled', emoji: '❌', color: 'warning' },
        Pending: { title: 'Booking Pending', emoji: '⏳', color: 'status' },
      };

      const statusInfo = statusMessages[status] || { title: 'Booking Updated', emoji: '📋', color: 'status' };

      // Notify the customer
      if (booking.customerId) {
        const customer = await User.findById(booking.customerId).select('email').lean();
        await notify({
          recipientId: booking.customerId,
          recipientEmail: customer?.email || booking.customerEmail,
          type: statusInfo.color,
          title: statusInfo.title,
          message: `${statusInfo.emoji} Your booking for ${booking.vehicleName || 'a vehicle'} has been ${status.toLowerCase()}.`,
          metadata: { bookingId: booking._id.toString(), vehicleName: booking.vehicleName, status },
          emailOptions: {
            subject: `${statusInfo.title}: ${booking.vehicleName || 'Vehicle'}`,
            title: `${statusInfo.emoji} ${statusInfo.title}`,
            message: `Your booking for <strong>${booking.vehicleName || 'a vehicle'}</strong> has been updated to <strong>${status}</strong>.`,
            details: [
              { label: 'Vehicle', value: booking.vehicleName || 'N/A' },
              { label: 'New Status', value: status },
              { label: 'Pickup Date', value: booking.pickupDate || 'N/A' },
              { label: 'Return Date', value: booking.returnDate || 'N/A' },
            ],
          },
        });
      }

      // Notify all managers
      const managers = await User.find({ role: { $in: MANAGER_ROLES } }).select('_id email').lean();
      await notifyMany(managers, {
        type: 'status',
        title: `Booking ${status}`,
        message: `${booking.customerName || 'A customer'}'s booking for ${booking.vehicleName || 'a vehicle'} is now ${status}.`,
        metadata: { bookingId: booking._id.toString(), vehicleName: booking.vehicleName, status },
      });
    } catch (notifErr) {
      console.warn('⚠️ [Booking] Status notification failed:', notifErr.message);
    }

    res.status(200).json({ success: true, data: booking });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/bookings/:id ──────────────────────────────────────────────────
// Deletes a booking and frees the vehicle if it was active/confirmed.
// Manager-only — enforced at route level (bookingRoutes.js).
const deleteBooking = async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id);
    if (!booking) {
      return res.status(404).json({ success: false, message: 'Booking not found' });
    }

    let freedVehicle = null;
    if (booking.status === 'Confirmed' || booking.status === 'Active') {
      freedVehicle = await reconcileVehicleAvailability(booking.vehicleId, booking._id);
    }

    await Booking.findByIdAndDelete(req.params.id);

    // Experiment 8: Notify that booking has been removed/cancelled
    emitBookingStatusUpdated({ ...booking.toObject(), status: 'Cancelled' });
    if (freedVehicle) {
      emitVehicleAvailabilityUpdated(freedVehicle);
    }

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
