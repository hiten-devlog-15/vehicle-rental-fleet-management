// controllers/vehicleController.js — CRUD operations for vehicles
// Each function handles one API endpoint and sends a JSON response.

const Vehicle = require('../models/Vehicle');

// ── GET /api/vehicles ─────────────────────────────────────────────────────────
// Returns all vehicles from MongoDB
const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.find();
    res.status(200).json(vehicles);
  } catch (error) {
    res.status(500).json({ message: 'Server error: could not fetch vehicles', error: error.message });
  }
};

// ── GET /api/vehicles/:id ─────────────────────────────────────────────────────
// Returns a single vehicle by its MongoDB _id
const getVehicleById = async (req, res) => {
  try {
    const vehicle = await Vehicle.findById(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    // CastError happens when the id format is invalid (not a valid ObjectId)
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vehicle ID format' });
    }
    res.status(500).json({ message: 'Server error: could not fetch vehicle', error: error.message });
  }
};

// ── POST /api/vehicles ────────────────────────────────────────────────────────
// Creates a new vehicle
const createVehicle = async (req, res) => {
  try {
    const { name, type, brand, pricePerDay } = req.body;

    // Basic validation
    if (!name || !type || !brand || pricePerDay === undefined) {
      return res.status(400).json({ message: 'name, type, brand, and pricePerDay are required' });
    }
    if (pricePerDay < 0) {
      return res.status(400).json({ message: 'pricePerDay cannot be negative' });
    }

    const vehicle = await Vehicle.create(req.body);
    res.status(201).json(vehicle);
  } catch (error) {
    if (error.name === 'ValidationError') {
      // Extract Mongoose validation error messages
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    res.status(500).json({ message: 'Server error: could not create vehicle', error: error.message });
  }
};

// ── PUT /api/vehicles/:id ─────────────────────────────────────────────────────
// Updates all fields of an existing vehicle
const updateVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map((e) => e.message);
      return res.status(400).json({ message: messages.join(', ') });
    }
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vehicle ID format' });
    }
    res.status(500).json({ message: 'Server error: could not update vehicle', error: error.message });
  }
};

// ── DELETE /api/vehicles/:id ──────────────────────────────────────────────────
// Deletes a vehicle from the database
const deleteVehicle = async (req, res) => {
  try {
    const vehicle = await Vehicle.findByIdAndDelete(req.params.id);
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json({ message: 'Vehicle deleted successfully' });
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vehicle ID format' });
    }
    res.status(500).json({ message: 'Server error: could not delete vehicle', error: error.message });
  }
};

// ── PATCH /api/vehicles/:id/status ───────────────────────────────────────────
// Updates only the status field (Available | Booked | Maintenance)
const updateVehicleStatus = async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Available', 'Booked', 'Maintenance'];

    if (!status || !validStatuses.includes(status)) {
      return res.status(400).json({
        message: `Status must be one of: ${validStatuses.join(', ')}`,
      });
    }

    // When status changes, also update the available boolean for consistency
    const available = status === 'Available';

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { status, available },
      { new: true, runValidators: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vehicle ID format' });
    }
    res.status(500).json({ message: 'Server error: could not update status', error: error.message });
  }
};

// ── PATCH /api/vehicles/:id/availability ─────────────────────────────────────
// Updates only the available boolean field
const updateVehicleAvailability = async (req, res) => {
  try {
    const { available } = req.body;
    if (available === undefined) {
      return res.status(400).json({ message: 'available field is required (true or false)' });
    }

    const vehicle = await Vehicle.findByIdAndUpdate(
      req.params.id,
      { available },
      { new: true }
    );
    if (!vehicle) {
      return res.status(404).json({ message: 'Vehicle not found' });
    }
    res.status(200).json(vehicle);
  } catch (error) {
    if (error.name === 'CastError') {
      return res.status(400).json({ message: 'Invalid vehicle ID format' });
    }
    res.status(500).json({ message: 'Server error', error: error.message });
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
