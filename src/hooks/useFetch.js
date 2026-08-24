// useFetch.js — Custom Hook #2 (Experiment 2)
// A reusable data-fetching hook that simulates an async load from mock data.
// Demonstrates: useState + useEffect + loading/error states.
//
// Usage:
//   const { data, loading, error } = useFetch(mockVehicles);

import { useState, useEffect } from 'react';

/**
 * useFetch — simulates fetching data asynchronously from a mock data source.
 * @param {Array|Object} mockData  — the mock data to "load"
 * @param {number} delay           — simulated network delay in ms (default: 800)
 */
export function useFetch(mockData, delay = 800) {
  const [data, setData] = useState(null);       // loaded data
  const [loading, setLoading] = useState(true); // loading state
  const [error, setError] = useState(null);     // error state

  useEffect(() => {
    // Reset states when mockData changes
    setLoading(true);
    setError(null);
    setData(null);

    // Simulate async fetch with a timeout
    const timer = setTimeout(() => {
      try {
        if (!mockData) throw new Error('No data source provided.');
        setData(mockData);
      } catch (err) {
        setError(err.message || 'Failed to load data.');
      } finally {
        setLoading(false);
      }
    }, delay);

    // Cleanup: cancel the timer if the component unmounts early
    return () => clearTimeout(timer);
  }, [mockData, delay]);

  return { data, loading, error };
}
