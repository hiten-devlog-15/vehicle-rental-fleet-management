// Navbar.jsx — Experiment 2: uses useAuth (useContext) to display login state
import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { Car, Menu, X, LayoutDashboard, Wrench, Users, ChevronDown, LogOut, UserCircle } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

const navLinks = [
  { to: '/', label: 'Home' },
  { to: '/vehicles', label: 'Vehicles' },
  { to: '/booking', label: 'Book Now' },
];

const dashboardLinks = [
  { to: '/customer-dashboard', label: 'My Bookings', icon: LayoutDashboard },
  { to: '/fleet-dashboard', label: 'Fleet Manager', icon: Users },
  { to: '/maintenance', label: 'Maintenance', icon: Wrench },
];

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dashOpen, setDashOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // useAuth — Custom Hook consuming AuthContext (Experiment 2)
  const { user, isAuthenticated, logout } = useAuth();

  // useEffect #1 — close mobile menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
    setDashOpen(false);
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

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <NavLink
                key={link.to}
                to={link.to}
                end={link.to === '/'}
                id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                className={({ isActive }) =>
                  `px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-800'
                  }`
                }
              >
                {link.label}
              </NavLink>
            ))}

            {/* Dashboards dropdown */}
            <div className="relative">
              <button
                id="nav-dashboards-btn"
                onClick={() => setDashOpen(!dashOpen)}
                className="flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:bg-slate-100 hover:text-slate-800 transition-colors"
              >
                Dashboards
                <ChevronDown size={14} className={`transition-transform ${dashOpen ? 'rotate-180' : ''}`} />
              </button>
              {dashOpen && (
                <div className="absolute top-full mt-1 left-0 w-52 bg-white border border-slate-200 rounded-xl shadow-lg py-1 z-50">
                  {dashboardLinks.map((link) => (
                    <NavLink
                      key={link.to}
                      to={link.to}
                      id={`nav-${link.label.toLowerCase().replace(/\s+/g, '-')}`}
                      onClick={() => setDashOpen(false)}
                      className={({ isActive }) =>
                        `flex items-center gap-3 px-4 py-2.5 text-sm transition-colors ${
                          isActive
                            ? 'bg-blue-50 text-blue-600'
                            : 'text-slate-600 hover:bg-slate-50'
                        }`
                      }
                    >
                      <link.icon size={16} />
                      {link.label}
                    </NavLink>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Desktop Auth — shows user info when logged in, Login/Register when not */}
          <div className="hidden md:flex items-center gap-2">
            {isAuthenticated ? (
              /* ── Logged-in state ── */
              <div className="flex items-center gap-3">
                {/* User greeting using useContext data */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-blue-50 rounded-xl">
                  <div className="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                    {user.avatar}
                  </div>
                  <div className="text-left">
                    <p className="text-xs font-semibold text-slate-800 leading-tight">
                      {user.name}
                    </p>
                    <p className="text-xs text-blue-500 leading-tight capitalize">
                      {user.role.replace('_', ' ')}
                    </p>
                  </div>
                </div>
                <button
                  id="nav-logout-btn"
                  onClick={handleLogout}
                  className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold text-slate-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
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

          {/* Mobile menu toggle */}
          <button
            id="nav-mobile-menu-btn"
            className="md:hidden p-2 rounded-lg text-slate-600 hover:bg-slate-100 transition-colors"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white px-4 pb-4 pt-2 flex flex-col gap-1">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.to === '/'}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `block px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              {link.label}
            </NavLink>
          ))}

          <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-3 pt-2">
            Dashboards
          </p>
          {dashboardLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={({ isActive }) =>
                `flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium ${
                  isActive ? 'bg-blue-50 text-blue-600' : 'text-slate-700 hover:bg-slate-100'
                }`
              }
            >
              <link.icon size={15} />
              {link.label}
            </NavLink>
          ))}

          {/* Mobile auth section */}
          {isAuthenticated ? (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <div className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-xl mb-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white text-xs font-bold">
                  {user.avatar}
                </div>
                <div>
                  <p className="text-sm font-semibold text-slate-800">{user.name}</p>
                  <p className="text-xs text-blue-500 capitalize">{user.role.replace('_', ' ')}</p>
                </div>
              </div>
              <button
                id="nav-mobile-logout-btn"
                onClick={() => { setMenuOpen(false); handleLogout(); }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 text-sm font-semibold text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
              >
                <LogOut size={15} />
                Logout
              </button>
            </div>
          ) : (
            <div className="flex gap-2 mt-3">
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
