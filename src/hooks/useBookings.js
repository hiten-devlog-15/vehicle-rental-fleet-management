// useBookings.js — Custom Hook (Experiment 3)
// Provides a clean, reusable way to access BookingContext.
import { useContext } from 'react';
import { BookingContext } from '../context/BookingContext';

export function useBookings() {
  const context = useContext(BookingContext);

  if (context === null) {
    throw new Error('useBookings must be used within a BookingProvider');
  }

  return context;
}
