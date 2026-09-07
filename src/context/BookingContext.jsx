// BookingContext.jsx — Experiment 3 (Context API) + Experiment 4 (REST API + MongoDB)
//
// Architecture after Experiment 4:
//   MongoDB  →  Express REST API  →  BookingContext (state)  →  React Components
//
// Context API remains the frontend state layer (Experiment 3 preserved).
// On mount, bookings are loaded from GET /api/bookings.
// addBooking calls POST /api/bookings (which also updates vehicle status in MongoDB).
// cancelBooking calls PATCH /api/bookings/:id/status (which also frees the vehicle).

import { createContext, useState, useContext, useCallback, useEffect } from 'react';
import { VehicleContext } from './VehicleContext';
import * as api from '../services/api';

export const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState([]);
  const [bookingLoading, setBookingLoading] = useState(true);
  const [bookingError, setBookingError] = useState(null);
  const vehicleCtx = useContext(VehicleContext);

  // ── Experiment 4: Load bookings from MongoDB on mount ─────────────────────
  useEffect(() => {
    const loadBookings = async () => {
      try {
        setBookingLoading(true);
        setBookingError(null);
        const data = await api.getBookings();

        // Normalize MongoDB documents: map _id → id for consistency
        const normalized = data.map((b) => ({
          ...b,
          id: b._id,
          // vehicleId from bookings is a MongoDB ObjectId — keep as string
          vehicleId: b.vehicleId?._id || b.vehicleId,
        }));

        setBookings(normalized);
      } catch (err) {
        console.error('BookingContext: failed to load bookings from API:', err.message);
        setBookingError(err.message);
      } finally {
        setBookingLoading(false);
      }
    };

    loadBookings();
  }, []);

  // Helper to update vehicle status/availability in VehicleContext if available
  const setVehicleState = useCallback((vehicleId, available, status) => {
    if (vehicleCtx) {
      vehicleCtx.updateVehicleStatus(vehicleId, status);
      // updateVehicleStatus already syncs available, but also call availability for safety
      vehicleCtx.updateVehicleAvailability(vehicleId, available);
    }
  }, [vehicleCtx]);

  /**
   * addBooking — creates a new booking via POST /api/bookings
   * The backend automatically checks vehicle availability and sets vehicle to Booked.
   * On success, updates the context state and vehicle context.
   */
  const addBooking = useCallback(async (bookingData) => {
    try {
      const created = await api.createBooking(bookingData);
      const normalized = {
        ...created,
        id: created._id,
        vehicleId: created.vehicleId?._id || created.vehicleId || bookingData.vehicleId,
      };
      setBookings((prev) => [normalized, ...prev]);
      // Sync vehicle status in VehicleContext (optimistic update already done by updateVehicleStatus)
      setVehicleState(normalized.vehicleId, false, 'Booked');
      return { success: true, booking: normalized };
    } catch (err) {
      console.error('Failed to create booking:', err.message);
      return { success: false, error: err.message };
    }
  }, [setVehicleState]);

  /**
   * cancelBooking — sets booking status to Cancelled via PATCH /api/bookings/:id/status
   * The backend automatically sets the vehicle back to Available.
   */
  const cancelBooking = useCallback(async (bookingId) => {
    try {
      // Find the booking before updating (needed to sync vehicle context)
      const booking = bookings.find((b) => b.id === bookingId || b._id === bookingId);

      await api.updateBookingStatus(bookingId, 'Cancelled');

      // Update context state
      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId || b._id === bookingId ? { ...b, status: 'Cancelled' } : b
        )
      );

      // Free the vehicle in VehicleContext
      if (booking) {
        setVehicleState(booking.vehicleId, true, 'Available');
      }
    } catch (err) {
      console.error('Failed to cancel booking:', err.message);
    }
  }, [bookings, setVehicleState]);

  /**
   * updateBookingStatus — updates status via PATCH /api/bookings/:id/status
   * Also syncs vehicle status in VehicleContext based on new booking status.
   */
  const updateBookingStatus = useCallback(async (bookingId, status) => {
    try {
      const booking = bookings.find((b) => b.id === bookingId || b._id === bookingId);

      await api.updateBookingStatus(bookingId, status);

      setBookings((prev) =>
        prev.map((b) =>
          b.id === bookingId || b._id === bookingId ? { ...b, status } : b
        )
      );

      if (booking) {
        if (status === 'Cancelled' || status === 'Completed') {
          setVehicleState(booking.vehicleId, true, 'Available');
        } else if (status === 'Active' || status === 'Confirmed') {
          setVehicleState(booking.vehicleId, false, 'Booked');
        }
      }
    } catch (err) {
      console.error('Failed to update booking status:', err.message);
    }
  }, [bookings, setVehicleState]);

  /** getCustomerBookings — returns bookings filtered by customerId */
  const getCustomerBookings = useCallback((customerId) => {
    return bookings.filter((b) => b.customerId === customerId);
  }, [bookings]);

  /** getBookingById — retrieves a booking by its ID */
  const getBookingById = useCallback((id) => {
    return bookings.find((b) => b.id === id || b._id === id) || null;
  }, [bookings]);

  const value = {
    bookings,
    bookingLoading,
    bookingError,
    addBooking,
    cancelBooking,
    updateBookingStatus,
    getCustomerBookings,
    getBookingById,
  };

  return (
    <BookingContext.Provider value={value}>
      {children}
    </BookingContext.Provider>
  );
}
