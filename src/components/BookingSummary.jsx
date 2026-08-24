// BookingSummary.jsx — Experiment 2
// Uses useEffect to automatically recalculate rental cost whenever
// pickupDate, returnDate, or vehicle changes — demonstrating reactive computation.

import { useState, useEffect } from 'react';
import { Car, Calendar, MapPin } from 'lucide-react';

export default function BookingSummary({ vehicle, pickupDate, returnDate, pickupLocation }) {
  // useEffect (Experiment 2) — automatically recalculate whenever inputs change
  const [days, setDays] = useState(0);
  const [subtotal, setSubtotal] = useState(0);
  const [insurance, setInsurance] = useState(0);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    // Recalculate whenever pickup date, return date, or vehicle changes
    const calcDays = () => {
      if (!pickupDate || !returnDate) return 0;
      const diff = new Date(returnDate) - new Date(pickupDate);
      return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
    };

    const d = calcDays();
    const pricePerDay = vehicle?.pricePerDay || 0;
    const sub = d * pricePerDay;
    const ins = d > 0 ? 200 * d : 0;

    setDays(d);
    setSubtotal(sub);
    setInsurance(ins);
    setTotal(sub + ins);
  }, [pickupDate, returnDate, vehicle]); // dependency array — re-runs on any change

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const pricePerDay = vehicle?.pricePerDay || 0;

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-24">
      {/* Header */}
      <div className="bg-blue-600 px-5 py-4">
        <h3 className="text-white font-bold text-lg">Booking Summary</h3>
        {/* Experiment 2 label */}
        <p className="text-blue-200 text-xs mt-0.5">Auto-calculated via useEffect ↻</p>
      </div>

      {/* Vehicle info */}
      {vehicle ? (
        <div className="p-5 border-b border-slate-100">
          <div className="flex gap-3 items-center">
            <img
              src={vehicle.image}
              alt={vehicle.name}
              className="w-20 h-14 object-cover rounded-lg"
              onError={(e) => { e.target.src = 'https://placehold.co/80x56/e2e8f0/64748b?text=Car'; }}
            />
            <div>
              <p className="font-bold text-slate-800">{vehicle.name}</p>
              <p className="text-sm text-slate-500">{vehicle.type} · {vehicle.transmission}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-5 border-b border-slate-100">
          <div className="flex items-center gap-3 text-slate-400">
            <Car size={20} />
            <span className="text-sm">No vehicle selected</span>
          </div>
        </div>
      )}

      {/* Trip details */}
      <div className="p-5 border-b border-slate-100 space-y-3">
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Pickup</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(pickupDate)}</p>
          </div>
        </div>
        <div className="flex items-start gap-3">
          <Calendar size={16} className="text-blue-500 mt-0.5 shrink-0" />
          <div>
            <p className="text-xs text-slate-400">Return</p>
            <p className="text-sm font-medium text-slate-700">{formatDate(returnDate)}</p>
          </div>
        </div>
        {pickupLocation && (
          <div className="flex items-start gap-3">
            <MapPin size={16} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs text-slate-400">Location</p>
              <p className="text-sm font-medium text-slate-700">{pickupLocation}</p>
            </div>
          </div>
        )}
      </div>

      {/* Price breakdown — auto-updates via useEffect */}
      <div className="p-5 space-y-3">
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Rental ({days} {days === 1 ? 'day' : 'days'})</span>
          <span className="font-medium text-slate-700">₹{subtotal.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Price per day</span>
          <span className="font-medium text-slate-700">₹{pricePerDay.toLocaleString()}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span className="text-slate-500">Insurance</span>
          <span className="font-medium text-slate-700">₹{insurance.toLocaleString()}</span>
        </div>
        <div className="border-t border-slate-200 pt-3 flex justify-between">
          <span className="font-bold text-slate-800">Total Amount</span>
          <span className="text-xl font-bold text-blue-600">
            ₹{total.toLocaleString()}
          </span>
        </div>
        {days === 0 && (
          <p className="text-xs text-amber-600 bg-amber-50 rounded-lg px-3 py-2">
            Please select pickup and return dates to see the price.
          </p>
        )}
        {days > 0 && (
          <div className="bg-emerald-50 border border-emerald-100 rounded-lg px-3 py-2">
            <p className="text-xs text-emerald-700 font-medium">
              ✓ Rental Duration: <strong>{days} {days === 1 ? 'day' : 'days'}</strong>
            </p>
            <p className="text-xs text-emerald-600 mt-0.5">Total auto-calculated by useEffect</p>
          </div>
        )}
      </div>
    </div>
  );
}
