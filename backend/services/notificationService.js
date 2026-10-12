// services/notificationService.js — DriveFleet Unified Notification Dispatcher
//
// Sends notifications through all three channels:
//   1. Persistent in-app notification (saved to MongoDB via Notification model)
//   2. Real-time push via Socket.IO (emitted to user's personal room)
//   3. Email notification via Nodemailer (sent to user's registered email)
//
// Usage:
//   const { notify } = require('../services/notificationService');
//   await notify({ recipientId, recipientEmail, type, title, message, metadata });

const Notification = require('../models/Notification');
const { getIO } = require('../socket');
const { sendEmail } = require('./emailService');

/**
 * Send a notification through all three channels
 * @param {Object} options
 * @param {string} options.recipientId - MongoDB User _id of the recipient
 * @param {string} options.recipientEmail - Email address of the recipient
 * @param {string} options.type - Notification type (booking, status, vehicle, system, success, warning)
 * @param {string} options.title - Short heading
 * @param {string} options.message - Descriptive body text
 * @param {Object} [options.metadata] - Extra data (bookingId, vehicleId, etc.)
 * @param {Object} [options.emailOptions] - Override email subject, details, CTA
 */
const notify = async ({
  recipientId,
  recipientEmail,
  type = 'system',
  title,
  message,
  metadata = {},
  emailOptions = {},
}) => {
  const results = { db: false, socket: false, email: false };

  // ── 1. Persist to MongoDB ──────────────────────────────────────────────────
  try {
    const notification = await Notification.create({
      recipientId,
      type,
      title,
      message,
      metadata,
    });
    results.db = true;
    results.notificationId = notification._id.toString();

    // ── 2. Emit via Socket.IO (real-time push) ─────────────────────────────
    try {
      const io = getIO();
      io.to(`user:${recipientId}`).emit('notification', {
        id: notification._id.toString(),
        type,
        title,
        message,
        metadata,
        read: false,
        createdAt: notification.createdAt,
      });
      results.socket = true;
    } catch (socketErr) {
      console.warn(`⚠️ [Notify] Socket emit failed for user ${recipientId}:`, socketErr.message);
    }
  } catch (dbErr) {
    console.error(`⚠️ [Notify] DB save failed for user ${recipientId}:`, dbErr.message);
  }

  // ── 3. Send email ─────────────────────────────────────────────────────────
  if (recipientEmail) {
    try {
      const emailResult = await sendEmail({
        to: recipientEmail,
        subject: emailOptions.subject || title,
        title: emailOptions.title || title,
        message: emailOptions.message || message,
        details: emailOptions.details || null,
        ctaText: emailOptions.ctaText || null,
        ctaUrl: emailOptions.ctaUrl || null,
      });
      results.email = emailResult.success;
    } catch (emailErr) {
      console.warn(`⚠️ [Notify] Email failed for ${recipientEmail}:`, emailErr.message);
    }
  }

  return results;
};

/**
 * Send notification to multiple recipients (e.g., all managers)
 */
const notifyMany = async (recipients, notificationData) => {
  const promises = recipients.map((r) =>
    notify({
      recipientId: r._id || r.id,
      recipientEmail: r.email,
      ...notificationData,
    })
  );
  return Promise.allSettled(promises);
};

module.exports = { notify, notifyMany };
