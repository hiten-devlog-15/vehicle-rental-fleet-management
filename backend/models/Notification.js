// models/Notification.js — DriveFleet Notification schema
//
// Persistent notification records stored in MongoDB.
// Each notification is tied to a specific user (recipientId) and contains:
//   - type: category for icon/color mapping (booking, status, vehicle, system)
//   - title: short heading displayed in the notification panel
//   - message: descriptive body text
//   - read: whether the user has seen/acknowledged it
//   - metadata: optional extra data (bookingId, vehicleId, etc.)

const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema(
  {
    // The user who receives this notification
    recipientId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Recipient ID is required'],
      index: true,
    },

    // Notification category — determines icon and color in the UI
    type: {
      type: String,
      enum: {
        values: ['booking', 'status', 'vehicle', 'system', 'success', 'warning'],
        message: 'Type must be booking, status, vehicle, system, success, or warning',
      },
      default: 'system',
    },

    // Short heading
    title: {
      type: String,
      required: [true, 'Notification title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters'],
    },

    // Descriptive body
    message: {
      type: String,
      required: [true, 'Notification message is required'],
      trim: true,
      maxlength: [500, 'Message cannot exceed 500 characters'],
    },

    // Read status
    read: {
      type: Boolean,
      default: false,
    },

    // Optional metadata (e.g., bookingId, vehicleId, status)
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {},
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient queries: unread notifications for a user, sorted by date
notificationSchema.index({ recipientId: 1, read: 1, createdAt: -1 });

module.exports = mongoose.model('Notification', notificationSchema);
