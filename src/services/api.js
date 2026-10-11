// src/services/api.js — API Service Layer for DriveFleet (Experiment 5 & Real JWT Auth)
//
// Features:
//   - Handles API requests with automatic Authorization header (JWT Bearer token)
//   - Unwraps backend responses transparently for backward compatibility
//   - Exports helper functions for Vehicles, Bookings, User Auth, and Session Management

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

// ── Token Storage Helpers ─────────────────────────────────────────────────────
export const getToken = () => localStorage.getItem('drivefleet_token') || sessionStorage.getItem('drivefleet_token');
export const setToken = (token, remember = true) => {
  if (remember) {
    localStorage.setItem('drivefleet_token', token);
    sessionStorage.removeItem('drivefleet_token');
  } else {
    sessionStorage.setItem('drivefleet_token', token);
    localStorage.removeItem('drivefleet_token');
  }
};
export const removeToken = () => {
  localStorage.removeItem('drivefleet_token');
  sessionStorage.removeItem('drivefleet_token');
};

// ── Helper: generic fetch wrapper ─────────────────────────────────────────────
async function request(path, options = {}) {
  const token = getToken();

  const headers = {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {}),
  };

  const response = await fetch(`${BASE_URL}${path}`, {
    ...options,
    headers,
  });

  const json = await response.json();

  if (!response.ok) {
    let errorMessage = json.message || `Request failed with status ${response.status}`;

    if (json.errors && json.errors.length > 0) {
      const fieldErrors = json.errors.map((e) => `${e.field}: ${e.message}`).join('; ');
      errorMessage = `${errorMessage} — ${fieldErrors}`;
    }

    throw new Error(errorMessage);
  }

  // If response has a token field (e.g. login/register), return full JSON
  if (json && json.token) {
    return json;
  }

  // Unwrap backend standard responses: { success: true, data: ... }
  if (json && json.success === true && json.data !== undefined) {
    return json.data;
  }

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

/** POST /api/bookings — create a new booking */
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

/** PATCH /api/bookings/:id/status — update booking status */
export const updateBookingStatus = (id, status) =>
  request(`/bookings/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });

/** DELETE /api/bookings/:id — delete a booking */
export const deleteBooking = (id) =>
  request(`/bookings/${id}`, { method: 'DELETE' });

// ═══════════════════════════════════════════════════════════════════════════════
// USER & AUTH API FUNCTIONS (Real JWT Authentication)
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

/** GET /api/auth/me — fetch authenticated user profile using stored JWT token */
export const getMe = () => request('/auth/me');

/** GET /api/auth/users — fetch all registered users from MongoDB Atlas */
export const getUsers = () => request('/auth/users');
