// Register.jsx — Experiment 2: useEffect for document title
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Eye, EyeOff, Car, User, Mail, Phone, Lock, Shield } from 'lucide-react';

const inputCls =
  'w-full pl-10 pr-4 py-3 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 bg-white';

export default function Register() {
  const [form, setForm] = useState({
    name: '', email: '', phone: '',
    password: '', confirmPassword: '', role: 'customer',
  });
  const [errors, setErrors] = useState({});
  const [showPass, setShowPass] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // useEffect — document title (Experiment 2)
  useEffect(() => {
    document.title = 'DriveFleet | Register';
    return () => { document.title = 'DriveFleet'; };
  }, []);
  const [submitted, setSubmitted] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim()) e.phone = 'Phone is required.';
    else if (!/^\+?[\d\s-]{10,}$/.test(form.phone)) e.phone = 'Enter a valid phone.';
    if (!form.password) e.password = 'Password is required.';
    else if (form.password.length < 8) e.password = 'Password must be at least 8 characters.';
    if (!form.confirmPassword) e.confirmPassword = 'Please confirm your password.';
    else if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match.';
    return e;
  };

  const update = (field) => (e) => {
    setForm({ ...form, [field]: e.target.value });
    setErrors({ ...errors, [field]: undefined });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 p-6">
        <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-10 text-center max-w-md w-full">
          <p className="text-5xl mb-4">🎉</p>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Account Created!</h2>
          <p className="text-slate-500 text-sm mb-6">
            Welcome, <strong>{form.name}</strong>! Your DriveFleet account has been created as a{' '}
            <strong className="capitalize">{form.role === 'fleet' ? 'Fleet Manager' : 'Customer'}</strong>.
          </p>
          <Link
            to="/login"
            className="inline-block px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold text-sm rounded-xl transition-colors"
          >
            Go to Login
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 relative overflow-hidden flex-col items-center justify-center p-12">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.2) 1px, transparent 0)', backgroundSize: '28px 28px' }}
        />
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
            Join thousands of<br />happy drivers
          </h2>
          <p className="text-slate-400 text-sm max-w-xs mx-auto leading-relaxed">
            Create your free account and get access to India's largest vehicle rental network.
          </p>
          <div className="mt-10 space-y-3 max-w-xs mx-auto text-left">
            {['Instant vehicle booking', '24/7 roadside assistance', 'Transparent pricing', 'Exclusive member deals'].map((f) => (
              <div key={f} className="flex items-center gap-3 bg-white/10 backdrop-blur rounded-xl px-4 py-3">
                <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 12 12" fill="none" className="w-3 h-3">
                    <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
                <span className="text-sm text-white">{f}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-6 bg-slate-50 overflow-y-auto">
        <div className="w-full max-w-md py-8">
          {/* Mobile logo */}
          <div className="lg:hidden flex items-center gap-2 mb-8">
            <div className="p-2 bg-blue-600 rounded-xl">
              <Car size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">Drive<span className="text-blue-600">Fleet</span></span>
          </div>

          <div className="bg-white rounded-2xl shadow-lg border border-slate-200 p-8">
            <h1 className="text-2xl font-bold text-slate-800 mb-1">Create Account</h1>
            <p className="text-sm text-slate-500 mb-6">
              Already have an account?{' '}
              <Link to="/login" className="text-blue-600 font-semibold hover:text-blue-700">Sign in</Link>
            </p>

            <form onSubmit={handleSubmit} noValidate className="space-y-4">
              {/* Name */}
              <div>
                <label htmlFor="reg-name" className="block text-sm font-medium text-slate-700 mb-1.5">Full Name *</label>
                <div className="relative">
                  <User size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="reg-name" type="text" value={form.name} onChange={update('name')}
                    placeholder="Arjun Sharma"
                    className={`${inputCls} ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`} />
                </div>
                {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name}</p>}
              </div>

              {/* Email */}
              <div>
                <label htmlFor="reg-email" className="block text-sm font-medium text-slate-700 mb-1.5">Email Address *</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="reg-email" type="email" value={form.email} onChange={update('email')}
                    placeholder="arjun@example.com"
                    className={`${inputCls} ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`} />
                </div>
                {errors.email && <p className="text-xs text-red-500 mt-1">{errors.email}</p>}
              </div>

              {/* Phone */}
              <div>
                <label htmlFor="reg-phone" className="block text-sm font-medium text-slate-700 mb-1.5">Phone Number *</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="reg-phone" type="tel" value={form.phone} onChange={update('phone')}
                    placeholder="+91 98765 43210"
                    className={`${inputCls} ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`} />
                </div>
                {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone}</p>}
              </div>

              {/* Password */}
              <div>
                <label htmlFor="reg-password" className="block text-sm font-medium text-slate-700 mb-1.5">Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="reg-password" type={showPass ? 'text' : 'password'} value={form.password} onChange={update('password')}
                    placeholder="Min. 8 characters"
                    className={`${inputCls} pr-10 ${errors.password ? 'border-red-400 focus:ring-red-400' : ''}`} />
                  <button type="button" id="reg-toggle-pass" onClick={() => setShowPass(!showPass)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && <p className="text-xs text-red-500 mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div>
                <label htmlFor="reg-confirm-password" className="block text-sm font-medium text-slate-700 mb-1.5">Confirm Password *</label>
                <div className="relative">
                  <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input id="reg-confirm-password" type={showConfirm ? 'text' : 'password'} value={form.confirmPassword} onChange={update('confirmPassword')}
                    placeholder="Repeat your password"
                    className={`${inputCls} pr-10 ${errors.confirmPassword ? 'border-red-400 focus:ring-red-400' : ''}`} />
                  <button type="button" id="reg-toggle-confirm" onClick={() => setShowConfirm(!showConfirm)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.confirmPassword && <p className="text-xs text-red-500 mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Role */}
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">Register as *</label>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { value: 'customer', label: 'Customer', desc: 'Rent vehicles', icon: User },
                    { value: 'fleet', label: 'Fleet Manager', desc: 'Manage fleet', icon: Shield },
                  ].map(({ value, label, desc, icon: Icon }) => (
                    <button
                      key={value}
                      type="button"
                      id={`reg-role-${value}`}
                      onClick={() => setForm({ ...form, role: value })}
                      className={`flex flex-col items-center gap-1.5 p-4 rounded-xl border-2 transition-all text-center ${
                        form.role === value
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-slate-200 text-slate-600 hover:border-blue-300'
                      }`}
                    >
                      <Icon size={20} />
                      <span className="text-sm font-semibold">{label}</span>
                      <span className="text-xs opacity-70">{desc}</span>
                    </button>
                  ))}
                </div>
              </div>

              <button
                id="reg-submit-btn"
                type="submit"
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold text-sm rounded-xl transition-all shadow-md hover:shadow-blue-200 mt-2"
              >
                Create Account
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
