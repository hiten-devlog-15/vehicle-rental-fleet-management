// VehicleContext.jsx — Experiment 3: Complex State Management with Context API
// Centralizes all vehicle-related state so multiple components share the same data.
// Eliminates prop drilling — any component wraps useVehicles() to access this state.

import { createContext, useState, useCallback } from 'react';
import { vehicles as initialVehicles } from '../data/vehicles';

// ── Context creation ──────────────────────────────────────────────────────────
export const VehicleContext = createContext(null);

// ── Initial status derivation ─────────────────────────────────────────────────
// Royal Enfield (v006) starts as "Maintenance" to give the Fleet Dashboard
// a realistic mix of statuses for the demonstration.
const INITIAL_MAINTENANCE_IDS = ['v006'];

const initVehicles = initialVehicles.map((v) => ({
  ...v,
  // Derive status from existing available boolean + maintenance override
  status: INITIAL_MAINTENANCE_IDS.includes(v.id)
    ? 'Maintenance'
    : v.available
    ? 'Available'
    : 'Booked',
}));

// ── VehicleProvider ───────────────────────────────────────────────────────────
export function VehicleProvider({ children }) {
  // Central vehicle state — single source of truth for the entire application
  const [vehicles, setVehicles] = useState(initVehicles);

  // Currently selected vehicle (used by booking flow)
  const [selectedVehicle, setSelectedVehicle] = useState(null);

  /** getVehicleById — find a vehicle from shared state by its ID */
  const getVehicleById = useCallback(
    (id) => vehicles.find((v) => v.id === id) || null,
    [vehicles]
  );

  /** selectVehicle — set the vehicle currently being viewed / booked */
  const selectVehicle = useCallback((vehicle) => {
    setSelectedVehicle(vehicle);
  }, []);

  /**
   * updateVehicleAvailability — toggle the available boolean.
   * Called automatically by BookingContext when bookings are added/cancelled.
   */
  const updateVehicleAvailability = useCallback((vehicleId, available) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, available } : v))
    );
  }, []);

  /**
   * updateVehicleStatus — set the status string for a vehicle.
   * Status values: "Available" | "Booked" | "Maintenance"
   * Also syncs the available boolean for backward compatibility.
   */
  const updateVehicleStatus = useCallback((vehicleId, status) => {
    setVehicles((prev) =>
      prev.map((v) =>
        v.id === vehicleId
          ? { ...v, status, available: status === 'Available' }
          : v
      )
    );
  }, []);

  /** addVehicle — Fleet Manager adds a new vehicle to shared state */
  const addVehicle = useCallback((vehicle) => {
    setVehicles((prev) => [...prev, vehicle]);
  }, []);

  /** removeVehicle — Fleet Manager removes a vehicle from shared state */
  const removeVehicle = useCallback((vehicleId) => {
    setVehicles((prev) => prev.filter((v) => v.id !== vehicleId));
  }, []);

  /** updateVehicle — Fleet Manager edits vehicle details in shared state */
  const updateVehicle = useCallback((updatedVehicle) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === updatedVehicle.id ? updatedVehicle : v))
    );
  }, []);

  const value = {
    vehicles,
    selectedVehicle,
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
