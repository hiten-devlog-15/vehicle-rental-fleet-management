// App.jsx — Experiment 2 & 3: wrapped with Providers
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { VehicleProvider } from './context/VehicleContext';
import { BookingProvider } from './context/BookingContext';
import Home from './pages/Home';
import Vehicles from './pages/Vehicles';
import VehicleDetails from './pages/VehicleDetails';
import Booking from './pages/Booking';
import Login from './pages/Login';
import Register from './pages/Register';
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
              <Route path="/"                    element={<Home />} />
              <Route path="/vehicles"            element={<Vehicles />} />
              <Route path="/vehicles/:id"        element={<VehicleDetails />} />
              <Route path="/booking"             element={<Booking />} />
              <Route path="/login"               element={<Login />} />
              <Route path="/register"            element={<Register />} />
              <Route path="/customer-dashboard"  element={<CustomerDashboard />} />
              <Route path="/fleet-dashboard"     element={<FleetDashboard />} />
              <Route path="/maintenance"         element={<Maintenance />} />
            </Routes>
          </Router>
        </BookingProvider>
      </VehicleProvider>
    </AuthProvider>
  );
}
