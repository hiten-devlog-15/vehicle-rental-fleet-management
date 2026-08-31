// Home.jsx — Experiment 2: useEffect for document title
import { useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield, Clock, Zap, Award,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const whyUs = [
  { icon: Shield, title: 'Fully Insured', desc: 'All vehicles come with comprehensive insurance coverage for your peace of mind.', color: 'text-blue-600 bg-blue-100' },
  { icon: Clock, title: '24/7 Support', desc: 'Round-the-clock roadside assistance and customer support wherever you are.', color: 'text-emerald-600 bg-emerald-100' },
  { icon: Zap, title: 'Instant Booking', desc: 'Book in under 2 minutes. Instant confirmation with no hidden charges.', color: 'text-amber-600 bg-amber-100' },
  { icon: Award, title: 'Premium Fleet', desc: 'Meticulously maintained, clean vehicles from top brands with regular servicing.', color: 'text-violet-600 bg-violet-100' },
];

const stats = [
  { value: '500+', label: 'Vehicles in Fleet' },
  { value: '50k+', label: 'Happy Customers' },
  { value: '100+', label: 'Pickup Points' },
  { value: '4.8★', label: 'Average Rating' },
];

export default function Home() {
  // useEffect — document title (Experiment 2)
  useEffect(() => {
    document.title = 'DriveFleet | Home';
    return () => { document.title = 'DriveFleet'; };
  }, []);

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* ───── Hero Section ───── */}
      <section className="relative min-h-[88vh] flex items-center overflow-hidden bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
        {/* Background grid */}
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(255,255,255,0.15) 1px, transparent 0)', backgroundSize: '32px 32px' }}
        />
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 w-full">
          <div className="max-w-3xl mx-auto text-center">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 bg-blue-600/20 border border-blue-500/30 rounded-full px-4 py-1.5 mb-6">
              <Zap size={13} className="text-blue-400" />
              <span className="text-blue-300 text-xs font-semibold tracking-wide">India's #1 Vehicle Rental Platform</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-white leading-tight mb-6">
              Rent the Right Vehicle{' '}
              <span className="text-blue-400">for Every</span>{' '}
              Journey
            </h1>
            <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-xl mx-auto">
              From city sedans to rugged SUVs and motorcycles — DriveFleet has the perfect vehicle for every occasion. Book in minutes, drive in style.
            </p>

            {/* Auth Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-12">
              <Link
                to="/login"
                id="hero-login-btn"
                className="px-8 py-3.5 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-bold rounded-xl transition-all shadow-lg hover:shadow-blue-500/30"
              >
                Login to Your Account
              </Link>
              <Link
                to="/register"
                id="hero-register-btn"
                className="px-8 py-3.5 border-2 border-white/40 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
              >
                Create Free Account
              </Link>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {stats.map(({ value, label }) => (
                <div key={label} className="text-center">
                  <p className="text-2xl font-bold text-white">{value}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{label}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ───── Why Choose Us ───── */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-2">Why DriveFleet</p>
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-800 mb-3">The Smarter Way to Rent</h2>
            <p className="text-slate-500 max-w-xl mx-auto text-sm">
              Trusted by thousands of happy customers across India. We make vehicle rental simple, safe, and affordable.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {whyUs.map(({ icon: Icon, title, desc, color }) => (
              <div key={title} className="group bg-slate-50 hover:bg-white border border-slate-200 hover:border-blue-200 rounded-2xl p-6 text-center hover:shadow-lg transition-all duration-300">
                <div className={`inline-flex p-3 rounded-2xl mb-4 ${color}`}>
                  <Icon size={24} />
                </div>
                <h3 className="font-bold text-slate-800 mb-2">{title}</h3>
                <p className="text-sm text-slate-500 leading-relaxed">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ───── CTA Banner ───── */}
      <section className="py-16 bg-gradient-to-r from-blue-600 to-blue-800">
        <div className="max-w-3xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold text-white mb-4">Ready for Your Next Adventure?</h2>
          <p className="text-blue-100 mb-8 text-sm leading-relaxed">
            Over 500 vehicles available across 100+ pickup points. Instant booking, transparent pricing.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              to="/login"
              id="cta-login-btn"
              className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-md"
            >
              Login
            </Link>
            <Link
              to="/register"
              id="cta-register-btn"
              className="px-8 py-3.5 border-2 border-white/50 text-white font-bold rounded-xl hover:bg-white/10 transition-colors"
            >
              Create Account
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
