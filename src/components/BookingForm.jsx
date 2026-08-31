import { useState, useEffect } from 'react';
import Button from './Button';
import { useVehicles } from '../hooks/useVehicles';
import { useBookings } from '../hooks/useBookings';
import { useAuth } from '../hooks/useAuth';

function Field({ label, id, error, children }) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-slate-700 mb-1.5">
        {label}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

const inputCls =
  'w-full px-3.5 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all placeholder-slate-400 bg-white';

export default function BookingForm({ initialVehicleId, onFormChange }) {
  const { vehicles } = useVehicles();
  const { addBooking } = useBookings();
  const { user } = useAuth();

  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: '',
    vehicleId: initialVehicleId || '',
    pickupDate: '',
    returnDate: '',
    pickupLocation: '',
    notes: '',
  });

  const [errors, setErrors] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [lastBookingId, setLastBookingId] = useState('');

  // Sync form name and email if user changes
  useEffect(() => {
    if (user) {
      setForm((prev) => ({
        ...prev,
        name: user.name,
        email: user.email,
      }));
    }
  }, [user]);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required.';
    if (!form.email.trim()) e.email = 'Email is required.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email)) e.email = 'Enter a valid email.';
    if (!form.phone.trim()) e.phone = 'Phone number is required.';
    else if (!/^\+?[\d\s-]{10,}$/.test(form.phone)) e.phone = 'Enter a valid phone number.';
    if (!form.vehicleId) e.vehicleId = 'Please select a vehicle.';
    if (!form.pickupDate) e.pickupDate = 'Pickup date is required.';
    if (!form.returnDate) e.returnDate = 'Return date is required.';
    else if (form.pickupDate && form.returnDate <= form.pickupDate)
      e.returnDate = 'Return date must be after pickup date.';
    if (!form.pickupLocation.trim()) e.pickupLocation = 'Pickup location is required.';
    return e;
  };

  const handleChange = (field, value) => {
    const updated = { ...form, [field]: value };
    setForm(updated);
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
    if (onFormChange) onFormChange(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    
    const selectedVeh = vehicles.find((v) => v.id === form.vehicleId);
    const diff = new Date(form.returnDate) - new Date(form.pickupDate);
    const days = Math.max(Math.ceil(diff / (1000 * 60 * 60 * 24)), 1);
    const pricePerDay = selectedVeh?.pricePerDay || 0;
    const totalAmount = (pricePerDay + 200) * days;
    const bookingId = `BK-${Math.floor(Math.random() * 90000) + 10000}`;

    addBooking({
      id: bookingId,
      customerId: user?.id || 'C001',
      customerName: form.name,
      customerEmail: form.email,
      customerPhone: form.phone,
      vehicleId: form.vehicleId,
      vehicleName: selectedVeh?.name || 'Unknown Vehicle',
      vehicleType: selectedVeh?.type || 'Unknown Type',
      pickupDate: form.pickupDate,
      returnDate: form.returnDate,
      days,
      pricePerDay,
      totalAmount,
      pickupLocation: form.pickupLocation,
      status: 'Confirmed',
      bookingDate: new Date().toISOString().split('T')[0],
      notes: form.notes,
    });

    setLastBookingId(bookingId);
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-8 text-center">
        <p className="text-5xl mb-4">🎉</p>
        <h3 className="text-xl font-bold text-emerald-700">Booking Confirmed!</h3>
        <p className="text-slate-600 mt-2">
          Your booking reference is{' '}
          <span className="font-mono font-bold text-blue-600">
            {lastBookingId}
          </span>
          . A confirmation has been sent to <strong>{form.email}</strong>.
        </p>
        <button
          onClick={() => { setSubmitted(false); setForm({ name: user?.name || '', email: user?.email || '', phone: '', vehicleId: initialVehicleId || '', pickupDate: '', returnDate: '', pickupLocation: '', notes: '' }); }}
          className="mt-6 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
        >
          Make Another Booking
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Full Name *" id="booking-name" error={errors.name}>
          <input
            id="booking-name"
            type="text"
            value={form.name}
            onChange={(e) => handleChange('name', e.target.value)}
            placeholder="Arjun Sharma"
            className={`${inputCls} ${errors.name ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
        </Field>
        <Field label="Email Address *" id="booking-email" error={errors.email}>
          <input
            id="booking-email"
            type="email"
            value={form.email}
            onChange={(e) => handleChange('email', e.target.value)}
            placeholder="arjun@email.com"
            className={`${inputCls} ${errors.email ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Phone Number *" id="booking-phone" error={errors.phone}>
          <input
            id="booking-phone"
            type="tel"
            value={form.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            placeholder="+91 98765 43210"
            className={`${inputCls} ${errors.phone ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
        </Field>
        <Field label="Select Vehicle *" id="booking-vehicle" error={errors.vehicleId}>
          <select
            id="booking-vehicle"
            value={form.vehicleId}
            onChange={(e) => handleChange('vehicleId', e.target.value)}
            className={`${inputCls} ${errors.vehicleId ? 'border-red-400 focus:ring-red-400' : ''}`}
          >
            <option value="">Choose a vehicle...</option>
            {vehicles.filter((v) => v.available).map((v) => (
              <option key={v.id} value={v.id}>
                {v.name} — ₹{v.pricePerDay}/day
              </option>
            ))}
          </select>
        </Field>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
        <Field label="Pickup Date *" id="booking-pickup-date" error={errors.pickupDate}>
          <input
            id="booking-pickup-date"
            type="date"
            value={form.pickupDate}
            min={new Date().toISOString().split('T')[0]}
            onChange={(e) => handleChange('pickupDate', e.target.value)}
            className={`${inputCls} ${errors.pickupDate ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
        </Field>
        <Field label="Return Date *" id="booking-return-date" error={errors.returnDate}>
          <input
            id="booking-return-date"
            type="date"
            value={form.returnDate}
            min={form.pickupDate || new Date().toISOString().split('T')[0]}
            onChange={(e) => handleChange('returnDate', e.target.value)}
            className={`${inputCls} ${errors.returnDate ? 'border-red-400 focus:ring-red-400' : ''}`}
          />
        </Field>
      </div>

      <Field label="Pickup Location *" id="booking-location" error={errors.pickupLocation}>
        <input
          id="booking-location"
          type="text"
          value={form.pickupLocation}
          onChange={(e) => handleChange('pickupLocation', e.target.value)}
          placeholder="e.g., Mumbai Airport Terminal 2, Andheri West"
          className={`${inputCls} ${errors.pickupLocation ? 'border-red-400 focus:ring-red-400' : ''}`}
        />
      </Field>

      <Field label="Additional Notes (optional)" id="booking-notes" error={null}>
        <textarea
          id="booking-notes"
          rows={3}
          value={form.notes}
          onChange={(e) => handleChange('notes', e.target.value)}
          placeholder="Any special requirements, preferred driver, etc."
          className={`${inputCls} resize-none`}
        />
      </Field>

      <Button type="submit" fullWidth size="lg">
        Confirm Booking
      </Button>
    </form>
  );
}
