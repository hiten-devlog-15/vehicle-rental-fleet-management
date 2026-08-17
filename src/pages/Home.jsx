import { useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, MapPin, Calendar, Car, Shield, Clock, Headphones,
  Star, ChevronRight, ArrowRight, Zap, Award, Users,
} from 'lucide-react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VehicleCard from '../components/VehicleCard';
import { vehicles, vehicleCategories } from '../data/vehicles';

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
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [returnDate, setReturnDate] = useState('');
  const [location, setLocation] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');

  const featuredVehicles = vehicles.slice(0, 6);

  const filteredByCategory = activeCategory === 'all'
    ? featuredVehicles
    : featuredVehicles.filter((v) =>
        v.type === activeCategory || v.type.includes(activeCategory)
      );

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
          <div className="max-w-3xl">
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
            <p className="text-lg text-slate-300 leading-relaxed mb-10 max-w-xl">
              From city sedans to rugged SUVs and motorcycles — DriveFleet has the perfect vehicle for every occasion. Book in minutes, drive in style.
            </p>

            {/* Search box */}
            <div className="bg-white rounded-2xl shadow-2xl p-4 sm:p-5 mb-8">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="relative">
                  <MapPin size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    id="hero-location"
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="Pickup City"
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    id="hero-pickup-date"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="relative">
                  <Calendar size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-500" />
                  <input
                    id="hero-return-date"
                    type="date"
                    value={returnDate}
                    onChange={(e) => setReturnDate(e.target.value)}
                    className="w-full pl-9 pr-3 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <Link
                  to="/vehicles"
                  id="hero-search-btn"
                  className="flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white font-semibold text-sm rounded-xl py-2.5 px-4 transition-all shadow-md hover:shadow-blue-300"
                >
                  <Search size={16} />
                  Browse Vehicles
                </Link>
              </div>
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

      {/* ───── Vehicle Categories ───── */}
      <section className="py-14 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">Browse by Type</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Popular Categories</h2>
            </div>
            <Link to="/vehicles" className="hidden sm:flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
              View all <ArrowRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {vehicleCategories.map((cat) => (
              <button
                key={cat.id}
                id={`home-cat-${cat.id}`}
                onClick={() => setActiveCategory(cat.id)}
                className={`flex flex-col items-center gap-2 p-4 rounded-2xl border-2 transition-all duration-200 ${
                  activeCategory === cat.id
                    ? 'border-blue-500 bg-blue-50 shadow-md shadow-blue-100'
                    : 'border-slate-200 bg-white hover:border-blue-300 hover:bg-slate-50'
                }`}
              >
                <span className="text-2xl">{cat.icon}</span>
                <span className={`text-xs font-semibold text-center ${activeCategory === cat.id ? 'text-blue-700' : 'text-slate-600'}`}>
                  {cat.label}
                </span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* ───── Featured Vehicles ───── */}
      <section className="py-14 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <p className="text-blue-600 text-sm font-semibold uppercase tracking-wider mb-1">Available Now</p>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-800">Featured Vehicles</h2>
            </div>
            <Link to="/vehicles" className="flex items-center gap-1 text-sm font-semibold text-blue-600 hover:text-blue-700">
              See all <ChevronRight size={16} />
            </Link>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredByCategory.map((v) => (
              <VehicleCard key={v.id} vehicle={v} />
            ))}
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
              to="/vehicles"
              id="cta-browse-btn"
              className="px-8 py-3.5 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-colors shadow-md"
            >
              Browse Vehicles
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
