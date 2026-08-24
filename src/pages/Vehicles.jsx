// Vehicles.jsx — Experiment 2
// Demonstrates:
//   - useFetch() custom hook (loads vehicle data with loading/error states)
//   - useEffect() for document title

import { useState, useEffect } from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import VehicleGrid from '../components/VehicleGrid';
import SearchBar from '../components/SearchBar';
import { mockVehicles } from '../data/mockVehicles';
import { useFetch } from '../hooks/useFetch';
import { SlidersHorizontal, ChevronDown, Loader2, AlertCircle } from 'lucide-react';

const fuelTypes = ['All', 'Petrol', 'Diesel', 'Electric'];
const transmissions = ['All', 'Automatic', 'Manual'];
const sortOptions = [
  { value: 'default', label: 'Default' },
  { value: 'price-asc', label: 'Price: Low to High' },
  { value: 'price-desc', label: 'Price: High to Low' },
  { value: 'rating', label: 'Top Rated' },
];

export default function Vehicles() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('all');
  const [fuelFilter, setFuelFilter] = useState('All');
  const [transmissionFilter, setTransmissionFilter] = useState('All');
  const [availableOnly, setAvailableOnly] = useState(false);
  const [sortBy, setSortBy] = useState('default');
  const [showFilters, setShowFilters] = useState(false);

  // useFetch — Custom Hook (Experiment 2)
  // Simulates loading vehicle data asynchronously from our mock data source.
  const { data: vehicles, loading, error } = useFetch(mockVehicles);

  // useEffect — document title (Experiment 2)
  useEffect(() => {
    document.title = 'DriveFleet | Vehicles';
    return () => { document.title = 'DriveFleet'; };
  }, []);

  // Filter and sort after data has loaded
  const filtered = (vehicles || [])
    .filter((v) => {
      const q = searchQuery.toLowerCase();
      const matchQuery =
        !q ||
        v.name.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.brand.toLowerCase().includes(q);
      const matchCategory = activeCategory === 'all' || v.type === activeCategory || v.type.includes(activeCategory);
      const matchFuel = fuelFilter === 'All' || v.fuel === fuelFilter;
      const matchTransmission = transmissionFilter === 'All' || v.transmission === transmissionFilter;
      const matchAvailable = !availableOnly || v.available;
      return matchQuery && matchCategory && matchFuel && matchTransmission && matchAvailable;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.pricePerDay - b.pricePerDay;
      if (sortBy === 'price-desc') return b.pricePerDay - a.pricePerDay;
      if (sortBy === 'rating') return b.rating - a.rating;
      return 0;
    });

  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />

      {/* Page header */}
      <div className="bg-gradient-to-r from-slate-800 to-slate-900 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h1 className="text-3xl font-bold text-white mb-2">Available Vehicles</h1>
          <p className="text-slate-400 text-sm">
            {loading
              ? 'Loading vehicle catalogue...'
              : error
              ? 'Unable to load vehicles'
              : `Showing ${filtered.length} of ${vehicles.length} vehicles`}
          </p>
        </div>
      </div>

      <div className="flex-1 bg-slate-50 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

          {/* ── Loading state (useFetch loading) ── */}
          {loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <Loader2 size={48} className="text-blue-500 animate-spin" />
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700">Loading vehicles...</p>
                <p className="text-sm text-slate-400 mt-1">Fetching vehicle catalogue</p>
              </div>
              {/* Skeleton cards for better UX */}
              <div className="w-full mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                {[...Array(8)].map((_, i) => (
                  <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
                    <div className="h-44 bg-slate-200" />
                    <div className="p-4 space-y-3">
                      <div className="h-4 bg-slate-200 rounded w-3/4" />
                      <div className="h-3 bg-slate-200 rounded w-1/2" />
                      <div className="h-8 bg-slate-200 rounded w-full mt-2" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Error state (useFetch error) ── */}
          {error && !loading && (
            <div className="flex flex-col items-center justify-center py-24 gap-4">
              <div className="p-4 bg-red-100 rounded-full">
                <AlertCircle size={40} className="text-red-500" />
              </div>
              <div className="text-center">
                <p className="text-lg font-semibold text-slate-700">Unable to load vehicles.</p>
                <p className="text-sm text-slate-400 mt-1">{error}</p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold rounded-xl transition-colors"
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* ── Loaded state ── */}
          {!loading && !error && vehicles && (
            <>
              {/* Search & filters bar */}
              <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-4 mb-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <SearchBar
                      onSearch={setSearchQuery}
                      activeCategory={activeCategory}
                      onCategoryChange={setActiveCategory}
                    />
                  </div>
                  <div className="flex items-start gap-3 flex-wrap">
                    {/* Sort */}
                    <div className="relative">
                      <select
                        id="vehicles-sort"
                        value={sortBy}
                        onChange={(e) => setSortBy(e.target.value)}
                        className="appearance-none pl-3 pr-8 py-2.5 text-sm border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                      >
                        {sortOptions.map((o) => (
                          <option key={o.value} value={o.value}>{o.label}</option>
                        ))}
                      </select>
                      <ChevronDown size={14} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
                    </div>
                    {/* Filter toggle */}
                    <button
                      id="vehicles-filter-toggle"
                      onClick={() => setShowFilters(!showFilters)}
                      className={`flex items-center gap-2 px-3 py-2.5 text-sm font-medium border rounded-xl transition-colors ${showFilters ? 'bg-blue-50 border-blue-400 text-blue-600' : 'border-slate-300 text-slate-600 hover:bg-slate-50'}`}
                    >
                      <SlidersHorizontal size={15} />
                      Filters
                    </button>
                  </div>
                </div>

                {/* Expanded filters */}
                {showFilters && (
                  <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-1 sm:grid-cols-3 gap-4">
                    {/* Fuel type */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Fuel Type</p>
                      <div className="flex flex-wrap gap-2">
                        {fuelTypes.map((f) => (
                          <button
                            key={f}
                            id={`filter-fuel-${f}`}
                            onClick={() => setFuelFilter(f)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${fuelFilter === f ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Transmission */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Transmission</p>
                      <div className="flex flex-wrap gap-2">
                        {transmissions.map((t) => (
                          <button
                            key={t}
                            id={`filter-trans-${t}`}
                            onClick={() => setTransmissionFilter(t)}
                            className={`px-3 py-1 text-xs font-medium rounded-full border transition-colors ${transmissionFilter === t ? 'bg-blue-600 text-white border-blue-600' : 'border-slate-300 text-slate-600 hover:border-blue-400'}`}
                          >
                            {t}
                          </button>
                        ))}
                      </div>
                    </div>
                    {/* Availability */}
                    <div>
                      <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">Availability</p>
                      <label className="flex items-center gap-2 cursor-pointer">
                        <input
                          id="filter-available-only"
                          type="checkbox"
                          checked={availableOnly}
                          onChange={(e) => setAvailableOnly(e.target.checked)}
                          className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-slate-700">Available only</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              <VehicleGrid vehicles={filtered} />
            </>
          )}
        </div>
      </div>

      <Footer />
    </div>
  );
}
