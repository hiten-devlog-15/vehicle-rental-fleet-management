// useAuth.js — Custom Hook #1 (Experiment 2)
// Provides a clean, reusable way to access AuthContext.
// Usage: const { user, isAuthenticated, login, logout } = useAuth();

import { useContext } from 'react';
import { AuthContext } from '../context/AuthContext';

export function useAuth() {
  const context = useContext(AuthContext);

  // Guard: ensure this hook is used inside AuthProvider
  if (context === null) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return context;
}
