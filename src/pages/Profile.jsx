// src/pages/Profile.jsx — Profile & Account Settings for All Supported Roles
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Sidebar from '../components/Sidebar';
import UserMenu from '../components/UserMenu';
import NotificationCenter from '../components/NotificationCenter';
import Button from '../components/Button';
import { useAuth } from '../hooks/useAuth';
import { useBookings } from '../hooks/useBookings';
import { useVehicles } from '../hooks/useVehicles';
import { useSocket } from '../hooks/useSocket';
import {
  User,
  Mail,
  Phone,
  Shield,
  Lock,
  KeyRound,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
  Save,
  RotateCcw,
  Calendar,
  Car,
  Wrench,
  LayoutDashboard,
  LogOut,
  Sparkles,
} from 'lucide-react';

// Preset avatar options (zero paid dependencies, lightweight and fun)
const AVATAR_PRESETS = [
  { id: 'initials', label: 'Initials', icon: null },
  { id: '🚗', label: 'Car', icon: '🚗' },
  { id: '🏎️', label: 'Speed', icon: '🏎️' },
  { id: '⚡', label: 'Electric', icon: '⚡' },
  { id: '🛡️', label: 'Shield', icon: '🛡️' },
  { id: '👤', label: 'Driver', icon: '👤' },
  { id: '🚀', label: 'Rocket', icon: '🚀' },
  { id: '💼', label: 'Executive', icon: '💼' },
  { id: '🌟', label: 'Star', icon: '🌟' },
];

