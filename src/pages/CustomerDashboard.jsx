// CustomerDashboard.jsx — Experiment 2 & 3: uses useAuth, useBookings, useVehicles
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import StatusBadge from '../components/StatusBadge';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useVehicles } from '../hooks/useVehicles';
import {
  Car, Calendar, CheckCircle, Clock, ChevronRight,
  Bell, User, MapPin, LogIn,
} from 'lucide-react';

export default function CustomerDashboard() {
  // useAuth — Custom Hook consuming AuthContext (Experiment 2)
  const { user, isAuthenticated } = useAuth();
  const { bookings, cancelBooking } = useBookings();
  const { vehicles } = useVehicles();

  const customerId = user?.id || 'C001';
  // Support both C001 (mock data) and U001 (logged-in customer) so mock bookings show up.
  const customerBookings = bookings.filter((b) => b.customerId === customerId || (customerId === 'U001' && b.customerId === 'C001'));
  const activeBooking = customerBookings.find((b) => b.status === 'Active');
  const activeVehicle = activeBooking ? vehicles.find((v) => v.id === activeBooking.vehicleId) : null;

  // useEffect — document title (Experiment 2)
  useEffect(() => {
    document.title = 'DriveFleet | Customer Dashboard';
    return () => { document.title = 'DriveFleet'; };
  }, []);

  const stats = [
    { title: 'Total Bookings',     value: customerBookings.length, icon: Calendar, color: 'blue',    trend: 20 },
    { title: 'Active Rental',      value: customerBookings.filter((b) => b.status === 'Active').length, icon: Car, color: 'emerald', trend: 0 },
    { title: 'Completed Rentals',  value: customerBookings.filter((b) => b.status === 'Completed').length, icon: CheckCircle, color: 'slate', trend: 33 },
    { title: 'Upcoming Bookings',  value: customerBookings.filter((b) => b.status === 'Confirmed').length, icon: Clock, color: 'amber', trend: 0 },
  ];

  // Display name: use logged-in user name if available, else fallback to mock name
  const displayName = user?.name || 'Arjun Sharma';
  const displayRole = user?.role ? user.role.replace('_', ' ') : 'Customer';

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar role="customer" />

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {/* Top bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30">
          <div>
            <h1 className="text-xl font-bold text-slate-800">My Dashboard</h1>
            {/* useContext value displayed here (Experiment 2) */}
            <p className="text-xs text-slate-500">
              Welcome back, <span className="font-semibold text-blue-600">{displayName}</span> 👋
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button className="relative p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200 transition-colors">
              <Bell size={18} />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </button>
            <div className="flex items-center gap-2 pl-3 border-l border-slate-200">
              <div className="w-8 h-8 rounded-xl bg-blue-600 flex items-center justify-center">
                {isAuthenticated ? (
                  <span className="text-white text-xs font-bold">{user?.avatar || 'U'}</span>
                ) : (
                  <User size={14} className="text-white" />
                )}
              </div>
              <div className="hidden sm:block">
                {/* useContext user data rendered here */}
                <p className="text-xs font-semibold text-slate-700">{displayName}</p>
                <p className="text-xs text-slate-400 capitalize">{displayRole}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Not logged in — show prompt */}
        {!isAuthenticated && (
          <div className="m-6 p-5 bg-amber-50 border border-amber-200 rounded-2xl flex items-start gap-4">
            <div className="p-2.5 bg-amber-100 rounded-xl">
              <LogIn size={20} className="text-amber-600" />
            </div>
            <div className="flex-1">
              <p className="font-semibold text-amber-800">You are not logged in</p>
              <p className="text-sm text-amber-600 mt-0.5">
                Log in to see your personalized dashboard.{' '}
                <Link to="/login" className="font-bold underline hover:text-amber-800">Sign in now →</Link>
              </p>
            </div>
          </div>
        )}

        {/* Logged-in context banner */}
        {isAuthenticated && (
          <div className="mx-6 mt-5 p-4 bg-blue-50 border border-blue-100 rounded-2xl">
            <p className="text-xs font-bold text-blue-600 uppercase tracking-wider mb-1">
              Experiment 2 — useContext in action
            </p>
            <p className="text-sm text-slate-700">
              Logged in as: <strong>{user.name}</strong> &nbsp;·&nbsp;
              Role: <strong className="capitalize">{user.role.replace('_', ' ')}</strong> &nbsp;·&nbsp;
              ID: <code className="text-blue-600">{user.id}</code>
            </p>
          </div>
        )}

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <DashboardCard key={s.title} {...s} />
            ))}
          </div>

          {/* Active rental card */}
          {activeBooking && activeVehicle && (
            <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-2xl p-5 text-white">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div className="flex items-start gap-4">
                  <img
                    src={activeVehicle.image}
                    alt={activeVehicle.name}
                    className="w-20 h-14 object-cover rounded-xl"
                    onError={(e) => { e.target.src = 'https://placehold.co/80x56/1d4ed8/fff?text=Car'; }}
                  />
                  <div>
                    <p className="text-blue-200 text-xs font-semibold mb-0.5">Currently Active Rental</p>
                    <h3 className="font-bold text-lg">{activeVehicle.name}</h3>
                    <p className="text-blue-200 text-sm">{activeVehicle.type} · {activeVehicle.transmission}</p>
                  </div>
                </div>
                <div className="flex flex-col sm:items-end gap-2">
                  <StatusBadge status="Active" />
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <Calendar size={14} />
                    <span>Until {new Date(activeBooking.returnDate).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-2 text-blue-100 text-sm">
                    <MapPin size={14} />
                    <span className="truncate max-w-40">{activeBooking.pickupLocation}</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Recent bookings */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100">
              <h2 className="font-bold text-slate-800">Recent Bookings</h2>
              <button className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5">
                View all <ChevronRight size={14} />
              </button>
            </div>

            {/* Desktop table */}
            <div className="hidden sm:block overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50">
                  <tr>
                    {['Booking ID', 'Vehicle', 'Pickup', 'Return', 'Amount', 'Status', 'Actions'].map((h) => (
                      <th key={h} className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {customerBookings.map((b) => (
                    <tr key={b.id} className="hover:bg-slate-50 transition-colors">
                      <td className="px-5 py-3.5 font-mono text-xs text-blue-600 font-semibold">{b.id}</td>
                      <td className="px-5 py-3.5 font-medium text-slate-700">{b.vehicleName}</td>
                      <td className="px-5 py-3.5 text-slate-500">{b.pickupDate}</td>
                      <td className="px-5 py-3.5 text-slate-500">{b.returnDate}</td>
                      <td className="px-5 py-3.5 font-semibold text-slate-700">₹{b.totalAmount.toLocaleString()}</td>
                      <td className="px-5 py-3.5"><StatusBadge status={b.status} /></td>
                      <td className="px-5 py-3.5">
                        {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                          <button
                            id={`cancel-booking-${b.id}`}
                            onClick={() => {
                              if (window.confirm(`Are you sure you want to cancel booking ${b.id}?`)) {
                                cancelBooking(b.id);
                              }
                            }}
                            className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
                          >
                            Cancel
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="sm:hidden divide-y divide-slate-100">
              {customerBookings.map((b) => (
                <div key={b.id} className="p-4">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <p className="font-semibold text-slate-800 text-sm">{b.vehicleName}</p>
                      <p className="text-xs text-slate-400 font-mono">{b.id}</p>
                    </div>
                    <StatusBadge status={b.status} />
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>{b.pickupDate} → {b.returnDate}</span>
                    <span className="font-semibold text-slate-700">₹{b.totalAmount.toLocaleString()}</span>
                  </div>
                  {b.status !== 'Cancelled' && b.status !== 'Completed' && (
                    <div className="mt-2 text-right">
                      <button
                        onClick={() => {
                          if (window.confirm(`Are you sure you want to cancel booking ${b.id}?`)) {
                            cancelBooking(b.id);
                          }
                        }}
                        className="text-xs font-semibold text-red-600 hover:text-red-700 hover:underline transition-colors"
                      >
                        Cancel Booking
                      </button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
