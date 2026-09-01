// Sidebar.jsx — RBAC: filters nav links by user.role from AuthContext
import { useState } from 'react';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Car, Calendar, Wrench, Settings, LogOut,
  ChevronRight, Menu, X, Car as CarIcon,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

// Master link list — each entry declares which roles may see it
const ALL_LINKS = [
  { to: '/dashboard',       icon: LayoutDashboard, label: 'Dashboard',     roles: ['customer', 'fleet_manager', 'admin'] },
  { to: '/vehicles',        icon: Car,             label: 'Vehicles',      roles: ['customer', 'fleet_manager', 'admin'] },
  { to: '/booking',         icon: Calendar,        label: 'Book Vehicle',  roles: ['customer', 'admin'] },
  { to: '/maintenance',     icon: Wrench,          label: 'Maintenance',   roles: ['fleet_manager', 'admin'] },
  { to: '/fleet-dashboard', icon: Settings,        label: 'Fleet Manager', roles: ['fleet_manager', 'admin'] },
];

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const navigate = useNavigate();

  // useAuth — Custom Hook — access logout, user info, and role for RBAC
  const { logout, user, isAuthenticated } = useAuth();

  // Derive visible links based on the authenticated user's role
  const visibleLinks = isAuthenticated && user
    ? ALL_LINKS.filter((link) => link.roles.includes(user.role))
    : [];

  // Human-readable role label for the badge
  const roleLabel = user?.role ? user.role.replace(/_/g, ' ') : 'Guest';

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className={`flex items-center gap-3 px-4 py-5 border-b border-slate-700 ${collapsed ? 'justify-center' : ''}`}>
        <div className="p-2 bg-blue-600 rounded-lg shrink-0">
          <CarIcon size={18} className="text-white" />
        </div>
        {!collapsed && (
          <span className="text-lg font-bold text-white">
            Drive<span className="text-blue-400">Fleet</span>
          </span>
        )}
      </div>

      {/* Role badge + user info */}
      {!collapsed && (
        <div className="px-4 pt-4 pb-2">
          <span className="text-xs font-semibold bg-blue-600/30 text-blue-300 px-2.5 py-1 rounded-full uppercase tracking-wider capitalize">
            {roleLabel}
          </span>
          {/* Show logged-in user name from context */}
          {isAuthenticated && user && (
            <p className="text-xs text-slate-400 mt-2 truncate">
              <span className="text-slate-300 font-medium">{user.name}</span>
            </p>
          )}
        </div>
      )}

      {/* Nav links */}
      <nav className="flex-1 px-2 py-3 space-y-1 overflow-y-auto">
        {visibleLinks.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                isActive
                  ? 'bg-blue-600 text-white'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              } ${collapsed ? 'justify-center' : ''}`
            }
            title={collapsed ? label : undefined}
          >
            <Icon size={18} className="shrink-0" />
            {!collapsed && label}
          </NavLink>
        ))}
      </nav>

      {/* Footer — Logout button wired to useAuth logout() */}
      <div className="border-t border-slate-700 p-3">
        <button
          id="sidebar-logout-btn"
          onClick={handleLogout}
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-red-400 transition-all ${collapsed ? 'justify-center' : ''}`}
        >
          <LogOut size={18} className="shrink-0" />
          {!collapsed && 'Logout'}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle button */}
      <button
        id="sidebar-mobile-toggle"
        onClick={() => setMobileOpen(!mobileOpen)}
        className="lg:hidden fixed top-20 left-4 z-50 p-2 bg-slate-800 text-white rounded-lg shadow-lg"
      >
        {mobileOpen ? <X size={20} /> : <Menu size={20} />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div
          className="lg:hidden fixed inset-0 z-40 bg-black/50"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile sidebar */}
      <aside
        className={`lg:hidden fixed left-0 top-0 bottom-0 z-50 w-64 bg-slate-800 transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <SidebarContent />
      </aside>

      {/* Desktop sidebar */}
      <aside
        className={`hidden lg:flex flex-col bg-slate-800 transition-all duration-300 ${
          collapsed ? 'w-16' : 'w-64'
        }`}
      >
        <SidebarContent />
        {/* Collapse toggle */}
        <button
          id="sidebar-collapse-btn"
          onClick={() => setCollapsed(!collapsed)}
          className="absolute bottom-20 -right-3 w-6 h-6 bg-slate-700 border border-slate-600 rounded-full flex items-center justify-center text-slate-300 hover:bg-slate-600 transition-colors"
        >
          <ChevronRight size={12} className={`transition-transform ${collapsed ? '' : 'rotate-180'}`} />
        </button>
      </aside>
    </>
  );
}
