// validators/vehicleValidators.js — Experiment 5: Vehicle Input Validation Rules
//
// express-validator provides a fluent API for validating request fields.
// These rules are applied BEFORE the controller runs (as route middleware).
//
// How it works:
//   1. The rule (e.g. body('name').notEmpty()) runs and checks the incoming request body.
//   2. If the check fails, the error is stored in the request object.
//   3. The validate middleware (middleware/validate.js) reads these errors.
//   4. If any error exists → 400 response. Otherwise the controller runs.
//
// This separates concerns:
//   Route    → applies rules
//   validate → checks results and returns error response
//   Controller → only receives valid data

const { body } = require('express-validator');

// ── Allowed vehicle statuses ─────────────────────────────────────────────────
const VEHICLE_STATUSES = ['Available', 'Booked', 'Maintenance'];
const FUEL_TYPES = ['Petrol', 'Diesel', 'Electric', 'Hybrid', 'CNG'];
const TRANSMISSION_TYPES = ['Manual', 'Automatic'];

// ── Create Vehicle Validation Rules ─────────────────────────────────────────
// Applied to: POST /api/vehicles
// These are the rules that must be satisfied to create a new vehicle.
const createVehicleRules = [
  // Vehicle name must be a non-empty string
  body('name')
    .trim()
    .notEmpty().withMessage('Vehicle name is required')
    .isLength({ min: 2, max: 100 }).withMessage('Vehicle name must be between 2 and 100 characters'),

  // Type (e.g., Sedan, SUV) must be a non-empty string
  body('type')
    .trim()
    .notEmpty().withMessage('Vehicle type is required')
    .isLength({ min: 2, max: 50 }).withMessage('Vehicle type must be between 2 and 50 characters'),

  // Brand (e.g., Toyota, Honda) must be a non-empty string
  body('brand')
    .trim()
    .notEmpty().withMessage('Vehicle brand is required')
    .isLength({ min: 2, max: 50 }).withMessage('Brand must be between 2 and 50 characters'),

  // Price per day must be a positive number
  body('pricePerDay')
    .notEmpty().withMessage('Price per day is required')
    .isFloat({ min: 1 }).withMessage('Price per day must be a positive number greater than 0'),

  // Fuel type must be one of the allowed values (optional field with enum constraint)
  body('fuel')
    .optional()
    .isIn(FUEL_TYPES).withMessage(`Fuel must be one of: ${FUEL_TYPES.join(', ')}`),

  // Transmission must be Manual or Automatic (optional field)
  body('transmission')
    .optional()
    .isIn(TRANSMISSION_TYPES).withMessage(`Transmission must be one of: ${TRANSMISSION_TYPES.join(', ')}`),

  // Seats must be a positive integer (optional field, defaults in schema)
  body('seats')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Seats must be between 1 and 20'),

  // Status must be one of the defined enum values (optional field, defaults to Available)
  body('status')
    .optional()
    .isIn(VEHICLE_STATUSES).withMessage(`Status must be one of: ${VEHICLE_STATUSES.join(', ')}`),

  // Year must be a reasonable year number (optional field)
  body('year')
    .optional()
    .isInt({ min: 1990, max: 2030 }).withMessage('Year must be between 1990 and 2030'),

  // Rating must be between 0 and 5 (optional field)
  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
];

// ── Update Vehicle Validation Rules ─────────────────────────────────────────
// Applied to: PUT /api/vehicles/:id
// All fields are optional here (partial updates allowed), but if provided they must be valid.
const updateVehicleRules = [
  body('name')
    .optional()
    .trim()
    .notEmpty().withMessage('Vehicle name cannot be empty')
    .isLength({ min: 2, max: 100 }).withMessage('Vehicle name must be between 2 and 100 characters'),

  body('type')
    .optional()
    .trim()
    .notEmpty().withMessage('Vehicle type cannot be empty')
    .isLength({ min: 2, max: 50 }).withMessage('Vehicle type must be between 2 and 50 characters'),

  body('brand')
    .optional()
    .trim()
    .notEmpty().withMessage('Brand cannot be empty')
    .isLength({ min: 2, max: 50 }).withMessage('Brand must be between 2 and 50 characters'),

  body('pricePerDay')
    .optional()
    .isFloat({ min: 1 }).withMessage('Price per day must be a positive number greater than 0'),

  body('fuel')
    .optional()
    .isIn(FUEL_TYPES).withMessage(`Fuel must be one of: ${FUEL_TYPES.join(', ')}`),

  body('transmission')
    .optional()
    .isIn(TRANSMISSION_TYPES).withMessage(`Transmission must be one of: ${TRANSMISSION_TYPES.join(', ')}`),

  body('seats')
    .optional()
    .isInt({ min: 1, max: 20 }).withMessage('Seats must be between 1 and 20'),

  body('status')
    .optional()
    .isIn(VEHICLE_STATUSES).withMessage(`Status must be one of: ${VEHICLE_STATUSES.join(', ')}`),

  body('year')
    .optional()
    .isInt({ min: 1990, max: 2030 }).withMessage('Year must be between 1990 and 2030'),

  body('rating')
    .optional()
    .isFloat({ min: 0, max: 5 }).withMessage('Rating must be between 0 and 5'),
];

// ── Update Status Validation Rules ─────────────────────────────────────────
// Applied to: PATCH /api/vehicles/:id/status
const updateStatusRules = [
  body('status')
    .notEmpty().withMessage('Status is required')
    .isIn(VEHICLE_STATUSES).withMessage(`Status must be one of: ${VEHICLE_STATUSES.join(', ')}`),
];

module.exports = { createVehicleRules, updateVehicleRules, updateStatusRules };
