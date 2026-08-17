import VehicleCard from './VehicleCard';

export default function VehicleGrid({ vehicles, loading = false }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="bg-white rounded-2xl border border-slate-200 overflow-hidden animate-pulse">
            <div className="h-48 bg-slate-200" />
            <div className="p-4 space-y-3">
              <div className="h-4 bg-slate-200 rounded w-3/4" />
              <div className="grid grid-cols-3 gap-2">
                <div className="h-12 bg-slate-100 rounded-lg" />
                <div className="h-12 bg-slate-100 rounded-lg" />
                <div className="h-12 bg-slate-100 rounded-lg" />
              </div>
              <div className="h-8 bg-slate-200 rounded-lg" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!vehicles || vehicles.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-6xl mb-4">🚗</p>
        <p className="text-xl font-semibold text-slate-700">No vehicles found</p>
        <p className="text-slate-500 mt-2">Try adjusting your filters or search query.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {vehicles.map((vehicle) => (
        <VehicleCard key={vehicle.id} vehicle={vehicle} />
      ))}
    </div>
  );
}
