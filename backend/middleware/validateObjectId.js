// middleware/validateObjectId.js — Experiment 5: MongoDB ObjectId Validation
//
// Before a controller calls Vehicle.findById(req.params.id), we must check that
// the supplied :id is actually a valid MongoDB ObjectId format.
//
// Without this check:
//   GET /api/vehicles/invalid-abc → Mongoose throws a CastError internally
//   The error propagates unpredictably (or triggers a vague 500)
//
// With this check:
//   GET /api/vehicles/invalid-abc → We intercept early → Clean 400 response
//
// MongoDB ObjectId format: 24 hexadecimal characters (e.g., 507f1f77bcf86cd799439011)
// mongoose.Types.ObjectId.isValid() checks this reliably.

const mongoose = require('mongoose');

/**
 * validateObjectId — middleware that validates req.params.id as a MongoDB ObjectId.
 *
 * If invalid → responds with HTTP 400 and a clear error message.
 * If valid   → calls next() so the controller can proceed.
 */
const validateObjectId = (resourceName = 'resource') =>
  (req, res, next) => {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        message: `Invalid ${resourceName} ID: '${req.params.id}' is not a valid ID`,
      });
    }
    next();
  };

module.exports = validateObjectId;
