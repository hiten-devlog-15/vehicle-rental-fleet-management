// useVehicles.js — Custom Hook (Experiment 3)
// Provides a clean, reusable way to access VehicleContext.
import { useContext } from 'react';
import { VehicleContext } from '../context/VehicleContext';

export function useVehicles() {
  const context = useContext(VehicleContext);

  if (context === null) {
    throw new Error('useVehicles must be used within a VehicleProvider');
  }

  return context;
}
