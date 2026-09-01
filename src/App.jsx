// App.jsx — RBAC: ProtectedRoute guards + dynamic /dashboard route
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { BookingProvider } from './context/BookingContext';
import ProtectedRoute from './components/ProtectedRoute';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import CustomerDashboard from './pages/CustomerDashboard';
import FleetDashboard from './pages/FleetDashboard';
import Maintenance from './pages/Maintenance';

export default function App() {
  return (
    // AuthProvider wraps the entire app so useContext(AuthContext) works everywhere
    <AuthProvider>
      <VehicleProvider>
        <BookingProvider>
          <Router>
            <Routes>
              {/* ── Public routes ─────────────────────────────────────── */}
              <Route path="/"         element={<Home />} />
              <Route path="/login"    element={<Login />} />
              <Route path="/register" element={<Register />} />

              {/* ── All authenticated users ───────────────────────────── */}
              <Route path="/vehicles"     element={<Vehicles />} />
              <Route path="/vehicles/:id" element={<VehicleDetails />} />

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
                    <FleetDashboard />
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
    </AuthProvider>
  );
}

