// models/EmailLog.js — Audit & Delivery Record for Transactional Emails
//
// Prevents duplicate email dispatches (idempotency) and records delivery telemetry:
//   - bookingId: Reference to the Booking document
//   - recipientType: 'customer' | 'fleet_manager'
//   - recipientEmail: Destination email address
//   - recipientName: Recipient name
//   - subject: Email subject line
//   - status: 'sent' | 'failed' | 'skipped'
//   - messageId: Nodemailer SMTP messageId (if sent)
//   - error: Safe diagnostic error message (credentials are NEVER logged)
//   - attempts: Number of delivery attempts

const mongoose = require('mongoose');

const emailLogSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: [true, 'Booking ID is required'],
      index: true,
    },
    recipientType: {
      type: String,
      enum: ['customer', 'fleet_manager'],
      required: [true, 'Recipient type is required'],
      index: true,
    },
    recipientEmail: {
      type: String,
      required: [true, 'Recipient email is required'],
      trim: true,
      lowercase: true,
    },
    recipientName: {
      type: String,
      default: '',
      trim: true,
    },
    subject: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'skipped'],
      required: true,
      default: 'skipped',
    },
    messageId: {
      type: String,
      default: '',
    },
    error: {
      type: String,
      default: '',
    },
    attempts: {
      type: Number,
      default: 1,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index to quickly check if an email was already delivered for a specific booking and role
emailLogSchema.index({ bookingId: 1, recipientType: 1 });

module.exports = mongoose.model('EmailLog', emailLogSchema);
