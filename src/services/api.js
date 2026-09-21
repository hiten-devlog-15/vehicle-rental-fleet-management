// src/services/api.js — API Service Layer for DriveFleet (Experiment 5)
//
// Experiment 5 change:
//   The backend now returns { success: true, data: ... } for all successful responses.
//   The request() helper now unwraps the 'data' field transparently, so all callers
//   (VehicleContext, BookingContext, components) continue to work with no changes.
//
// Architecture:
//   React Component → useVehicles() / useBookings() → Context → api.js → Express → MongoDB

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Helper: generic fetch wrapper ─────────────────────────────────────────────
// Handles response parsing, unwraps { success, data } envelope from Experiment 5 backend,
// and throws errors for non-OK responses with meaningful messages.
async function request(path, options = {}) {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });

  const json = await response.json();

  if (!response.ok) {
    // Build a helpful error message from the backend response
    // Experiment 5 backend sends: { success: false, message: "...", errors: [...] }
    let errorMessage = json.message || `Request failed with status ${response.status}`;

    // If there are validation errors, append the first field-specific message
    if (json.errors && json.errors.length > 0) {
      const fieldErrors = json.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      errorMessage = `${errorMessage} — ${fieldErrors}`;
    }

    throw new Error(errorMessage);
  }

  // Experiment 5: backend wraps success responses as { success: true, data: ... }
  // Unwrap so callers receive the data directly (backward compatible with all contexts)
  if (json && json.success === true && json.data !== undefined) {
    return json.data;
  }

  // For responses without a data wrapper (e.g., { success: true, message: "deleted" })
  // return the full json so callers can read .message if needed
  return json;
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

// ═══════════════════════════════════════════════════════════════════════════════
// USER & AUTH API FUNCTIONS (Experiment 5 Extension: MongoDB Atlas Users)
// ═══════════════════════════════════════════════════════════════════════════════

/** POST /api/auth/register — register a new user in MongoDB Atlas */
export const registerUser = (userData) =>
  request('/auth/register', {
    method: 'POST',
    body: JSON.stringify(userData),
  });

/** POST /api/auth/login — authenticate user against MongoDB Atlas */
export const loginUser = (credentials) =>
  request('/auth/login', {
    method: 'POST',
    body: JSON.stringify(credentials),
  });

/** GET /api/auth/users — fetch all registered users from MongoDB Atlas */
export const getUsers = () => request('/auth/users');

