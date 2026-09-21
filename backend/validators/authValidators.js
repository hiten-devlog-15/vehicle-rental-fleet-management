// validators/authValidators.js — Experiment 5 extension: Auth input validation rules
//
// express-validator rules for user registration.
// Applied to POST /api/auth/register before the controller runs.

const { body } = require('express-validator');

// ── Register Validation Rules ────────────────────────────────────────────────
// Validates all fields for user registration.
const registerRules = [
  // Full name: required, 2–100 chars
  body('name')
    .trim()
    .notEmpty().withMessage('Full name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Name must be between 2 and 100 characters'),

  // Email: required, valid format
  body('email')
    .trim()
    .notEmpty().withMessage('Email address is required')
    .isEmail().withMessage('Please provide a valid email address')
    .normalizeEmail(), // converts to lowercase, removes Gmail dots, etc.

  // Password: required, minimum 8 characters
  // We do NOT check for complexity here — that is enforced at the frontend level.
  // The backend enforces the minimum length as a security baseline.
  body('password')
    .notEmpty().withMessage('Password is required')
    .isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),

  // Phone: optional — if provided, must be a reasonable phone string
  body('phone')
    .optional()
    .trim()
    .isLength({ max: 20 }).withMessage('Phone number cannot exceed 20 characters'),
];

module.exports = { registerRules };
