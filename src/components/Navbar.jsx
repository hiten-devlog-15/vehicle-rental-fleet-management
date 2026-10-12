// Navbar.jsx — Experiment 2: uses useAuth (useContext) to display login state
import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, LogOut, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import UserMenu from './UserMenu';
import NotificationCenter from './NotificationCenter';

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // useAuth — Custom Hook consuming AuthContext (Experiment 2)
  const { user, isAuthenticated, logout } = useAuth();

  // useEffect #1 — close mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-slate-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">

          {/* Logo */}
          <Link to="/" className="flex items-center gap-2 group" id="nav-logo">
            <div className="p-2 bg-blue-600 rounded-xl group-hover:bg-blue-700 transition-colors">
              <Car size={20} className="text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800">
              Drive<span className="text-blue-600">Fleet</span>
            </span>
          </Link>

          {/* Desktop Auth — shows user menu dropdown when logged in, Login/Register when not */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              /* ── Logged-in state ── */
              <div className="flex items-center gap-2">
                <NotificationCenter />
                <UserMenu align="right" />
                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Sign out of your account"
                >
                  <LogOut size={15} />
                  Logout
                </button>
              </div>
            ) : (
              /* ── Logged-out state ── */
              <>
                <Link
                  to="/login"
                  id="nav-login-btn"
                  className="px-4 py-2 text-sm font-semibold text-slate-700 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                >
                  Login
                </Link>
                <Link
                  to="/register"
                  id="nav-register-btn"
                  className="px-4 py-2 text-sm font-semibold bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-lg transition-colors shadow-sm"
                >
                  Register
                </Link>
              </>
            )}
          </div>

          {/* Mobile menu toggle & Notification center */}
          <div className="flex md:hidden items-center gap-1.5">
            {isAuthenticated && <NotificationCenter />}
            <button
              id="nav-mobile-menu-btn"
              className="p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {/* Mobile auth section */}
          {isAuthenticated ? (
            <div className="mt-1 pt-1 space-y-2">
              <Link
                to="/profile"
                id="nav-mobile-profile-card"
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between p-3 bg-blue-50/80 hover:bg-blue-100/70 border border-blue-100 rounded-xl transition-colors"
                title="Open Profile & Settings"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold shadow-xs">
                    {user.avatar || 'DF'}
                  </div>
                  <div className="text-left">
                    <p className="text-sm font-semibold text-slate-800 leading-tight">{user.name}</p>
                    <p className="text-xs text-blue-600 capitalize leading-tight">{user.role.replace('_', ' ')}</p>
                  </div>
                </div>
                <span className="text-xs font-bold text-blue-600 bg-white px-2 py-1 rounded-md shadow-2xs border border-blue-200">
                  Profile →
                </span>
              </Link>
              <Link
                to="/profile"
                id="nav-mobile-profile-btn"
                onClick={() => setMenuOpen(false)}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-slate-700 bg-slate-50 border border-slate-200 rounded-lg hover:bg-slate-100 transition-colors"
              >
                <User size={15} className="text-blue-600" />
                Manage Account & Settings
              </Link>
              <button
                id="nav-mobile-logout-btn"
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-1">
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center px-4 py-2 text-sm font-semibold border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50"
              >
                Login
              </Link>
              <Link
                to="/register"
                onClick={() => setMenuOpen(false)}
                className="flex-1 text-center px-4 py-2 text-sm font-semibold bg-blue-600 text-white rounded-lg hover:bg-blue-700"
              >
                Register
              </Link>
            </div>
          )}
        </div>
      )}
    </nav>
  );
}
