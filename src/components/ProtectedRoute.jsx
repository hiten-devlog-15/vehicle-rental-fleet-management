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
  const { user, isAuthenticated, loading } = useAuth();

  // If session is restoring on page refresh, wait for verification
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <div className="w-9 h-9 border-3 border-blue-600 border-t-transparent rounded-full animate-spin" />
          <p className="text-sm font-medium text-slate-500">Verifying session...</p>
        </div>
      </div>
    );
  }

  // 1. Not logged in → send to login
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Logged in but role not permitted → send to their own role dashboard
  if (allowedRoles && (!user.role || !allowedRoles.includes(user.role))) {
    return <Navigate to="/dashboard" replace />;
  }

  // 3. Access granted
  return children;
}
