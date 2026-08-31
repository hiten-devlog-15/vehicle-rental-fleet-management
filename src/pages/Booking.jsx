// Booking.jsx — Experiment 2: useEffect for document title
import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import BookingForm from '../components/BookingForm';
import BookingSummary from '../components/BookingSummary';
import { useVehicles } from '../hooks/useVehicles';

export default function Booking() {
  const [searchParams] = useSearchParams();
  const vehicleId = searchParams.get('vehicle') || '';
  const { vehicles } = useVehicles();

  const [formData, setFormData] = useState({
    vehicleId,
    pickupDate: '',
    returnDate: '',
    pickupLocation: '',
  });

  const selectedVehicle = vehicles.find((v) => v.id === formData.vehicleId) || null;

  // useEffect — document title (Experiment 2)
  useEffect(() => {
    document.title = 'DriveFleet | Book a Vehicle';
    return () => { document.title = 'DriveFleet'; };
  }, []);

  // useEffect — update title when vehicle is selected (Experiment 2)
  useEffect(() => {
    if (selectedVehicle) {
      document.title = `DriveFleet | Booking — ${selectedVehicle.name}`;
    } else {
      document.title = 'DriveFleet | Book a Vehicle';
    }
  }, [selectedVehicle]);

  const handleFormChange = (data) => {
    setFormData({
      vehicleId: data.vehicleId,
      pickupDate: data.pickupDate,
      returnDate: data.returnDate,
      pickupLocation: data.pickupLocation,
    });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-1">Book a Vehicle</h1>
          <p className="text-slate-400 text-sm">Fill in the details below to confirm your reservation.</p>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
            {/* Booking Form — takes 2/3 width on desktop */}
            <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-slate-200 p-6 sm:p-8">
              <div className="flex items-center gap-3 mb-6 pb-5 border-b border-slate-100">
                <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                <h2 className="text-lg font-bold text-slate-800">Customer &amp; Vehicle Details</h2>
              </div>
              <BookingForm
                initialVehicleId={vehicleId}
                onFormChange={handleFormChange}
              />
            </div>

            {/* Summary — BookingSummary uses useEffect to auto-calculate cost */}
            <div className="lg:col-span-1">
              <BookingSummary
                vehicle={selectedVehicle}
                pickupDate={formData.pickupDate}
                returnDate={formData.returnDate}
                pickupLocation={formData.pickupLocation}
              />
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
}
