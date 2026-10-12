// controllers/notificationController.js — DriveFleet Notification CRUD
//
// Endpoints:
//   GET    /api/notifications         — Fetch authenticated user's notifications (paginated)
//   GET    /api/notifications/unread-count — Get unread notification count
//   PATCH  /api/notifications/:id/read — Mark a single notification as read
//   PATCH  /api/notifications/read-all — Mark all notifications as read
//   DELETE /api/notifications/:id      — Delete a single notification
//   DELETE /api/notifications          — Delete all notifications for the user

const Notification = require('../models/Notification');

// ── GET /api/notifications ───────────────────────────────────────────────────
// Fetches paginated notifications for the authenticated user, newest first.
// Query params: ?page=1&limit=20&unread=true
const getNotifications = async (req, res, next) => {
  try {
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.min(50, Math.max(1, parseInt(req.query.limit) || 20));
    const skip = (page - 1) * limit;

    const query = { recipientId: req.user.id };

    // Optional filter: only unread
    if (req.query.unread === 'true') {
      query.read = false;
    }

    const [notifications, total, unreadCount] = await Promise.all([
      Notification.find(query).sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Notification.countDocuments(query),
      Notification.countDocuments({ recipientId: req.user.id, read: false }),
    ]);

    res.status(200).json({
      success: true,
      data: notifications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    });
  } catch (error) {
    next(error);
  }
};

// ── GET /api/notifications/unread-count ──────────────────────────────────────
const getUnreadCount = async (req, res, next) => {
  try {
    const count = await Notification.countDocuments({
      recipientId: req.user.id,
      read: false,
    });

    res.status(200).json({ success: true, data: { count } });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notifications/:id/read ────────────────────────────────────────
const markAsRead = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndUpdate(
      { _id: req.params.id, recipientId: req.user.id },
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, data: notification });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/notifications/read-all ────────────────────────────────────────
const markAllAsRead = async (req, res, next) => {
  try {
    const result = await Notification.updateMany(
      { recipientId: req.user.id, read: false },
      { read: true }
    );

    res.status(200).json({
      success: true,
      message: `${result.modifiedCount} notification(s) marked as read`,
    });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/notifications/:id ────────────────────────────────────────────
const deleteNotification = async (req, res, next) => {
  try {
    const notification = await Notification.findOneAndDelete({
      _id: req.params.id,
      recipientId: req.user.id,
    });

    if (!notification) {
      return res.status(404).json({ success: false, message: 'Notification not found' });
    }

    res.status(200).json({ success: true, message: 'Notification deleted' });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/notifications ────────────────────────────────────────────────
const deleteAllNotifications = async (req, res, next) => {
  try {
    const result = await Notification.deleteMany({ recipientId: req.user.id });

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} notification(s) deleted`,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
};
