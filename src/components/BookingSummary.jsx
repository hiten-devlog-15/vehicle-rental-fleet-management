// BookingSummary — right-panel price breakdown for the Booking page

import { Car, Calendar, MapPin, IndianRupee } from 'lucide-react';

export default function BookingSummary({ vehicle, pickupDate, returnDate, pickupLocation }) {
  const calcDays = () => {
    if (!pickupDate || !returnDate) return 0;
    const diff = new Date(returnDate) - new Date(pickupDate);
    return Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 0);
  };

  const days = calcDays();
  const pricePerDay = vehicle?.pricePerDay || 0;
  const subtotal = days * pricePerDay;
  const insurance = days > 0 ? 200 * days : 0;
  const total = subtotal + insurance;

  const formatDate = (d) => {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden sticky top-24">
      {/* Header */}
      <div className="bg-blue-600 px-5 py-4">
        <h3 className="text-white font-bold text-lg">Booking Summary</h3>
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

      {/* Price breakdown */}
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
      </div>
    </div>
  );
}
