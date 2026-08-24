// AuthContext.jsx — Experiment 2: useContext demo
// Provides user authentication state throughout the application.
// Uses mock frontend authentication (no real backend / JWT in this experiment).

import { createContext, useState, useEffect } from 'react';

// ── Mock user database ────────────────────────────────────────────────────────
const MOCK_USERS = [
  {
    id: 'U001',
    name: 'Hiten Customer',
    email: 'customer@drivefleet.com',
    password: 'customer123',
    role: 'customer',
    avatar: 'HC',
  },
  {
    id: 'U002',
    name: 'Fleet Manager',
    email: 'manager@drivefleet.com',
    password: 'manager123',
    role: 'fleet_manager',
    avatar: 'FM',
  },
  {
    id: 'U003',
    name: 'DriveFleet Admin',
    email: 'admin@drivefleet.com',
    password: 'admin123',
    role: 'admin',
    avatar: 'DA',
  },
];

// ── Context creation ──────────────────────────────────────────────────────────
export const AuthContext = createContext(null);

// ── AuthProvider component ────────────────────────────────────────────────────
export function AuthProvider({ children }) {
  // Try to restore session from sessionStorage on first render
  const [user, setUser] = useState(() => {
    try {
      const saved = sessionStorage.getItem('drivefleet_user');
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const isAuthenticated = user !== null;

  // Keep sessionStorage in sync whenever user changes
  useEffect(() => {
    if (user) {
      sessionStorage.setItem('drivefleet_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('drivefleet_user');
    }
  }, [user]);

  /**
   * login — matches email + password against mock users.
   * Returns { success: true } or { success: false, error: string }.
   */
  const login = (email, password) => {
    const found = MOCK_USERS.find(
      (u) => u.email === email.trim().toLowerCase() && u.password === password
    );
    if (!found) {
      return { success: false, error: 'Invalid email or password.' };
    }
    // Store user without the password field
    const { password: _pw, ...safeUser } = found;
    setUser(safeUser);
    return { success: true, user: safeUser };
  };

  /** logout — clears user from state (and sessionStorage via useEffect) */
  const logout = () => {
    setUser(null);
  };

  const value = { user, isAuthenticated, login, logout, MOCK_USERS };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
