// BookingContext.jsx — Experiment 3: Complex State Management with Context API
// Centrally manages all booking-related state and updates vehicle status accordingly.
import { createContext, useState, useContext, useCallback } from 'react';
import { bookings as initialBookings } from '../data/bookings';
import { VehicleContext } from './VehicleContext';

export const BookingContext = createContext(null);

export function BookingProvider({ children }) {
  const [bookings, setBookings] = useState(initialBookings);
  const vehicleCtx = useContext(VehicleContext);

  // Helper to update vehicle status/availability if VehicleContext is available
  const setVehicleState = useCallback((vehicleId, available, status) => {
    if (vehicleCtx) {
      vehicleCtx.updateVehicleAvailability(vehicleId, available);
      vehicleCtx.updateVehicleStatus(vehicleId, status);
    }
  }, [vehicleCtx]);

  /** addBooking — adds a new booking and marks the corresponding vehicle as Booked */
  const addBooking = useCallback((booking) => {
    const newBooking = {
      ...booking,
      id: booking.id || `BK-${Math.floor(Math.random() * 90000) + 10000}`,
      status: booking.status || 'Confirmed',
    };
    setBookings((prev) => [newBooking, ...prev]);
    // Mark vehicle as booked / unavailable
    setVehicleState(newBooking.vehicleId, false, 'Booked');
  }, [setVehicleState]);

  /** cancelBooking — cancels a booking and marks the vehicle as Available */
  const cancelBooking = useCallback((bookingId) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
    );
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      setVehicleState(booking.vehicleId, true, 'Available');
    }
  }, [bookings, setVehicleState]);

  /** updateBookingStatus — updates status of a booking and adjusts vehicle status if needed */
  const updateBookingStatus = useCallback((bookingId, status) => {
    setBookings((prev) =>
      prev.map((b) => (b.id === bookingId ? { ...b, status } : b))
    );
    const booking = bookings.find((b) => b.id === bookingId);
    if (booking) {
      if (status === 'Cancelled' || status === 'Completed') {
        setVehicleState(booking.vehicleId, true, 'Available');
      } else if (status === 'Active' || status === 'Confirmed') {
        setVehicleState(booking.vehicleId, false, 'Booked');
      }
    }
  }, [bookings, setVehicleState]);

  /** getCustomerBookings — returns bookings filtered by customerId */
  const getCustomerBookings = useCallback((customerId) => {
    return bookings.filter((b) => b.customerId === customerId);
  }, [bookings]);

  /** getBookingById — retrieves a booking by its ID */
  const getBookingById = useCallback((id) => {
    return bookings.find((b) => b.id === id) || null;
  }, [bookings]);

  const value = {
    bookings,
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