export default function Profile() {
  const { user, updateUserProfile, updatePassword, logout } = useAuth();
  const { bookings } = useBookings();
  const { vehicles } = useVehicles();
  const { isConnected } = useSocket();
  const navigate = useNavigate();

  // Document title
  useEffect(() => {
    document.title = 'DriveFleet | Profile & Account Settings';
    return () => {
      document.title = 'DriveFleet';
    };
  }, []);

  // ── Profile Edit State ────────────────────────────────────────────────────────
  const [profileForm, setProfileForm] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    avatar: user?.avatar || '',
  });
  const [profileErrors, setProfileErrors] = useState({});
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');
  const [profileError, setProfileError] = useState('');

  // Keep form in sync when user context updates
  useEffect(() => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
  }, [user]);

  // ── Password Change State ─────────────────────────────────────────────────────
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState({});
  const [showCurrentPass, setShowCurrentPass] = useState(false);
  const [showNewPass, setShowNewPass] = useState(false);
  const [showConfirmPass, setShowConfirmPass] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState('');
  const [passwordError, setPasswordError] = useState('');

  // ── Role Configuration ────────────────────────────────────────────────────────
  const getRoleBadge = (role) => {
    switch (role) {
      case 'admin':
        return {
          label: 'Administrator',
          theme: 'bg-purple-100 text-purple-700 border-purple-200',
          dot: 'bg-purple-500',
          icon: Shield,
          dashboardUrl: '/admin-dashboard',
          dashboardLabel: 'Admin Control Center',
        };
      case 'fleet_manager':
      case 'manager':
        return {
          label: 'Fleet Manager',
          theme: 'bg-emerald-100 text-emerald-700 border-emerald-200',
          dot: 'bg-emerald-500',
          icon: Wrench,
          dashboardUrl: '/dashboard',
          dashboardLabel: 'Fleet Dashboard',
        };
      case 'customer':
      default:
        return {
          label: 'Customer',
          theme: 'bg-blue-100 text-blue-700 border-blue-200',
          dot: 'bg-blue-500',
          icon: Calendar,
          dashboardUrl: '/dashboard',
          dashboardLabel: 'Customer Dashboard',
        };
    }
  };

  const roleMeta = getRoleBadge(user?.role);
  const RoleIcon = roleMeta.icon;

  // Formatted registration date
  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString('en-US', {
        month: 'long',
        year: 'numeric',
      })
    : 'Active Member';

  // ── Handle Profile Update ─────────────────────────────────────────────────────
  const validateProfile = () => {
    const errs = {};
    if (!profileForm.name.trim()) {
      errs.name = 'Full name is required.';
    } else if (profileForm.name.trim().length < 2) {
      errs.name = 'Name must be at least 2 characters.';
    } else if (profileForm.name.trim().length > 100) {
      errs.name = 'Name cannot exceed 100 characters.';
    }

    if (profileForm.phone && profileForm.phone.trim().length > 20) {
      errs.phone = 'Phone number cannot exceed 20 characters.';
    }

    return errs;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setProfileSuccess('');
    setProfileError('');
    const errs = validateProfile();
    if (Object.keys(errs).length > 0) {
      setProfileErrors(errs);
      return;
    }
    setProfileErrors({});
    setProfileSaving(true);

    const result = await updateUserProfile({
      name: profileForm.name.trim(),
      phone: profileForm.phone.trim(),
      avatar: profileForm.avatar,
    });

    setProfileSaving(false);
    if (result.success) {
      setProfileSuccess('Personal details updated successfully!');
      setTimeout(() => setProfileSuccess(''), 4000);
    } else {
      setProfileError(result.error || 'Failed to update personal details.');
    }
  };

  const handleCancelProfile = () => {
    if (user) {
      setProfileForm({
        name: user.name || '',
        phone: user.phone || '',
        avatar: user.avatar || '',
      });
    }
    setProfileErrors({});
    setProfileError('');
    setProfileSuccess('');
  };

  // ── Handle Password Update ────────────────────────────────────────────────────
  const validatePassword = () => {
    const errs = {};
    if (!passwordForm.currentPassword) {
      errs.currentPassword = 'Enter your current password.';
    }
    if (!passwordForm.newPassword) {
      errs.newPassword = 'Enter a new password.';
    } else if (passwordForm.newPassword.length < 8) {
      errs.newPassword = 'New password must be at least 8 characters.';
    }
    if (!passwordForm.confirmPassword) {
      errs.confirmPassword = 'Confirm your new password.';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
    }
    return errs;
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordSuccess('');
    setPasswordError('');
    const errs = validatePassword();
    if (Object.keys(errs).length > 0) {
      setPasswordErrors(errs);
      return;
    }
    setPasswordErrors({});
    setPasswordSaving(true);

    const result = await updatePassword({
      currentPassword: passwordForm.currentPassword,
      newPassword: passwordForm.newPassword,
    });

    setPasswordSaving(false);
    if (result.success) {
      setPasswordSuccess('Password changed successfully! Keep it safe.');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
      });
      setTimeout(() => setPasswordSuccess(''), 5000);
    } else {
      setPasswordError(result.error || 'Failed to change password.');
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  // Compute customer stats
  const customerBookingsCount = bookings.filter(
    (b) =>
      b.customerId === user?.id ||
      (user?.email && b.customerEmail && b.customerEmail.toLowerCase() === user.email.toLowerCase())
  ).length;

  return (
    <div className="flex h-screen overflow-hidden bg-slate-100">
      {/* Sidebar navigation */}
      <Sidebar />

      {/* Main content scroll container */}
      <div className="flex-1 overflow-y-auto">
        {/* Top Header Bar */}
        <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between sticky top-0 z-30 shadow-2xs">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 mb-0.5">
              <Link to="/dashboard" className="hover:text-blue-600 transition-colors">
                Dashboard
              </Link>
              <span>/</span>
              <span className="text-slate-800 font-semibold">Account Profile</span>
            </div>
            <h1 className="text-xl font-bold text-slate-800">Profile & Settings</h1>
          </div>

          <div className="flex items-center gap-3">
            {/* Real-time WebSocket connection indicator */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border border-slate-200 bg-white shadow-2xs">
              <span
                className={`w-2 h-2 rounded-full ${
                  isConnected ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
                }`}
              />
              <span className="text-slate-600 font-semibold hidden md:inline">
                {isConnected ? 'Real-Time Connected' : 'Disconnected'}
              </span>
            </div>

            <NotificationCenter />

            {/* Profile Dropdown */}
            <div className="pl-3 border-l border-slate-200">
              <UserMenu align="right" />
            </div>
          </div>
        </header>

        {/* Content Body */}
        <div className="max-w-5xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
          {/* ── 1. Hero Overview Card ─────────────────────────────────────────── */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br from-blue-500/5 to-purple-500/5 rounded-full blur-3xl pointer-events-none" />

            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 relative z-10">
              <div className="flex items-start sm:items-center gap-4">
                {/* Large Avatar */}
                <div className="relative group">
                  <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center font-bold text-2xl shadow-md border-2 border-white">
                    {profileForm.avatar || user?.avatar || 'DF'}
                  </div>
                  <div className="absolute -bottom-1 -right-1 bg-white p-1 rounded-full shadow-xs border border-slate-200 text-emerald-600" title="Account active">
                    <CheckCircle2 size={16} />
                  </div>
                </div>

                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <h2 className="text-xl sm:text-2xl font-bold text-slate-800">
                      {user?.name}
                    </h2>
                    <span
                      className={`inline-flex items-center gap-1.5 text-xs font-bold px-2.5 py-0.5 rounded-full border ${roleMeta.theme}`}
                    >
                      <RoleIcon size={12} />
                      {roleMeta.label}
                    </span>
                  </div>

                  <p className="text-sm text-slate-500 mt-0.5 flex items-center gap-1.5">
                    <Mail size={14} className="text-slate-400" />
                    {user?.email}
                  </p>

                  <div className="flex items-center gap-4 mt-3 text-xs text-slate-500 flex-wrap">
                    <span className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      Status: <strong className="text-emerald-700">Active</strong>
                    </span>
                    <span>·</span>
                    <span>Member since: <strong className="text-slate-700">{memberSince}</strong></span>
                    <span>·</span>
                    <span className="text-slate-500">
                      Security: <strong className="text-slate-700">JWT Protected</strong>
                    </span>
                  </div>
                </div>
              </div>

              {/* Quick Navigation Action */}
              <div className="flex items-center gap-2">
                <Link
                  to={roleMeta.dashboardUrl}
                  className="px-4 py-2 text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition-colors flex items-center gap-1.5"
                >
                  <LayoutDashboard size={14} />
                  {roleMeta.dashboardLabel}
                </Link>
                <button
                  id="profile-logout-btn"
                  onClick={handleLogout}
                  className="px-4 py-2 text-xs font-semibold text-red-600 hover:bg-red-50 border border-red-200 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                  title="Sign out of DriveFleet"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            </div>

            {/* Avatar Selector Strip */}
            <div className="mt-6 pt-5 border-t border-slate-100">
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                  <Sparkles size={14} className="text-blue-600" />
                  Choose Profile Avatar Style:
                </label>
                <span className="text-[11px] text-slate-400">
                  Select a preset emoji icon or use your name initials
                </span>
              </div>
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {AVATAR_PRESETS.map((preset) => {
                  const isSelected =
                    preset.id === 'initials'
                      ? !profileForm.avatar
                      : profileForm.avatar === preset.id;
                  return (
                    <button
                      key={preset.id}
                      type="button"
                      onClick={() =>
                        setProfileForm((prev) => ({
                          ...prev,
                          avatar: preset.id === 'initials' ? '' : preset.id,
                        }))
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium flex items-center gap-1.5 transition-all cursor-pointer border ${
                        isSelected
                          ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {preset.icon && <span>{preset.icon}</span>}
                      <span>{preset.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* ── 2. Personal Information Form (2 Columns) ────────────────────── */}
            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <User size={18} className="text-blue-600" />
                      Personal Information
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Update your personal and contact details across DriveFleet
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                {profileSuccess && (
                  <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{profileSuccess}</span>
                  </div>
                )}
                {profileError && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-semibold">
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                    <span>{profileError}</span>
                  </div>
                )}

                <form onSubmit={handleProfileSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Full Name */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Full Name <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <User size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          id="profile-name-input"
                          type="text"
                          value={profileForm.name}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, name: e.target.value })
                          }
                          placeholder="Your full name"
                          className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                            profileErrors.name ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                      </div>
                      {profileErrors.name && (
                        <p className="text-xs text-red-600 mt-1">{profileErrors.name}</p>
                      )}
                    </div>

                    {/* Phone Number */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Phone Number
                      </label>
                      <div className="relative">
                        <Phone size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          id="profile-phone-input"
                          type="text"
                          value={profileForm.phone}
                          onChange={(e) =>
                            setProfileForm({ ...profileForm, phone: e.target.value })
                          }
                          placeholder="+91 98765 43210"
                          className={`w-full pl-10 pr-3.5 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                            profileErrors.phone ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                      </div>
                      {profileErrors.phone && (
                        <p className="text-xs text-red-600 mt-1">{profileErrors.phone}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                    {/* Email (Read-only) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Email Address
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                          <Lock size={10} /> Read-only
                        </span>
                      </div>
                      <div className="relative">
                        <Mail size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="email"
                          value={user?.email || ''}
                          disabled
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed select-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Tied to your account login. Contact support to update email.
                      </p>
                    </div>

                    {/* Role (Read-only) */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">
                          Account Role
                        </label>
                        <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                          <Lock size={10} /> Server Verified
                        </span>
                      </div>
                      <div className="relative">
                        <Shield size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          type="text"
                          value={roleMeta.label}
                          disabled
                          className="w-full pl-10 pr-3.5 py-2.5 text-sm border border-slate-200 rounded-xl bg-slate-100 text-slate-500 cursor-not-allowed capitalize font-semibold select-none"
                        />
                      </div>
                      <p className="text-[11px] text-slate-400 mt-1">
                        Role permissions are enforced strictly by backend authorization.
                      </p>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end gap-3 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={handleCancelProfile}
                      disabled={profileSaving}
                      className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5 cursor-pointer"
                    >
                      <RotateCcw size={14} />
                      Cancel
                    </button>
                    <Button
                      id="save-profile-btn"
                      type="submit"
                      disabled={profileSaving}
                      icon={Save}
                      size="sm"
                    >
                      {profileSaving ? 'Saving Changes...' : 'Save Profile Changes'}
                    </Button>
                  </div>
                </form>
              </div>

              {/* ── 3. Password Security Form ─────────────────────────────────── */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center justify-between pb-4 border-b border-slate-100 mb-6">
                  <div>
                    <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
                      <KeyRound size={18} className="text-amber-600" />
                      Account Security & Password
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Ensure your account uses a strong password with at least 8 characters
                    </p>
                  </div>
                </div>

                {/* Notifications */}
                {passwordSuccess && (
                  <div className="mb-5 p-3.5 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center gap-2 text-emerald-800 text-xs font-semibold">
                    <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                    <span>{passwordSuccess}</span>
                  </div>
                )}
                {passwordError && (
                  <div className="mb-5 p-3.5 bg-red-50 border border-red-200 rounded-xl flex items-center gap-2 text-red-800 text-xs font-semibold">
                    <AlertCircle size={16} className="text-red-600 shrink-0" />
                    <span>{passwordError}</span>
                  </div>
                )}

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {/* Current Password */}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1.5">
                      Current Password <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                      <input
                        id="profile-current-password"
                        type={showCurrentPass ? 'text' : 'password'}
                        value={passwordForm.currentPassword}
                        onChange={(e) =>
                          setPasswordForm({ ...passwordForm, currentPassword: e.target.value })
                        }
                        placeholder="Enter current password to verify"
                        className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                          passwordErrors.currentPassword ? 'border-red-500' : 'border-slate-300'
                        }`}
                      />
                      <button
                        type="button"
                        onClick={() => setShowCurrentPass(!showCurrentPass)}
                        className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                        tabIndex="-1"
                      >
                        {showCurrentPass ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                    {passwordErrors.currentPassword && (
                      <p className="text-xs text-red-600 mt-1">{passwordErrors.currentPassword}</p>
                    )}
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          id="profile-new-password"
                          type={showNewPass ? 'text' : 'password'}
                          value={passwordForm.newPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, newPassword: e.target.value })
                          }
                          placeholder="Minimum 8 characters"
                          className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                            passwordErrors.newPassword ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowNewPass(!showNewPass)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          tabIndex="-1"
                        >
                          {showNewPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passwordErrors.newPassword && (
                        <p className="text-xs text-red-600 mt-1">{passwordErrors.newPassword}</p>
                      )}
                    </div>

                    {/* Confirm New Password */}
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1.5">
                        Confirm New Password <span className="text-red-500">*</span>
                      </label>
                      <div className="relative">
                        <Lock size={16} className="absolute left-3.5 top-3 text-slate-400" />
                        <input
                          id="profile-confirm-password"
                          type={showConfirmPass ? 'text' : 'password'}
                          value={passwordForm.confirmPassword}
                          onChange={(e) =>
                            setPasswordForm({ ...passwordForm, confirmPassword: e.target.value })
                          }
                          placeholder="Re-enter new password"
                          className={`w-full pl-10 pr-10 py-2.5 text-sm border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white ${
                            passwordErrors.confirmPassword ? 'border-red-500' : 'border-slate-300'
                          }`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowConfirmPass(!showConfirmPass)}
                          className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 cursor-pointer"
                          tabIndex="-1"
                        >
                          {showConfirmPass ? <EyeOff size={16} /> : <Eye size={16} />}
                        </button>
                      </div>
                      {passwordErrors.confirmPassword && (
                        <p className="text-xs text-red-600 mt-1">{passwordErrors.confirmPassword}</p>
                      )}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-4 flex items-center justify-end border-t border-slate-100">
                    <Button
                      id="change-password-btn"
                      type="submit"
                      disabled={passwordSaving}
                      variant="primary"
                      size="sm"
                      icon={KeyRound}
                    >
                      {passwordSaving ? 'Updating Password...' : 'Update Password'}
                    </Button>
                  </div>
                </form>
              </div>
            </div>

            {/* ── 4. Role Summary & Navigation Shortcuts (1 Column) ───────────── */}
            <div className="space-y-6">
              {/* Role Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`p-2 rounded-xl ${roleMeta.theme}`}>
                    <RoleIcon size={18} />
                  </div>
                  <div>
                    <h3 className="text-sm font-bold text-slate-800">
                      {roleMeta.label} Privileges
                    </h3>
                    <p className="text-[11px] text-slate-400">Verified Role Capabilities</p>
                  </div>
                </div>

                {/* Role Specific Description & Stats */}
                {user?.role === 'customer' && (
                  <div className="space-y-3 mt-4 text-xs text-slate-600">
                    <p>
                      As a <strong>Customer</strong>, you can book vehicles from our fleet, track
                      real-time rental confirmations, and manage your booking history.
                    </p>
                    <div className="p-3 bg-blue-50/70 border border-blue-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Total Bookings:</span>
                        <strong className="text-blue-700 font-bold">{customerBookingsCount}</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Browse Fleet:</span>
                        <strong className="text-emerald-700 font-bold">{vehicles.length} Models</strong>
                      </div>
                    </div>
                    <div className="pt-2 space-y-2">
                      <Link
                        to="/dashboard"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors shadow-2xs"
                      >
                        <Calendar size={14} />
                        View Bookings & Dashboard
                      </Link>
                      <Link
                        to="/vehicles"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <Car size={14} />
                        Browse Available Vehicles
                      </Link>
                    </div>
                  </div>
                )}

                {(user?.role === 'fleet_manager' || user?.role === 'manager') && (
                  <div className="space-y-3 mt-4 text-xs text-slate-600">
                    <p>
                      As a <strong>Fleet Manager</strong>, you maintain complete operational
                      control over vehicles, status tracking, maintenance schedules, and fleet health.
                    </p>
                    <div className="p-3 bg-emerald-50/70 border border-emerald-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Managed Fleet Size:</span>
                        <strong className="text-emerald-700 font-bold">{vehicles.length} Vehicles</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Available Units:</span>
                        <strong className="text-blue-700 font-bold">
                          {vehicles.filter((v) => v.status === 'Available').length}
                        </strong>
                      </div>
                    </div>
                    <div className="pt-2 space-y-2">
                      <Link
                        to="/dashboard"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl transition-colors shadow-2xs"
                      >
                        <LayoutDashboard size={14} />
                        Fleet Operations Dashboard
                      </Link>
                      <Link
                        to="/maintenance"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <Wrench size={14} />
                        Maintenance Service Logs
                      </Link>
                    </div>
                  </div>
                )}

                {user?.role === 'admin' && (
                  <div className="space-y-3 mt-4 text-xs text-slate-600">
                    <p>
                      As a <strong>System Administrator</strong>, you possess root permissions across
                      user registrations, RBAC authorization, booking records, and fleet management.
                    </p>
                    <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">System Role:</span>
                        <strong className="text-purple-700 font-bold">Super Admin</strong>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-600">Security Mode:</span>
                        <strong className="text-emerald-700 font-bold">RBAC Enforced</strong>
                      </div>
                    </div>
                    <div className="pt-2 space-y-2">
                      <Link
                        to="/admin-dashboard"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold bg-purple-600 hover:bg-purple-700 text-white rounded-xl transition-colors shadow-2xs"
                      >
                        <Shield size={14} />
                        Admin Control Center
                      </Link>
                      <Link
                        to="/dashboard"
                        className="w-full flex items-center justify-center gap-2 py-2 px-3 text-xs font-semibold border border-slate-200 text-slate-700 hover:bg-slate-50 rounded-xl transition-colors"
                      >
                        <LayoutDashboard size={14} />
                        Full Fleet Overview
                      </Link>
                    </div>
                  </div>
                )}
              </div>

              {/* Security Audit Card */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-xs p-5">
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-2">
                  Session & Security Summary
                </h4>
                <ul className="text-xs text-slate-600 space-y-2">
                  <li className="flex items-center justify-between">
                    <span>Authentication Method:</span>
                    <strong className="text-slate-800 font-semibold">JWT Bearer</strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Socket.IO Live Sync:</span>
                    <strong className={isConnected ? 'text-emerald-600' : 'text-red-500'}>
                      {isConnected ? 'Active' : 'Offline'}
                    </strong>
                  </li>
                  <li className="flex items-center justify-between">
                    <span>Password Encryption:</span>
                    <strong className="text-slate-800 font-semibold">bcrypt (12 rounds)</strong>
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
