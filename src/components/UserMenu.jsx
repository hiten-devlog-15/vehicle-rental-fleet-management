// src/components/UserMenu.jsx — Functional Profile Dropdown Menu for All Supported Roles
import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  LogOut,
  ChevronDown,
  Shield,
  Wrench,
  LayoutDashboard,
  Calendar,
  CheckCircle2,
} from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

export default function UserMenu({ align = 'right' }) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef(null);
  const navigate = useNavigate();
  const { user, isAuthenticated, logout } = useAuth();

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }

    function handleKeyDown(event) {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  if (!isAuthenticated || !user) {
    return null;
  }

  const handleLogout = () => {
    setIsOpen(false);
    logout();
    navigate('/login');
  };

  const getRoleConfig = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          badgeClass: 'bg-purple-100 text-purple-700 border border-purple-200',
          avatarBg: 'bg-purple-600',
          roleIcon: Shield,
        };
      case 'fleet_manager':
      case 'manager':
        return {
          label: 'Fleet Manager',
          badgeClass: 'bg-emerald-100 text-emerald-700 border border-emerald-200',
          avatarBg: 'bg-emerald-600',
          roleIcon: Wrench,
        };
      case 'customer':
      default:
        return {
          label: 'Customer',
          badgeClass: 'bg-blue-100 text-blue-700 border border-blue-200',
          avatarBg: 'bg-blue-600',
          roleIcon: Calendar,
        };
    }
  };

  const roleConfig = getRoleConfig(user.role);
  const RoleIcon = roleConfig.roleIcon;

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      {/* Profile Trigger Button */}
      <button
        id="user-profile-menu-btn"
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className="flex items-center gap-2.5 p-1.5 sm:px-3 sm:py-1.5 rounded-xl transition-all duration-150 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer text-left group"
        aria-expanded={isOpen}
        aria-haspopup="true"
        title="View Profile and Account Options"
      >
        {/* Avatar badge */}
        <div
          className={`w-8 h-8 rounded-xl ${roleConfig.avatarBg} text-white flex items-center justify-center font-bold text-xs shadow-xs transition-transform duration-150 group-hover:scale-105`}
        >
          {user.avatar || 'DF'}
        </div>

        {/* User name & role (visible on larger screens) */}
        <div className="hidden sm:block text-left">
          <p className="text-xs font-semibold text-slate-800 max-w-[130px] truncate">
            {user.name}
          </p>
          <p className="text-[11px] text-slate-500 font-medium capitalize">
            {roleConfig.label}
          </p>
        </div>

        <ChevronDown
          size={14}
          className={`text-slate-400 transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-blue-600' : 'group-hover:text-slate-600'
          }`}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          id="user-profile-dropdown"
          className={`absolute ${
            align === 'left' ? 'left-0' : 'right-0'
          } mt-2 w-72 origin-top-${align} rounded-2xl bg-white shadow-xl border border-slate-200 divide-y divide-slate-100 z-50 animate-in fade-in zoom-in-95 duration-150`}
          role="menu"
          aria-orientation="vertical"
        >
          {/* User Info Header */}
          <div className="p-4 bg-slate-50/70 rounded-t-2xl">
            <div className="flex items-start gap-3">
              <div
                className={`w-11 h-11 rounded-xl ${roleConfig.avatarBg} text-white flex items-center justify-center font-bold text-base shadow-sm shrink-0`}
              >
                {user.avatar || 'DF'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-bold text-slate-800 truncate leading-tight">
                  {user.name}
                </p>
                <p className="text-xs text-slate-500 truncate mt-0.5" title={user.email}>
                  {user.email}
                </p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span
                    className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md uppercase tracking-wider ${roleConfig.badgeClass}`}
                  >
                    <RoleIcon size={11} />
                    {roleConfig.label}
                  </span>
                  <span className="inline-flex items-center text-[10px] text-emerald-600 font-semibold gap-0.5">
                    <CheckCircle2 size={10} /> Active
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Primary Profile Action */}
          <div className="p-1.5">
            <Link
              to="/profile"
              id="menu-item-profile"
              onClick={() => setIsOpen(false)}
              className="flex items-center gap-2.5 px-3 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50/80 rounded-xl transition-colors w-full"
              role="menuitem"
            >
              <div className="p-1.5 bg-blue-100 text-blue-600 rounded-lg">
                <User size={15} />
              </div>
              <div className="flex-1 text-left">
                <p className="text-xs font-bold leading-tight">My Profile</p>
                <p className="text-[11px] text-slate-400 font-normal leading-tight">
                  Personal info & account security
                </p>
              </div>
            </Link>
          </div>

          {/* Role-Specific Quick Shortcuts */}
          <div className="p-1.5 space-y-0.5">
            {user.role === 'customer' && (
              <Link
                to="/dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                role="menuitem"
              >
                <LayoutDashboard size={15} className="text-slate-400" />
                Customer Dashboard & Bookings
              </Link>
            )}

            {(user.role === 'fleet_manager' || user.role === 'manager') && (
              <>
                <Link
                  to="/dashboard"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  role="menuitem"
                >
                  <LayoutDashboard size={15} className="text-slate-400" />
                  Fleet Dashboard
                </Link>
                <Link
                  to="/maintenance"
                  onClick={() => setIsOpen(false)}
                  className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                  role="menuitem"
                >
                  <Wrench size={15} className="text-slate-400" />
                  Vehicle Maintenance
                </Link>
              </>
            )}

            {user.role === 'admin' && (
              <Link
                to="/admin-dashboard"
                onClick={() => setIsOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-xl transition-colors"
                role="menuitem"
              >
                <Shield size={15} className="text-purple-500" />
                Admin Control Center
              </Link>
            )}
          </div>

          {/* Sign Out Action */}
          <div className="p-1.5">
            <button
              id="menu-item-logout"
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-2.5 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 rounded-xl transition-colors w-full text-left cursor-pointer"
              role="menuitem"
            >
              <LogOut size={15} />
              Sign Out
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
