import React from 'react';
import { Carpark } from '../types/carpark';
import { CarparkCard } from './CarparkCard';
import { Inbox, Car, Zap, ShieldAlert } from 'lucide-react';

interface CarparkListProps {
  carparks: Carpark[];
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
  onSelectCarpark: (carpark: Carpark) => void;
  onViewOnMap: (carpark: Carpark) => void;
  onResetFilters: () => void;
  totalLotsCount: number;
  availableLotsCount: number;
}

export const CarparkList: React.FC<CarparkListProps> = ({
  carparks,
  favorites,
  onToggleFavorite,
  onSelectCarpark,
  onViewOnMap,
  onResetFilters,
  totalLotsCount,
  availableLotsCount,
}) => {
  const overallRatio = Math.round((availableLotsCount / Math.max(1, totalLotsCount)) * 100);

  return (
    <div className="flex flex-col gap-5">
      {/* Overview Stat Strip */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl">
        <div className="flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400">Total Singapore Lots</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
            {totalLotsCount.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400">Currently Vacant</span>
          <span className="text-xl font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums mt-0.5">
            {availableLotsCount.toLocaleString()}
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400">Island-wide Vacancy Rate</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
            {overallRatio}%
          </span>
        </div>

        <div className="flex flex-col">
          <span className="text-xs text-slate-500 dark:text-slate-400">Carparks Filtered</span>
          <span className="text-xl font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
            {carparks.length}
          </span>
        </div>
      </div>

      {/* Empty State */}
      {carparks.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 px-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl text-center">
          <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full mb-3 text-slate-400">
            <Inbox className="w-8 h-8" />
          </div>
          <h3 className="text-base font-semibold text-slate-900 dark:text-white">
            No carparks matched your criteria
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mt-1">
            Try adjusting your search keywords, area filters, or vehicle specifications.
          </p>
          <button
            onClick={onResetFilters}
            className="mt-4 px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            Clear All Filters
          </button>
        </div>
      ) : (
        /* Grid of Carparks */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {carparks.map((carpark) => (
            <CarparkCard
              key={carpark.id}
              carpark={carpark}
              isFavorite={favorites.has(carpark.id)}
              onToggleFavorite={onToggleFavorite}
              onSelect={onSelectCarpark}
              onViewOnMap={onViewOnMap}
            />
          ))}
        </div>
      )}
    </div>
  );
};
