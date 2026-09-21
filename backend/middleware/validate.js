// middleware/validate.js — Experiment 5: Input Validation Middleware
//
// This middleware is used AFTER express-validator rules have run.
// It collects any validation errors and returns a 400 response with a clean message.
// If there are no errors, it calls next() to continue to the controller.
//
// Usage in routes:
//   router.post('/', createVehicleRules, validate, createVehicle);
//   ──────────────────────────────────────────────────────────────
//   createVehicleRules → runs express-validator checks on the request
//   validate           → checks if any checks failed; sends 400 if so
//   createVehicle      → controller only runs if validation passed

const { validationResult } = require('express-validator');

/**
 * validate — reads the result of all express-validator rules run before it.
 *
 * If any rule failed:
 *   → Responds with HTTP 400 and a structured error list.
 *
 * If all rules passed:
 *   → Calls next() so the request reaches the controller.
 */
const validate = (req, res, next) => {
  const errors = validationResult(req);

  // validationResult returns an object; isEmpty() is true when there are no errors
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      // errors.array() gives an array of objects with { field, message }
      errors: errors.array().map((err) => ({
        field: err.path,        // which field failed (e.g. "name", "pricePerDay")
        message: err.msg,       // the human-readable error message
      })),
    });
  }

  // No validation errors — proceed to the next middleware / controller
  next();
};

module.exports = validate;
