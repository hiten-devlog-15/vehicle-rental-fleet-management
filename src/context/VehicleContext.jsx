// VehicleContext.jsx — Experiment 3 (Context API) + Experiment 4 (REST API + MongoDB)
//
// Architecture after Experiment 4:
//   MongoDB  →  Express REST API  →  VehicleContext (state)  →  React Components
//
// Context API remains the frontend state layer (Experiment 3 preserved).
// On mount, vehicles are loaded from GET /api/vehicles instead of static data.
// All mutation functions (add, remove, update, status) now also call the backend API.

import { createContext, useState, useCallback, useEffect } from 'react';
import * as api from '../services/api';

// ── Context creation ──────────────────────────────────────────────────────────
export const VehicleContext = createContext(null);

// ── VehicleProvider ───────────────────────────────────────────────────────────
export function VehicleProvider({ children }) {
  // Central vehicle state — single source of truth for the entire application
  const [vehicles, setVehicles] = useState([]);

  // Currently selected vehicle (used by booking flow)
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  // Loading and error states for Experiment 4 API integration
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // ── Experiment 4: Load vehicles from MongoDB via REST API on mount ───────────
  useEffect(() => {
    const loadVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await api.getVehicles();

        // Normalize MongoDB documents: map _id → id so all components
        // that use v.id (VehicleDetails, BookingForm, etc.) continue to work
        const normalized = data.map((v) => ({
          ...v,
          id: v._id, // expose _id as id for backward compatibility
        }));

        setVehicles(normalized);
      } catch (err) {
        console.error('VehicleContext: failed to load vehicles from API:', err.message);
        setError(err.message);
        // Keep vehicles as empty array so the UI shows "no vehicles" instead of crashing
      } finally {
        setLoading(false);
      }
    };

    loadVehicles();
  }, []); // Empty dependency array = runs once on mount

  /** getVehicleById — find a vehicle from shared state by its id (_id) */
  const getVehicleById = useCallback(
    (id) => vehicles.find((v) => v.id === id || v._id === id) || null,
    [vehicles]
  );

  /** selectVehicle — set the vehicle currently being viewed / booked */
  const selectVehicle = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  /**
   * updateVehicleAvailability — toggle the available boolean.
   * Called by BookingContext when bookings are added/cancelled.
   * Also calls PATCH /api/vehicles/:id/availability to persist to MongoDB.
   */
  const updateVehicleAvailability = useCallback(async (vehicleId, available) => {
    // Optimistic UI update
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId || v._id === vehicleId ? { ...v, available } : v))
    );
    try {
      await api.updateVehicleAvailability(vehicleId, available);
    } catch (err) {
      console.error('Failed to update vehicle availability in DB:', err.message);
    }
  }, []);

  /**
   * updateVehicleStatus — set the status string for a vehicle.
   * Status values: "Available" | "Booked" | "Maintenance"
   * Also syncs the available boolean and persists to MongoDB.
   */
  const updateVehicleStatus = useCallback(async (vehicleId, status) => {
    // Optimistic UI update
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId || v._id === vehicleId
          ? { ...v, status, available: status === 'Available' }
          : v
      )
    );
    try {
      await api.updateVehicleStatus(vehicleId, status);
    } catch (err) {
      console.error('Failed to update vehicle status in DB:', err.message);
    }
  }, []);

  /** addVehicle — Fleet Manager adds a new vehicle (saves to MongoDB) */
  const addVehicle = useCallback(async (vehicleData) => {
    try {
      const created = await api.createVehicle(vehicleData);
      const normalized = { ...created, id: created._id };
      setVehicles((prev) => [...prev, normalized]);
      return { success: true, vehicle: normalized };
    } catch (err) {
      console.error('Failed to add vehicle:', err.message);
      return { success: false, error: err.message };
    }
  }, []);

  /** removeVehicle — Fleet Manager removes a vehicle (deletes from MongoDB) */
  const removeVehicle = useCallback(async (vehicleId) => {
    try {
      await api.deleteVehicle(vehicleId);
      setVehicles((prev) => prev.filter((v) => v.id !== vehicleId && v._id !== vehicleId));
    } catch (err) {
      console.error('Failed to remove vehicle:', err.message);
    }
  }, []);

  /** updateVehicle — Fleet Manager edits vehicle details (updates MongoDB) */
  const updateVehicle = useCallback(async (updatedVehicle) => {
    try {
      const vehicleId = updatedVehicle.id || updatedVehicle._id;
      const updated = await api.updateVehicle(vehicleId, updatedVehicle);
      const normalized = { ...updated, id: updated._id };
      setVehicles((prev) =>
        prev.map((v) => (v.id === vehicleId || v._id === vehicleId ? normalized : v))
      );
    } catch (err) {
      console.error('Failed to update vehicle:', err.message);
    }
  }, []);

  const value = {
    vehicles,
    selectedVehicle,
    loading,
    error,
    getVehicleById,
    selectVehicle,
    updateVehicleAvailability,
    updateVehicleStatus,
    addVehicle,
    removeVehicle,
    updateVehicle,
  };

  return (
    <VehicleContext.Provider value={value}>
      {children}
    </VehicleContext.Provider>
  );
}
