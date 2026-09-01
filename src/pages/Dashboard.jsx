// Dashboard.jsx — Dynamic dashboard router
// Reads user.role from AuthContext and renders the correct dashboard view.
// - customer      → CustomerDashboard
// - fleet_manager → FleetDashboard
// - admin         → FleetDashboard (admin overview with full fleet access)

import { useAuth } from '../hooks/useAuth';
import CustomerDashboard from './CustomerDashboard';
import FleetDashboard from './FleetDashboard';

export default function Dashboard() {
  const { user } = useAuth();

  if (user?.role === 'customer') {
    return <CustomerDashboard />;
  }

  // fleet_manager and admin both get the Fleet Dashboard
  return <FleetDashboard />;
}
