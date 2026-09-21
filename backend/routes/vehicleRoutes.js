// routes/vehicleRoutes.js — Experiment 5: secure vehicle API routes
//
// Changes from Experiment 4:
//   • validateObjectId applied to all /:id routes (prevents garbage IDs reaching the DB)
//   • express-validator rules applied to POST and PUT (with validate middleware)
//   • writeLimiter applied to write operations (POST, PUT, PATCH, DELETE)
//
// Middleware chain for a POST request:
//   writeLimiter → createVehicleRules → validate → createVehicle
//   ──────────────────────────────────────────────────────────────
//   writeLimiter       → rate limit check (returns 429 if exceeded)
//   createVehicleRules → runs express-validator checks on req.body
//   validate           → reads results; returns 400 if any check failed
//   createVehicle      → controller only runs when request is valid and within limit

const express = require('express');
const router = express.Router();

// Controllers
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  updateVehicleAvailability,
} = require('../controllers/vehicleController');

// Experiment 5 middleware and validators
const validate = require('../middleware/validate');
const validateObjectId = require('../middleware/validateObjectId');
const { writeLimiter } = require('../middleware/rateLimiter');
const {
  createVehicleRules,
  updateVehicleRules,
  updateStatusRules,
} = require('../validators/vehicleValidators');

// ── GET /api/vehicles, POST /api/vehicles ─────────────────────────────────────
router.route('/')
  .get(getAllVehicles)
  .post(writeLimiter, createVehicleRules, validate, createVehicle);

// ── PATCH /api/vehicles/:id/status ───────────────────────────────────────────
// Must be defined before /:id to avoid Express matching "status" as an id
router.patch(
  '/:id/status',
  validateObjectId('vehicle'),
  writeLimiter,
  updateStatusRules,
  validate,
  updateVehicleStatus
);

// ── PATCH /api/vehicles/:id/availability ─────────────────────────────────────
router.patch(
  '/:id/availability',
  validateObjectId('vehicle'),
  writeLimiter,
  updateVehicleAvailability
);

// ── GET /api/vehicles/:id, PUT /api/vehicles/:id, DELETE /api/vehicles/:id ───
router.route('/:id')
  .get(validateObjectId('vehicle'), getVehicleById)
  .put(validateObjectId('vehicle'), writeLimiter, updateVehicleRules, validate, updateVehicle)
  .delete(validateObjectId('vehicle'), writeLimiter, deleteVehicle);

module.exports = router;
