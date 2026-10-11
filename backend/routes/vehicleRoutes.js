// routes/vehicleRoutes.js — Experiment 6: JWT-protected vehicle API routes
//
// Experiment 6 additions over Experiment 5:
//   • protect + authorize applied to all write operations (POST, PUT, DELETE, PATCH)
//   • GET routes remain PUBLIC — any visitor can browse the vehicle catalogue
//   • Only fleet_manager, manager, admin can create/update/delete vehicles or
//     change their status/availability
//
// Middleware chain for a protected POST /api/vehicles request (Experiment 6):
//   protect → authorize → writeLimiter → createVehicleRules → validate → createVehicle
//   ────────────────────────────────────────────────────────────────────────────────────
//   protect            → verifies JWT Bearer token, populates req.user
//   authorize          → rejects non-manager roles with 403
//   writeLimiter       → rate limit check (returns 429 if exceeded)
//   createVehicleRules → runs express-validator checks on req.body
//   validate           → reads results; returns 400 if any check failed
//   createVehicle      → controller only runs when all middleware passed

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

// Experiment 6: JWT auth and role authorization
const { protect, authorize } = require('../middleware/auth');

// Management roles that can perform fleet write operations
const MANAGER_ROLES = ['fleet_manager', 'manager', 'admin'];

// ── GET /api/vehicles — PUBLIC (any visitor can browse vehicles) ─────────────
// ── POST /api/vehicles — manager only ────────────────────────────────────────
router.route('/')
  .get(getAllVehicles)
  .post(protect, authorize(...MANAGER_ROLES), writeLimiter, createVehicleRules, validate, createVehicle);

// ── PATCH /api/vehicles/:id/status — manager only ────────────────────────────
// Must be defined before /:id to avoid Express matching "status" as an id
router.patch(
  '/:id/status',
  protect,
  authorize(...MANAGER_ROLES),
  validateObjectId('vehicle'),
  writeLimiter,
  updateStatusRules,
  validate,
  updateVehicleStatus
);

// ── PATCH /api/vehicles/:id/availability — manager only ──────────────────────
router.patch(
  '/:id/availability',
  protect,
  authorize(...MANAGER_ROLES),
  validateObjectId('vehicle'),
  writeLimiter,
  updateVehicleAvailability
);

// ── GET /api/vehicles/:id — PUBLIC ───────────────────────────────────────────
// ── PUT /api/vehicles/:id — manager only ─────────────────────────────────────
// ── DELETE /api/vehicles/:id — manager only ──────────────────────────────────
router.route('/:id')
  .get(validateObjectId('vehicle'), getVehicleById)
  .put(protect, authorize(...MANAGER_ROLES), validateObjectId('vehicle'), writeLimiter, updateVehicleRules, validate, updateVehicle)
  .delete(protect, authorize(...MANAGER_ROLES), validateObjectId('vehicle'), writeLimiter, deleteVehicle);

module.exports = router;
