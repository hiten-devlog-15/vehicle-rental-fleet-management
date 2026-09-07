// src/services/api.js — API Service Layer for DriveFleet (Experiment 4)
//
// This file centralises all HTTP calls to the Express backend.
// React Context files import these functions — components never call fetch() directly.
//
// Architecture:
//   React Component → useVehicles() / useBookings() → Context → api.js → Express → MongoDB

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Helper: generic fetch wrapper ─────────────────────────────────────────────
// Handles response parsing and throws errors for non-OK responses.
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const data = await response.json();

  if (!response.ok) {
    // Throw the backend's error message if available
    throw new Error(data.message || `Request failed with status ${response.status}`);
  }

  return data;
}

// ═══════════════════════════════════════════════════════════════════════════════
// VEHICLE API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/vehicles — fetch all vehicles */
export const getVehicles = () => request('/vehicles');

/** GET /api/vehicles/:id — fetch one vehicle by MongoDB _id */
export const getVehicleById = (id) => request(`/vehicles/${id}`);

/** POST /api/vehicles — create a new vehicle */
export const createVehicle = (vehicleData) =>
  request('/vehicles', {
    method: 'POST',
    body: JSON.stringify(vehicleData),
  });

/** PUT /api/vehicles/:id — update a vehicle */
export const updateVehicle = (id, vehicleData) =>
  request(`/vehicles/${id}`, {
    method: 'PUT',
    body: JSON.stringify(vehicleData),
  });

/** DELETE /api/vehicles/:id — delete a vehicle */
export const deleteVehicle = (id) =>
  request(`/vehicles/${id}`, { method: 'DELETE' });

/** PATCH /api/vehicles/:id/status — update vehicle status only */
export const updateVehicleStatus = (id, status) =>
  request(`/vehicles/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

/** PATCH /api/vehicles/:id/availability — update vehicle availability only */
export const updateVehicleAvailability = (id, available) =>
  request(`/vehicles/${id}/availability`, {
    method: 'PATCH',
    body: JSON.stringify({ available }),
  });

// ═══════════════════════════════════════════════════════════════════════════════
// BOOKING API FUNCTIONS
// ═══════════════════════════════════════════════════════════════════════════════

/** GET /api/bookings — fetch all bookings */
export const getBookings = () => request('/bookings');

/** GET /api/bookings/:id — fetch one booking */
export const getBookingById = (id) => request(`/bookings/${id}`);

/** POST /api/bookings — create a new booking (also updates vehicle status) */
export const createBooking = (bookingData) =>
  request('/bookings', {
    method: 'POST',
    body: JSON.stringify(bookingData),
  });

/** PUT /api/bookings/:id — update booking details */
export const updateBooking = (id, bookingData) =>
  request(`/bookings/${id}`, {
    method: 'PUT',
    body: JSON.stringify(bookingData),
  });

/** PATCH /api/bookings/:id/status — update booking status (cancel, confirm, etc.) */
export const updateBookingStatus = (id, status) =>
  request(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

/** DELETE /api/bookings/:id — delete a booking */
export const deleteBooking = (id) =>
  request(`/bookings/${id}`, { method: 'DELETE' });
