// socket.js — DriveFleet Real-Time Communication via Socket.IO (Experiment 8)
//
// Features:
//   1. Initializes Socket.IO with the existing HTTP server and CORS configuration
//   2. JWT Handshake Authentication — verifies tokens using JWT_SECRET
//   3. Server-Controlled Room Management:
//        - 'managers' room for fleet_manager, manager, admin
//        - 'user:<id>' personal room for individual customers
//   4. Secure Event Emitters:
//        - bookingCreated → emitted to 'managers' and the customer's personal room
//        - bookingStatusUpdated → emitted to 'managers' and 'user:<customerId>'
//        - vehicleAvailabilityUpdated → broadcast for fleet availability changes

const { Server } = require('socket.io');
const jwt = require('jsonwebtoken');

let io = null;

// Manager roles eligible for fleet-wide notification room
const MANAGER_ROLES = ['fleet_manager', 'manager', 'admin'];

/**
 * Format booking payload to contain only necessary fields for real-time delivery
 */
const formatBookingPayload = (booking) => {
  const id = booking._id ? booking._id.toString() : (booking.id || '');
  const vehicleId = booking.vehicleId && booking.vehicleId._id
    ? booking.vehicleId._id.toString()
    : (booking.vehicleId ? booking.vehicleId.toString() : '');

  return {
    id,
    _id: id,
    customerId: booking.customerId,
    customerName: booking.customerName,
    customerEmail: booking.customerEmail,
    vehicleId,
    vehicleName: booking.vehicleName,
    vehicleType: booking.vehicleType || '',
    pickupDate: booking.pickupDate,
    returnDate: booking.returnDate,
    days: booking.days,
    totalAmount: booking.totalAmount,
    pickupLocation: booking.pickupLocation,
    status: booking.status,
    bookingDate: booking.bookingDate,
    createdAt: booking.createdAt || new Date().toISOString(),
  };
};

/**
 * Initialize Socket.IO instance attached to Express HTTP server
 */
const initSocket = (httpServer, allowedOrigin) => {
  io = new Server(httpServer, {
    cors: {
      origin: [allowedOrigin, 'http://localhost:3000', 'http://localhost:5173'],
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  });

  // ── Authentication Middleware for Socket Handshake ─────────────────────────
  io.use((socket, next) => {
    try {
      let token = socket.handshake.auth && socket.handshake.auth.token;

      // Also check Authorization header fallback (Bearer <token>)
      if (!token && socket.handshake.headers && socket.handshake.headers.authorization) {
        const parts = socket.handshake.headers.authorization.split(' ');
        if (parts.length === 2 && parts[0] === 'Bearer') {
          token = parts[1];
        }
      }

      if (!token) {
        return next(new Error('Authentication error: No token provided'));
      }

      if (!process.env.JWT_SECRET) {
        return next(new Error('Server configuration error: JWT_SECRET missing'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.id,
        role: decoded.role,
        email: decoded.email,
      };

      next();
    } catch (err) {
      if (err.name === 'TokenExpiredError') {
        return next(new Error('Authentication error: Token expired'));
      }
      return next(new Error('Authentication error: Invalid token'));
    }
  });

  // ── Connection Handler & Room Assignment ────────────────────────────────────
  io.on('connection', (socket) => {
    const { id, role, email } = socket.user;
    console.log(`🔌 [Socket.IO] Client connected: ${email} (${role}) [Socket ID: ${socket.id}]`);

    // Assign customer to private user room
    const userRoom = `user:${id}`;
    socket.join(userRoom);

    // If verified manager, assign to managers room
    if (MANAGER_ROLES.includes(role)) {
      socket.join('managers');
      console.log(`   👑 User joined 'managers' room`);
    }

    // Confirmation message back to client
    socket.emit('connected', {
      success: true,
      message: 'Real-time connection established',
      user: { id, role, email },
    });

    socket.on('disconnect', (reason) => {
      console.log(`🔌 [Socket.IO] Client disconnected: ${email} (${reason})`);
    });
  });

  return io;
};

/**
 * Access active Socket.IO server instance
 */
const getIO = () => {
  if (!io) {
    throw new Error('Socket.IO has not been initialized yet.');
  }
  return io;
};

/**
 * Emit event when a new booking is created
 * - Emitted only after MongoDB persistence succeeds
 * - Sends to 'managers' room and customer's private room
 */
const emitBookingCreated = (booking) => {
  try {
    if (!io) return;
    const payload = formatBookingPayload(booking);

    // Notify fleet managers
    io.to('managers').emit('bookingCreated', payload);

    // Notify customer in their own room
    if (booking.customerId) {
      io.to(`user:${booking.customerId}`).emit('bookingCreated', payload);
    }

    console.log(`📢 [Socket.IO] Emitted bookingCreated event for booking ${payload.id}`);
  } catch (error) {
    console.error('⚠️ [Socket.IO] Failed to emit bookingCreated:', error.message);
  }
};

/**
 * Emit event when a booking status changes
 * - Emitted only after MongoDB persistence succeeds
 * - Sends to customer's personal room and fleet managers room
 */
const emitBookingStatusUpdated = (booking) => {
  try {
    if (!io) return;
    const payload = formatBookingPayload(booking);

    // Notify customer
    if (booking.customerId) {
      io.to(`user:${booking.customerId}`).emit('bookingStatusUpdated', payload);
    }

    // Notify managers
    io.to('managers').emit('bookingStatusUpdated', payload);

    console.log(`📢 [Socket.IO] Emitted bookingStatusUpdated event for booking ${payload.id} (Status: ${payload.status})`);
  } catch (error) {
    console.error('⚠️ [Socket.IO] Failed to emit bookingStatusUpdated:', error.message);
  }
};

/**
 * Emit event when a vehicle availability or status changes
 * - Broadcast to all authenticated connected clients
 */
const emitVehicleAvailabilityUpdated = (vehicle) => {
  try {
    if (!io) return;
    const payload = {
      id: vehicle._id ? vehicle._id.toString() : (vehicle.id || ''),
      _id: vehicle._id ? vehicle._id.toString() : (vehicle.id || ''),
      name: vehicle.name,
      status: vehicle.status,
      available: vehicle.available,
    };

    io.emit('vehicleAvailabilityUpdated', payload);
    console.log(`📢 [Socket.IO] Emitted vehicleAvailabilityUpdated for ${payload.name} (${payload.status})`);
  } catch (error) {
    console.error('⚠️ [Socket.IO] Failed to emit vehicleAvailabilityUpdated:', error.message);
  }
};

module.exports = {
  initSocket,
  getIO,
  emitBookingCreated,
  emitBookingStatusUpdated,
  emitVehicleAvailabilityUpdated,
};
