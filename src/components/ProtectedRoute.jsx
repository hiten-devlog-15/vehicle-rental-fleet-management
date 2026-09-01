// ProtectedRoute.jsx — RBAC route guard
// Redirects unauthenticated users to /login.
// Redirects authenticated users who lack the required role to /dashboard.

import { Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

/**
 * ProtectedRoute
 * @param {string[]} allowedRoles  — list of roles that may access this route.
 *                                   If omitted, any authenticated user is allowed.
 * @param {React.ReactNode} children — the page/component to render when access is granted.
 */
export default function ProtectedRoute({ allowedRoles, children }) {
  const { user, isAuthenticated } = useAuth();

  // 1. Not logged in → send to login
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in but role not permitted → send to their own dashboard
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Access granted
  return children;
}
