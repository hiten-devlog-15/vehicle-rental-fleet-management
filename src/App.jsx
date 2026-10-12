import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { SocketProvider } from './context/SocketContext';
import { VehicleProvider } from './context/VehicleContext';
import { BookingProvider } from './context/BookingContext';
import NotificationToast from './components/NotificationToast';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import FleetDashboard from './pages/FleetDashboard';
import AdminDashboard from './pages/AdminDashboard';
import Maintenance from './pages/Maintenance';
import Profile from './pages/Profile';
import { useAuth } from './hooks/useAuth';

function FleetDashboardRoute() {
  const { user } = useAuth();
  if (user?.role === 'fleet_manager' || user?.role === 'manager') {
    return <Navigate to="/dashboard" replace />;
  }
  return <FleetDashboard />;
}

function CustomerVehiclesRoute() {
  const { user } = useAuth();
  if (user?.role === 'fleet_manager' || user?.role === 'manager') {
    return <Navigate to="/dashboard" replace />;
  }
  return <Vehicles />;
}

function CustomerVehicleDetailsRoute() {
  const { user } = useAuth();
  if (user?.role === 'fleet_manager' || user?.role === 'manager') {
    return <Navigate to="/dashboard" replace />;
  }
  return <VehicleDetails />;
}

export default function App() {
  return (
    // AuthProvider wraps the entire app, followed by SocketProvider for real-time WebSockets
    <AuthProvider>
      <SocketProvider>
        <VehicleProvider>
          <BookingProvider>
            <Router>
              <NotificationToast />
              <Routes>
              {/* ── Public routes ─────────────────────────────────────── */}
              <Route path="/"         element={<Home />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ── Vehicle browsing (customers, guests, admins; fleet manager redirected to dashboard) ── */}
              <Route path="/vehicles"     element={<CustomerVehiclesRoute />} />
              <Route path="/vehicles/:id" element={<CustomerVehicleDetailsRoute />} />

              {/* ── /dashboard: role-aware dynamic dashboard ──────────── */}
              <Route
                path="/dashboard"
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                }
              />

              {/* ── Customer + Admin only ─────────────────────────────── */}
              <Route
                path="/booking"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'admin']}>
                    <Booking />
                  </ProtectedRoute>
                }
              />

              {/* ── Fleet Manager + Admin only ────────────────────────── */}
              <Route
                path="/maintenance"
                element={
                  <ProtectedRoute allowedRoles={['fleet_manager', 'admin']}>
                    <Maintenance />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/fleet-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['fleet_manager', 'admin']}>
                    <FleetDashboardRoute />
                  </ProtectedRoute>
                }
              />

              {/* ── Admin only ─────────────────────────────────────────── */}
              <Route
                path="/admin-dashboard"
                element={
                  <ProtectedRoute allowedRoles={['admin']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                }
              />

              {/* ── Profile & Account Settings (all authenticated roles) ── */}
              <Route
                path="/profile"
                element={
                  <ProtectedRoute allowedRoles={['customer', 'fleet_manager', 'manager', 'admin']}>
                    <Profile />
                  </ProtectedRoute>
                }
              />

              {/* ── Legacy dashboard aliases → redirect to /dashboard ─── */}
              <Route path="/customer-dashboard" element={<Navigate to="/dashboard" replace />} />

              {/* ── Catch-all → home ──────────────────────────────────── */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </Router>
        </BookingProvider>
      </VehicleProvider>
    </SocketProvider>
  </AuthProvider>
);
}

