// routes/vehicleRoutes.js — Express routes for vehicle API endpoints

const express = require('express');
const router = express.Router();
const {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  updateVehicleAvailability,
} = require('../controllers/vehicleController');

// GET    /api/vehicles          — get all vehicles
// POST   /api/vehicles          — create a new vehicle
router.route('/').get(getAllVehicles).post(createVehicle);

// PATCH  /api/vehicles/:id/status       — update vehicle status only
router.patch('/:id/status', updateVehicleStatus);

// PATCH  /api/vehicles/:id/availability — update vehicle availability only
router.patch('/:id/availability', updateVehicleAvailability);

// GET    /api/vehicles/:id      — get one vehicle
// PUT    /api/vehicles/:id      — update a vehicle
// DELETE /api/vehicles/:id      — delete a vehicle
router.route('/:id').get(getVehicleById).put(updateVehicle).delete(deleteVehicle);

module.exports = router;
