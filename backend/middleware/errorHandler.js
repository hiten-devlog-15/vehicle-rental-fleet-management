// middleware/errorHandler.js — Experiment 5: Centralized Error Handling
//
// Express requires error-handling middleware to have EXACTLY 4 arguments: (err, req, res, next).
// This must be the LAST middleware registered in server.js (after all routes).
//
// Why centralize errors?
// ─────────────────────
// Without this, every controller must handle its own CastError, ValidationError, etc.
// With this, controllers call next(err) and this one place handles everything consistently.
//
// What this handles:
//   • Mongoose CastError       → Invalid MongoDB ObjectId                  → 400
//   • Mongoose ValidationError → Schema validation failed                  → 400
//   • Duplicate key (11000)    → Unique constraint violation               → 409
//   • 404 (resource not found) → Passed from controllers via next()        → 404
//   • All other errors         → Unexpected server errors                  → 500
//
// What this does NOT expose:
//   • MongoDB connection strings
//   • Internal file paths
//   • Stack traces (in production)
//   • Database error codes (except user-friendly messages)

const errorHandler = (err, req, res, _next) => {
  // Default values — will be overridden by specific error types below
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal server error';

  // ── Mongoose CastError ────────────────────────────────────────────────────────
  // Happens when an invalid MongoDB ObjectId is passed (e.g., /api/vehicles/abc123)
  if (err.name === 'CastError') {
    statusCode = 400;
    message = `Invalid ${err.path}: '${err.value}' is not a valid ID`;
  }

  // ── Mongoose ValidationError ─────────────────────────────────────────────────
  // Happens when a document fails Mongoose schema validation
  if (err.name === 'ValidationError') {
    statusCode = 400;
    message = Object.values(err.errors)
      .map((e) => e.message)
      .join('; ');
  }

  // ── MongoDB Duplicate Key Error ───────────────────────────────────────────────
  // Error code 11000 = duplicate key violation (e.g., unique index)
  if (err.code === 11000) {
    statusCode = 409;
    const field = Object.keys(err.keyValue || {})[0] || 'field';
    message = `A record with this ${field} already exists`;
  }

  // ── Log the error for developers (server console only, not in API response) ──
  // Only log the full stack in development mode — never expose stacks in production
  if (process.env.NODE_ENV === 'development') {
    console.error(`[ErrorHandler] ${statusCode} — ${message}`);
    if (err.stack) console.error(err.stack);
  } else {
    // In production: log just the message without the internal stack trace
    console.error(`[ErrorHandler] ${statusCode} — ${message}`);
  }

  // ── Send the JSON error response ─────────────────────────────────────────────
  res.status(statusCode).json({
    success: false,
    message,
  });
};

module.exports = errorHandler;
