import { Link } from 'react-router-dom';
import { Star, Fuel, Settings, Users, CheckCircle, XCircle } from 'lucide-react';
import StatusBadge from './StatusBadge';

export default function VehicleCard({ vehicle }) {
  const {
    id,
    name,
    type,
    image,
    fuel,
    transmission,
    seats,
    pricePerDay,
    rating,
    reviews,
    available,
    status,
  } = vehicle;

  return (
    <div
      id={`vehicle-card-${id}`}
      className="group bg-white rounded-2xl overflow-hidden border border-slate-200 shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
    >
      {/* Image */}
      <div className="relative overflow-hidden h-48">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          onError={(e) => {
            e.target.src = `https://placehold.co/400x250/e2e8f0/64748b?text=${encodeURIComponent(name)}`;
          }}
        />
        <div className="absolute top-3 left-3">
          <span className="text-xs font-semibold bg-white/90 backdrop-blur text-slate-700 px-2.5 py-1 rounded-full">
            {type}
          </span>
        </div>
        <div className="absolute top-3 right-3">
          <StatusBadge status={status || (available ? 'Available' : 'Booked')} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <div className="flex items-start justify-between mb-3">
          <h3 className="text-base font-bold text-slate-800 group-hover:text-blue-600 transition-colors">
            {name}
          </h3>
          <div className="flex items-center gap-1 text-amber-500 shrink-0">
            <Star size={13} fill="currentColor" />
            <span className="text-xs font-semibold text-slate-700">{rating}</span>
            <span className="text-xs text-slate-400">({reviews})</span>
          </div>
        </div>

        {/* Specs */}
        <div className="grid grid-cols-3 gap-2 mb-4">
          <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-lg p-2">
            <Fuel size={14} className="text-blue-500" />
            <span className="text-xs text-slate-500 text-center leading-tight">{fuel}</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-lg p-2">
            <Settings size={14} className="text-blue-500" />
            <span className="text-xs text-slate-500 text-center leading-tight">{transmission}</span>
          </div>
          <div className="flex flex-col items-center gap-1 bg-slate-50 rounded-lg p-2">
            <Users size={14} className="text-blue-500" />
            <span className="text-xs text-slate-500 text-center leading-tight">{seats} Seats</span>
          </div>
        </div>

        {/* Price + Actions */}
        <div className="flex items-center justify-between mb-3">
          <div>
            <span className="text-xl font-bold text-blue-600">₹{pricePerDay.toLocaleString()}</span>
            <span className="text-xs text-slate-400">/day</span>
          </div>
        </div>

        <div className="flex gap-2">
          <Link
            to={`/vehicles/${id}`}
            id={`vehicle-details-${id}`}
            className="flex-1 text-center text-sm font-semibold py-2 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-50 hover:border-slate-400 transition-colors"
          >
            View Details
          </Link>
          <Link
            to={available ? `/booking?vehicle=${id}` : '#'}
            id={`vehicle-book-${id}`}
            className={`flex-1 text-center text-sm font-semibold py-2 rounded-lg transition-colors ${
              available
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
            onClick={(e) => !available && e.preventDefault()}
          >
            Book Now
          </Link>
        </div>
      </div>
    </div>
  );
}
