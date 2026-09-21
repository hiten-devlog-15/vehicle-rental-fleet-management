// controllers/vehicleController.js — Experiment 5 upgrade
//
// Changes from Experiment 4:
//   1. Consistent { success, data } response format across all handlers
//   2. Mass-assignment protection: only explicitly listed fields are passed to Mongoose
//   3. Errors forwarded to the centralized errorHandler via next(err)
//   4. ObjectId validation now handled by validateObjectId middleware (not here)

const Vehicle = require('../models/Vehicle');

// ── Allowed fields for mass-assignment protection ────────────────────────────
// These are the only fields a client is permitted to set when creating/updating a vehicle.
// Internal fields like _id, createdAt, updatedAt are NEVER passed from req.body.
const ALLOWED_CREATE_FIELDS = [
  'name', 'type', 'brand', 'image', 'fuel', 'transmission',
  'seats', 'mileage', 'year', 'color', 'registrationNo',
  'pricePerDay', 'rating', 'reviews', 'available', 'status',
  'description', 'features',
];

const ALLOWED_UPDATE_FIELDS = [
  'name', 'type', 'brand', 'image', 'fuel', 'transmission',
  'seats', 'mileage', 'year', 'color', 'registrationNo',
  'pricePerDay', 'rating', 'reviews', 'available', 'status',
  'description', 'features',
];

/**
 * pickFields — extracts only the allowed fields from an object.
 * Prevents mass-assignment attacks (e.g., a client sending { _id: "hacked" }).
 */
const pickFields = (obj, allowedFields) => {
  const result = {};
  allowedFields.forEach((field) => {
    if (obj[field] !== undefined) {
      result[field] = obj[field];
    }
  });
  return result;
};

// ── GET /api/vehicles ─────────────────────────────────────────────────────────
// Returns all vehicles from MongoDB
const getAllVehicles = async (req, res, next) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json({ success: true, data: vehicles });
  } catch (error) {
    next(error); // Forward to centralized errorHandler
  }
};

// ── GET /api/vehicles/:id ─────────────────────────────────────────────────────
// Returns a single vehicle by its MongoDB _id
// Note: validateObjectId middleware already ran before this — id is guaranteed valid
const getVehicleById = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// ── POST /api/vehicles ────────────────────────────────────────────────────────
// Creates a new vehicle
// Mass-assignment protection: only ALLOWED_CREATE_FIELDS are passed to Mongoose
// express-validator rules already ran before this — data is valid
const createVehicle = async (req, res, next) => {
  try {
    // Only pick fields explicitly allowed — do NOT pass req.body directly
    const vehicleData = pickFields(req.body, ALLOWED_CREATE_FIELDS);

    const vehicle = await Vehicle.create(vehicleData);
    res.status(201).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// ── PUT /api/vehicles/:id ─────────────────────────────────────────────────────
// Updates all fields of an existing vehicle
// Mass-assignment protection: only ALLOWED_UPDATE_FIELDS are passed to Mongoose
const updateVehicle = async (req, res, next) => {
  try {
    const updateData = pickFields(req.body, ALLOWED_UPDATE_FIELDS);

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// ── DELETE /api/vehicles/:id ──────────────────────────────────────────────────
// Deletes a vehicle from the database
const deleteVehicle = async (req, res, next) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.status(200).json({ success: true, message: 'Vehicle deleted successfully' });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/vehicles/:id/status ───────────────────────────────────────────
// Updates only the status field (Available | Booked | Maintenance)
// express-validator updateStatusRules already validated the status value before this
const updateVehicleStatus = async (req, res, next) => {
  try {
    const { status } = req.body;

    // When status changes, also update the available boolean for consistency
    const available = status === 'Available';

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status, available },
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

// ── PATCH /api/vehicles/:id/availability ─────────────────────────────────────
// Updates only the available boolean field
const updateVehicleAvailability = async (req, res, next) => {
  try {
    const { available } = req.body;
    if (available === undefined) {
      return res.status(400).json({
        success: false,
        message: 'available field is required (true or false)',
      });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    );
    if (!vehicle) {
      return res.status(404).json({ success: false, message: 'Vehicle not found' });
    }
    res.status(200).json({ success: true, data: vehicle });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllVehicles,
  getVehicleById,
  createVehicle,
  updateVehicle,
  deleteVehicle,
  updateVehicleStatus,
  updateVehicleAvailability,
};
