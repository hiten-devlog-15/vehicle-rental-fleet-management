import { useState } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { vehicleCategories } from '../data/vehicles';

export default function SearchBar({ onSearch, onFilter, activeCategory, onCategoryChange }) {
  const [query, setQuery] = useState('');

  const handleSearch = (value) => {
    setQuery(value);
    if (onSearch) onSearch(value);
  };

  const handleClear = () => {
    setQuery('');
    if (onSearch) onSearch('');
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Search input */}
      <div className="relative">
        <Search
          size={18}
          className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none"
        />
        <input
          id="vehicle-search-input"
          type="text"
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search by name, type, or brand..."
          className="w-full pl-10 pr-10 py-2.5 text-sm bg-white border border-slate-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent placeholder-slate-400 transition-all"
        />
        {query && (
          <button
            onClick={handleClear}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            <X size={16} />
          </button>
        )}
      </div>

      {/* Category pills */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
        {vehicleCategories.map((cat) => (
          <button
            key={cat.id}
            id={`filter-${cat.id}`}
            onClick={() => onCategoryChange && onCategoryChange(cat.id)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all duration-200 ${
              activeCategory === cat.id
                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                : 'bg-white text-slate-600 border border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
          >
            <span>{cat.icon}</span>
            {cat.label}
          </button>
        ))}
      </div>
    </div>
  );
}
