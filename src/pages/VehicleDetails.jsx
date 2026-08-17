import { useParams, Link, useNavigate } from 'react-router-dom';
import { vehicles } from '../data/vehicles';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import StatusBadge from '../components/StatusBadge';
import {
  Star, Fuel, Settings, Users, Gauge, Calendar,
  ChevronLeft, CheckCircle2, MapPin,
} from 'lucide-react';
import { useState } from 'react';

export default function VehicleDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const vehicle = vehicles.find((v) => v.id === id);

  const [pickupDate, setPickupDate] = useState('');
  const [returnDate, setReturnDate] = useState('');

  if (!vehicle) {
    return (
      <div className="min-h-screen flex flex-col">
        <Navbar />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <p className="text-5xl mb-4">🚗</p>
            <h2 className="text-2xl font-bold text-slate-700">Vehicle not found</h2>
            <Link to="/vehicles" className="mt-4 inline-block text-blue-600 hover:underline">
              ← Back to vehicles
            </Link>
          </div>
        </div>
        <Footer />
      </div>
    );
  }

  const days = (() => {
    if (!pickupDate || !returnDate) return 0;
    const diff = new Date(returnDate) - new Date(pickupDate);
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  })();

  const specs = [
    { icon: Fuel,     label: 'Fuel Type',     value: vehicle.fuel },
    { icon: Settings, label: 'Transmission',  value: vehicle.transmission },
    { icon: Users,    label: 'Seating',        value: `${vehicle.seats} Persons` },
    { icon: Gauge,    label: 'Mileage',        value: vehicle.mileage },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      <div className="flex-1 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          {/* Breadcrumb */}
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-blue-600 transition-colors mb-6"
          >
            <ChevronLeft size={16} />
            Back to Vehicles
          </button>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: image + details */}
            <div className="lg:col-span-2 space-y-6">
              {/* Main image */}
              <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-slate-200">
                <div className="relative h-64 sm:h-80 lg:h-96">
                  <img
                    src={vehicle.image}
                    alt={vehicle.name}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.src = `https://placehold.co/800x400/e2e8f0/64748b?text=${encodeURIComponent(vehicle.name)}`;
                    }}
                  />
                  <div className="absolute top-4 left-4">
                    <span className="bg-white/90 backdrop-blur text-slate-700 text-sm font-semibold px-3 py-1.5 rounded-full">
                      {vehicle.type}
                    </span>
                  </div>
                  <div className="absolute top-4 right-4">
                    <StatusBadge status={vehicle.available ? 'Available' : 'Rented'} />
                  </div>
                </div>
              </div>

              {/* Vehicle name + rating */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <div className="flex flex-wrap items-start justify-between gap-4 mb-4">
                  <div>
                    <p className="text-blue-600 text-sm font-semibold">{vehicle.brand}</p>
                    <h1 className="text-2xl sm:text-3xl font-bold text-slate-800">{vehicle.name}</h1>
                    <p className="text-slate-400 text-sm mt-1">Year {vehicle.year} · {vehicle.color}</p>
                  </div>
                  <div className="flex flex-col items-end">
                    <div className="flex items-center gap-1.5 bg-amber-50 border border-amber-200 rounded-xl px-3 py-1.5">
                      <Star size={16} fill="#f59e0b" className="text-amber-400" />
                      <span className="font-bold text-slate-700">{vehicle.rating}</span>
                      <span className="text-xs text-slate-400">({vehicle.reviews} reviews)</span>
                    </div>
                    <p className="text-xs text-slate-400 mt-1">Reg: {vehicle.registrationNo}</p>
                  </div>
                </div>

                {/* Specs grid */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-5">
                  {specs.map(({ icon: Icon, label, value }) => (
                    <div key={label} className="bg-slate-50 rounded-xl p-3 text-center border border-slate-100">
                      <Icon size={20} className="text-blue-500 mx-auto mb-1.5" />
                      <p className="text-xs text-slate-400">{label}</p>
                      <p className="text-sm font-semibold text-slate-700 mt-0.5">{value}</p>
                    </div>
                  ))}
                </div>

                {/* Description */}
                <div>
                  <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-2">About this Vehicle</h2>
                  <p className="text-sm text-slate-600 leading-relaxed">{vehicle.description}</p>
                </div>
              </div>

              {/* Features */}
              <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
                <h2 className="text-sm font-bold text-slate-700 uppercase tracking-wider mb-4">Key Features</h2>
                <div className="flex flex-wrap gap-3">
                  {vehicle.features.map((f) => (
                    <div key={f} className="flex items-center gap-2 bg-blue-50 text-blue-700 text-sm font-medium px-3 py-1.5 rounded-lg">
                      <CheckCircle2 size={14} />
                      {f}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right: Booking panel */}
            <div className="lg:col-span-1">
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden sticky top-24">
                <div className="bg-blue-600 px-5 py-4">
                  <p className="text-blue-100 text-sm">Rental Price</p>
                  <p className="text-white text-3xl font-bold">
                    ₹{vehicle.pricePerDay.toLocaleString()}
                    <span className="text-blue-200 text-base font-normal">/day</span>
                  </p>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      <Calendar size={12} className="inline mr-1" />Pickup Date
                    </label>
                    <input
                      id="details-pickup-date"
                      type="date"
                      value={pickupDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setPickupDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-wide mb-1.5">
                      <Calendar size={12} className="inline mr-1" />Return Date
                    </label>
                    <input
                      id="details-return-date"
                      type="date"
                      value={returnDate}
                      min={pickupDate || new Date().toISOString().split('T')[0]}
                      onChange={(e) => setReturnDate(e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {days > 0 && (
                    <div className="bg-blue-50 rounded-xl p-3 space-y-1.5">
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">₹{vehicle.pricePerDay.toLocaleString()} × {days} {days === 1 ? 'day' : 'days'}</span>
                        <span className="font-medium">₹{(vehicle.pricePerDay * days).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-slate-500">Insurance</span>
                        <span className="font-medium">₹{(200 * days).toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between text-sm font-bold border-t border-blue-200 pt-1.5">
                        <span>Total</span>
                        <span className="text-blue-600">₹{((vehicle.pricePerDay + 200) * days).toLocaleString()}</span>
                      </div>
                    </div>
                  )}

                  <Link
                    to={vehicle.available ? `/booking?vehicle=${vehicle.id}` : '#'}
                    id="details-book-btn"
                    className={`block w-full text-center py-3 font-bold text-sm rounded-xl transition-all ${
                      vehicle.available
                        ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-md hover:shadow-blue-200'
                        : 'bg-slate-200 text-slate-400 cursor-not-allowed'
                    }`}
                    onClick={(e) => !vehicle.available && e.preventDefault()}
                  >
                    {vehicle.available ? 'Book Now' : 'Not Available'}
                  </Link>
                  <p className="text-xs text-slate-400 text-center">Free cancellation up to 24 hrs before pickup</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
