// Login.jsx — Experiment 2: uses useAuth() for mock authentication + useEffect for page title
import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, Car, Lock, Mail, Info } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const inputCls =
  'w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 bg-white';

// Quick-fill credentials for demonstration
const DEMO_CREDENTIALS = [
  { label: 'Customer', email: 'customer@drivefleet.com', password: 'customer123', color: 'blue' },
  { label: 'Fleet Manager', email: 'manager@drivefleet.com', password: 'manager123', color: 'emerald' },
  { label: 'Admin', email: 'admin@drivefleet.com', password: 'admin123', color: 'purple' },
];

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [authError, setAuthError] = useState('');

  const navigate = useNavigate();

  // useAuth — Custom Hook (Experiment 2) — access login function from AuthContext
  const { login, isAuthenticated, user } = useAuth();

  // useEffect #1 — set document title when this page mounts
  useEffect(() => {
    document.title = 'DriveFleet | Login';
    return () => { document.title = 'DriveFleet'; };
  }, []);

  // useEffect #2 — redirect if already logged in
  useEffect(() => {
    if (isAuthenticated) {
      if (user?.role === 'fleet_manager' || user?.role === 'admin') {
        navigate('/fleet-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const validate = () => {
    const e = {};
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 6) e.password = 'Password must be at least 6 characters.';
    return e;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setAuthError('');
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }

    setLoading(true);
    // Simulate async login (mock delay)
    setTimeout(() => {
      const result = login(form.email, form.password);
      setLoading(false);

      if (!result.success) {
        setAuthError(result.error);
        return;
      }

      // Navigate based on role
      if (result.user.role === 'fleet_manager' || result.user.role === 'admin') {
        navigate('/fleet-dashboard');
      } else {
        navigate('/customer-dashboard');
      }
    }, 800);
  };

  // Quick-fill a demo credential
  const fillDemo = (cred) => {
    setForm((f) => ({ ...f, email: cred.email, password: cred.password }));
    setErrors({});
    setAuthError('');
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel — decorative */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />
        <div className="absolute top-1/4 left-1/3 w-64 h-64 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="relative z-10 text-center">
          <div className="inline-flex items-center gap-3 mb-8">
            <div className="p-3 bg-blue-600 rounded-2xl">
              <Car size={28} className="text-white" />
            </div>
            <span className="text-3xl font-extrabold text-white">
              Drive<span className="text-blue-400">Fleet</span>
            </span>
          </div>
          <h2 className="text-3xl font-bold text-white mb-4 leading-snug">
            Welcome back to<br />your fleet hub
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            Manage your bookings, track your active rentals, and discover new vehicles — all in one place.
          </p>

          {/* Stat cards */}
          <div className="mt-10 grid grid-cols-2 gap-4 max-w-xs mx-auto">
            {[
              { value: '500+', label: 'Vehicles' },
              { value: '50k+', label: 'Customers' },
              { value: '4.8★', label: 'Rating' },
              { value: '24/7', label: 'Support' },
            ].map(({ value, label }) => (
              <div key={label} className="bg-white/10 backdrop-blur rounded-xl p-4 text-center">
                <p className="text-xl font-bold text-white">{value}</p>
                <p className="text-xs text-slate-400 mt-0.5">{label}</p>
              </div>
            ))}
          </div>

          {/* Demo credentials hint */}
          <div className="mt-8 bg-white/10 backdrop-blur rounded-2xl p-4 text-left max-w-xs mx-auto">
            <p className="text-xs font-bold text-blue-300 uppercase tracking-wider mb-2 flex items-center gap-1">
              <Info size={12} /> Experiment 2 Demo Users
            </p>
            {DEMO_CREDENTIALS.map((c) => (
              <div key={c.label} className="mb-1">
                <p className="text-xs text-slate-300">
                  <span className="font-semibold text-white">{c.label}:</span> {c.email}
                </p>
              </div>
            ))}
            <p className="text-xs text-slate-400 mt-2">All passwords: role + "123"</p>
          </div>
        </div>
      </div>

      {/* Right panel — form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50">
        <div className="w-full max-w-md">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Car size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Drive<span className="text-blue-600">Fleet</span>
            </span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Sign In</h1>
            <p className="text-sm text-slate-500 mb-5">
              Don't have an account?{' '}
              <Link to="/register" className="text-blue-600 font-semibold hover:text-blue-700">
                Create one free
              </Link>
            </p>

            {/* Quick-fill demo buttons (Experiment 2 demo feature) */}
            <div className="mb-5 p-3 bg-amber-50 border border-amber-200 rounded-xl">
              <p className="text-xs font-semibold text-amber-700 mb-2 flex items-center gap-1">
                <Info size={12} /> Quick Login (Experiment 2 Demo)
              </p>
              <div className="flex flex-wrap gap-2">
                {DEMO_CREDENTIALS.map((c) => (
                  <button
                    key={c.label}
                    type="button"
                    id={`demo-login-${c.label.toLowerCase().replace(' ', '-')}`}
                    onClick={() => fillDemo(c)}
                    className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-white border border-amber-300 text-slate-700 hover:bg-amber-100 transition-colors"
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Auth error */}
            {authError && (
              <div className="mb-4 px-4 py-3 bg-red-50 border border-red-200 rounded-xl text-sm text-red-600">
                {authError}
              </div>
            )}

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Email */}
              <div>
                <label htmlFor="login-email" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Email Address
                </label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-email"
                    type="email"
                    value={form.email}
                    onChange={(e) => { setForm({ ...form, email: e.target.value }); setErrors({ ...errors, email: undefined }); setAuthError(''); }}
                    placeholder="you@drivefleet.com"
                    className={`${inputCls} ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="login-password" className="block text-sm font-medium text-slate-700 mb-1.5">
                  Password
                </label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    id="login-password"
                    type={showPass ? 'text' : 'password'}
                    value={form.password}
                    onChange={(e) => { setForm({ ...form, password: e.target.value }); setErrors({ ...errors, password: undefined }); setAuthError(''); }}
                    placeholder="••••••••"
                    className={`${inputCls} pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`}
                  />
                  <button
                    type="button"
                    id="login-toggle-password"
                    onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
                  >
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Remember + Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="login-remember"
                    type="checkbox"
                    checked={form.remember}
                    onChange={(e) => setForm({ ...form, remember: e.target.checked })}
                    className="w-4 h-4 rounded text-blue-600 border-slate-300 focus:ring-blue-500"
                  />
                  <span className="text-sm text-slate-600">Remember me</span>
                </label>
                <button type="button" id="login-forgot-btn" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                  Forgot password?
                </button>
              </div>

              <button
                id="login-submit-btn"
                type="submit"
                disabled={loading}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-60 disabled:cursor-not-allowed text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-blue-200 mt-2"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-2">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Signing in...
                  </span>
                ) : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
