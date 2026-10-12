// AdminDashboard.jsx — Administrative Control Center
// Features:
//   - Role-protected for Admin users only
//   - System Overview metrics (Registered Users, Fleet Size, Active Bookings, System Health)
//   - Registered User Management (live from GET /api/auth/users)
//   - Role breakdown and filtering (Customer, Fleet Manager, Admin)
//   - Live WebSocket connectivity status
//   - Direct links to Fleet Operations and Catalogue

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import DashboardCard from '../components/DashboardCard';
import UserMenu from '../components/UserMenu';
import NotificationCenter from '../components/NotificationCenter';
import { useAuth } from '../hooks/useAuth';
import { useVehicles } from '../hooks/useVehicles';
import { useBookings } from '../hooks/useBookings';
import { useSocket } from '../hooks/useSocket';
import { getUsers } from '../services/api';
import {
  Users, Car, Calendar, Shield, Search,
  CheckCircle, ArrowUpRight, RefreshCw, Mail, Phone, Clock
} from 'lucide-react';

export default function AdminDashboard() {
  const { user } = useAuth();
  const { vehicles } = useVehicles();
  const { bookings } = useBookings();
  const { isConnected } = useSocket();

  const [usersList, setUsersList] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);
  const [userError, setUserError] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState('all');

  useEffect(() => {
    document.title = 'DriveFleet | Admin Dashboard';
    return () => {
      document.title = 'DriveFleet';
    };
  }, []);

  const loadUsers = async () => {
    setLoadingUsers(true);
    setUserError('');
    try {
      const data = await getUsers();
      setUsersList(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load registered users:', err);
      setUserError(err.message || 'Failed to fetch registered users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered user list
  const filteredUsers = usersList.filter((u) => {
    const matchesSearch =
      !searchQuery ||
      u.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      u.phone?.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesRole =
      roleFilter === 'all' ||
      u.role === roleFilter ||
      (roleFilter === 'fleet_manager' && (u.role === 'fleet_manager' || u.role === 'manager'));

    return matchesSearch && matchesRole;
  });

  const customerCount = usersList.filter((u) => u.role === 'customer').length;
  const managerCount = usersList.filter((u) => u.role === 'fleet_manager' || u.role === 'manager').length;
  const adminCount = usersList.filter((u) => u.role === 'admin').length;

  const stats = [
    {
      title: 'Total Registered Users',
      value: usersList.length,
      icon: Users,
      color: 'blue',
      subtitle: `${customerCount} Customers · ${managerCount} Managers · ${adminCount} Admins`,
    },
    {
      title: 'Total Fleet Size',
      value: vehicles.length,
      icon: Car,
      color: 'emerald',
      subtitle: `${vehicles.filter((v) => v.status === 'Available').length} Available Vehicles`,
    },
    {
      title: 'Active Bookings',
      value: bookings.filter((b) => b.status === 'Active' || b.status === 'Confirmed').length,
      icon: Calendar,
      color: 'indigo',
      subtitle: `${bookings.length} Total Bookings Recorded`,
    },
    {
      title: 'System Authorization',
      value: 'RBAC Active',
      icon: Shield,
      color: 'purple',
      subtitle: 'Backend JWT & Route Guard Enabled',
    },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      <Sidebar />

      <div className="flex-1 overflow-y-auto">
        {/* Top Header */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-xs">
          <div>
            <div className="flex items-center gap-2.5">
              <span className="p-1.5 bg-purple-600 rounded-lg text-white">
                <Shield size={18} />
              </span>
              <h1 className="text-xl font-bold text-slate-800">Admin Control Center</h1>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Welcome back, <strong className="text-purple-700">{user?.name || 'Administrator'}</strong>. Full administrative permissions active.
            </p>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time WebSocket connection indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white shadow-xs">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'}`} />
              <span className="text-slate-600 font-semibold hidden md:inline">
                {isConnected ? 'Real-Time Connected' : 'Disconnected'}
              </span>
            </div>

            <NotificationCenter />

            <div className="pl-3 border-l border-slate-200">
              <UserMenu align="right" />
            </div>
          </div>
        </header>

        {/* Security / System Banner */}
        <div className="mx-6 mt-5 p-4 bg-gradient-to-r from-purple-900 to-indigo-900 text-white rounded-2xl shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded-md bg-purple-500/30 text-purple-200 text-xs font-bold uppercase tracking-wider">
                System Mode: Development Secured
              </span>
              <span className="text-xs text-purple-200">· DriveFleet RBAC v2.0</span>
            </div>
            <h2 className="text-lg font-bold mt-1 text-white">Administrative Fleet & User Governance</h2>
            <p className="text-xs text-purple-200 max-w-2xl mt-0.5">
              You have access to privileged endpoints. Role authorization is strictly verified server-side on all data mutation and user enumeration APIs.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/fleet-dashboard"
              className="px-3.5 py-2 bg-white/10 hover:bg-white/20 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 backdrop-blur shrink-0"
            >
              <span>Fleet Operations</span>
              <ArrowUpRight size={14} />
            </Link>
            <Link
              to="/maintenance"
              className="px-3.5 py-2 bg-purple-500 hover:bg-purple-400 text-white text-xs font-semibold rounded-xl transition-all flex items-center gap-1.5 shadow-sm shrink-0"
            >
              <span>Maintenance Hub</span>
              <ArrowUpRight size={14} />
            </Link>
          </div>
        </div>

        <div className="p-6 space-y-6 max-w-7xl mx-auto">
          {/* System Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((s) => (
              <DashboardCard key={s.title} {...s} />
            ))}
          </div>

          {/* User Management Section */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="text-lg font-bold text-slate-800">User Management & Permissions</h2>
                  <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-50 text-purple-700 border border-purple-200">
                    {filteredUsers.length} of {usersList.length} Accounts
                  </span>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  Enforces server-verified roles. Customer, Fleet Manager, and Admin account directories from MongoDB Atlas.
                </p>
              </div>

              {/* Search & Filter Controls */}
              <div className="flex flex-wrap items-center gap-2.5">
                <div className="relative">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search name or email..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9 pr-3 py-1.5 text-xs border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-purple-500 bg-slate-50 w-56"
                  />
                </div>

                <div className="flex rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-xs font-medium">
                  {['all', 'customer', 'fleet_manager', 'admin'].map((role) => (
                    <button
                      key={role}
                      onClick={() => setRoleFilter(role)}
                      className={`px-3 py-1 rounded-lg capitalize transition-all ${
                        roleFilter === role
                          ? 'bg-purple-600 text-white font-semibold shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {role.replace('_', ' ')}
                    </button>
                  ))}
                </div>

                <button
                  onClick={loadUsers}
                  disabled={loadingUsers}
                  title="Refresh users list"
                  className="p-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-slate-600 transition-colors disabled:opacity-50"
                >
                  <RefreshCw size={14} className={loadingUsers ? 'animate-spin' : ''} />
                </button>
              </div>
            </div>

            {/* Error state */}
            {userError && (
              <div className="m-6 p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-600">
                {userError}
              </div>
            )}

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 uppercase tracking-wider border-b border-slate-200 font-semibold">
                    <th className="py-3.5 px-6">User / Account</th>
                    <th className="py-3.5 px-6">Role</th>
                    <th className="py-3.5 px-6">Contact</th>
                    <th className="py-3.5 px-6">Joined Date</th>
                    <th className="py-3.5 px-6">Access Level</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {loadingUsers ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        <div className="flex flex-col items-center justify-center gap-2">
                          <RefreshCw size={20} className="animate-spin text-purple-600" />
                          <p className="text-xs font-medium">Loading user directory...</p>
                        </div>
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-12 text-center text-slate-400">
                        No registered users found matching the current filter.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isCurrentUser = user && (user.id === u._id || user.id === u.id || user.email === u.email);
                      const role = u.role || 'customer';

                      const roleBadgeStyles = {
                        admin: 'bg-purple-100 text-purple-800 border-purple-200',
                        fleet_manager: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        manager: 'bg-emerald-100 text-emerald-800 border-emerald-200',
                        customer: 'bg-blue-100 text-blue-800 border-blue-200',
                      };

                      const badgeCls = roleBadgeStyles[role] || 'bg-slate-100 text-slate-800 border-slate-200';

                      return (
                        <tr key={u._id || u.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3.5 px-6">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-xl bg-slate-200 text-slate-700 flex items-center justify-center font-bold text-xs uppercase shrink-0">
                                {u.name ? u.name.substring(0, 2).toUpperCase() : 'U'}
                              </div>
                              <div>
                                <p className="font-semibold text-slate-800 flex items-center gap-2">
                                  {u.name}
                                  {isCurrentUser && (
                                    <span className="text-[10px] font-bold px-1.5 py-0.2 bg-purple-50 text-purple-700 rounded border border-purple-200">
                                      YOU
                                    </span>
                                  )}
                                </p>
                                <p className="text-slate-400 text-[11px] flex items-center gap-1">
                                  <Mail size={11} />
                                  {u.email}
                                </p>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-6">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full font-semibold capitalize border text-[11px] ${badgeCls}`}>
                              <span className="w-1.5 h-1.5 rounded-full bg-current" />
                              {role.replace('_', ' ')}
                            </span>
                          </td>

                          <td className="py-3.5 px-6 text-slate-600">
                            {u.phone ? (
                              <span className="flex items-center gap-1.5">
                                <Phone size={12} className="text-slate-400" />
                                {u.phone}
                              </span>
                            ) : (
                              <span className="text-slate-400 italic">No phone provided</span>
                            )}
                          </td>

                          <td className="py-3.5 px-6 text-slate-500">
                            <span className="flex items-center gap-1.5">
                              <Clock size={12} className="text-slate-400" />
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </span>
                          </td>

                          <td className="py-3.5 px-6">
                            {role === 'admin' ? (
                              <span className="text-purple-700 font-semibold flex items-center gap-1">
                                <CheckCircle size={13} /> Full System Control
                              </span>
                            ) : role === 'fleet_manager' || role === 'manager' ? (
                              <span className="text-emerald-700 font-semibold flex items-center gap-1">
                                <CheckCircle size={13} /> Fleet Management
                              </span>
                            ) : (
                              <span className="text-blue-700 font-semibold flex items-center gap-1">
                                <CheckCircle size={13} /> Rental & Bookings
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
