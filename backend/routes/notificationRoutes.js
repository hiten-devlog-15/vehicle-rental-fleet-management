// routes/notificationRoutes.js — DriveFleet Notification API Routes
//
// All routes are JWT-protected — only authenticated users can access their notifications.
//
// Endpoints:
//   GET    /api/notifications              — List user's notifications (paginated)
//   GET    /api/notifications/unread-count  — Get unread count
//   PATCH  /api/notifications/read-all     — Mark all as read
//   PATCH  /api/notifications/:id/read     — Mark single as read
//   DELETE /api/notifications/:id          — Delete single notification
//   DELETE /api/notifications              — Delete all notifications

const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const {
  getNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  deleteAllNotifications,
} = require('../controllers/notificationController');

// All notification routes require authentication
router.use(protect);

// GET /api/notifications — paginated list
router.get('/', getNotifications);

// GET /api/notifications/unread-count — badge count
router.get('/unread-count', getUnreadCount);

// PATCH /api/notifications/read-all — mark all as read (must come before /:id routes)
router.patch('/read-all', markAllAsRead);

// PATCH /api/notifications/:id/read — mark single as read
router.patch('/:id/read', markAsRead);

// DELETE /api/notifications/:id — delete single
router.delete('/:id', deleteNotification);

// DELETE /api/notifications — delete all
router.delete('/', deleteAllNotifications);

module.exports = router;
