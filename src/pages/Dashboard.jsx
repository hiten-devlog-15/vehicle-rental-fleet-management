// Dashboard.jsx — Dynamic role-based dashboard router
// Reads verified user.role from AuthContext and renders the corresponding view:
// - customer      → CustomerDashboard
// - fleet_manager → FleetDashboard
// - admin         → AdminDashboard

import { useAuth } from '../hooks/useAuth';
import CustomerDashboard from './CustomerDashboard';
import FleetDashboard from './FleetDashboard';
import AdminDashboard from './AdminDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'customer') {
    return <CustomerDashboard />;
  }

  if (user?.role === 'admin') {
    return <AdminDashboard />;
  }

  // fleet_manager and manager get the Fleet Dashboard
  return <FleetDashboard />;
}
