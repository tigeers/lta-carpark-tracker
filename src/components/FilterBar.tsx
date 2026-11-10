import React from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { CarparkFilterState } from '../types/carpark';

interface FilterBarProps {
  filter: CarparkFilterState;
  setFilter: React.Dispatch<React.SetStateAction<CarparkFilterState>>;
  totalCount: number;
  filteredCount: number;
}

export const FilterBar: React.FC<FilterBarProps> = ({
  filter,
  setFilter,
  totalCount,
  filteredCount,
}) => {
  const areas = [
    'all',
    'Central / Orchard',
    'Downtown / Marina',
    'East / Tampines & Bedok',
    'West / Jurong & Clementi',
    'North / Woodlands & Yishun',
    'North-East / Punggol & Hougang',
  ];

  const agencies = ['all', 'HDB', 'URA', 'Commercial'];

  const resetFilters = () => {
    setFilter({
      searchQuery: '',
      area: 'all',
      agency: 'all',
      vehicleType: 'all',
      availabilityStatus: 'all',
      minGantryHeight: 0,
      freeParkingOnly: false,
      evChargingOnly: false,
      sortBy: 'availability',
    });
  };

  const hasActiveFilters =
    filter.searchQuery !== '' ||
    filter.area !== 'all' ||
    filter.agency !== 'all' ||
    filter.vehicleType !== 'all' ||
    filter.availabilityStatus !== 'all' ||
    filter.minGantryHeight > 0 ||
    filter.freeParkingOnly ||
    filter.evChargingOnly;

  return (
    <div className="flex flex-col gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
      {/* Search Input and Primary Sort */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={filter.searchQuery}
            onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
            placeholder="Search carpark code (e.g. ACB, TP24), mall, street, or area..."
            className="w-full pl-10 pr-9 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 transition-all"
          />
          {filter.searchQuery && (
            <button
              onClick={() => setFilter((prev) => ({ ...prev, searchQuery: '' }))}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Sort Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs text-slate-500 dark:text-slate-400 whitespace-nowrap">Sort by</span>
          <select
            value={filter.sortBy}
            onChange={(e) => setFilter((prev) => ({ ...prev, sortBy: e.target.value as any }))}
            className="px-3 py-2 text-xs font-medium bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-700 dark:text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="availability">Highest Vacancy %</option>
            <option value="lots">Most Available Lots</option>
            <option value="name">Name (A - Z)</option>
          </select>

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1 px-3 py-2 text-xs text-rose-600 hover:text-rose-700 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-xl transition-colors whitespace-nowrap"
            >
              <X className="w-3 h-3" />
              <span>Reset</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter Chips / Controls Row */}
      <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
        {/* Area dropdown */}
        <select
          value={filter.area}
          onChange={(e) => setFilter((prev) => ({ ...prev, area: e.target.value }))}
          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Planning Areas</option>
          {areas.filter((a) => a !== 'all').map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </select>

        {/* Agency dropdown */}
        <select
          value={filter.agency}
          onChange={(e) => setFilter((prev) => ({ ...prev, agency: e.target.value }))}
          className="px-2.5 py-1.5 bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-700 dark:text-slate-200 focus:outline-none"
        >
          <option value="all">All Agencies (HDB / URA / Commercial)</option>
          {agencies.filter((ag) => ag !== 'all').map((ag) => (
            <option key={ag} value={ag}>
              {ag}
            </option>
          ))}
        </select>

        {/* Vehicle filter segmented tabs */}
        <div className="flex items-center gap-1 p-0.5 bg-slate-100 dark:bg-slate-800 rounded-lg">
          <button
            onClick={() => setFilter((prev) => ({ ...prev, vehicleType: 'all' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter.vehicleType === 'all'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            All Vehicles
          </button>
          <button
            onClick={() => setFilter((prev) => ({ ...prev, vehicleType: 'car' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter.vehicleType === 'car'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Cars
          </button>
          <button
            onClick={() => setFilter((prev) => ({ ...prev, vehicleType: 'motorcycle' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter.vehicleType === 'motorcycle'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            Motorcycles
          </button>
          <button
            onClick={() => setFilter((prev) => ({ ...prev, vehicleType: 'ev' }))}
            className={`px-2.5 py-1 rounded-md font-medium transition-colors ${
              filter.vehicleType === 'ev'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            EV Charging
          </button>
        </div>

        {/* Toggles */}
        <button
          onClick={() => setFilter((prev) => ({ ...prev, freeParkingOnly: !prev.freeParkingOnly }))}
          className={`px-2.5 py-1.5 rounded-lg border font-medium transition-colors ${
            filter.freeParkingOnly
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-300 dark:border-emerald-700 text-emerald-800 dark:text-emerald-300'
              : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
          }`}
        >
          Free Sun / PH Only
        </button>

        {/* Unboxed scannable metadata counter */}
        <div className="ml-auto text-xs text-slate-500 dark:text-slate-400">
          <span>Showing {filteredCount}</span>
          <span aria-hidden="true" className="mx-1">·</span>
          <span>{totalCount} total locations</span>
        </div>
      </div>
    </div>
  );
};
