import React from 'react';
import { Carpark } from '../types/carpark';
import { MapPin, Navigation, Zap, Shield, Star, Clock } from 'lucide-react';

interface CarparkCardProps {
  carpark: Carpark;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onSelect: (carpark: Carpark) => void;
  onViewOnMap: (carpark: Carpark) => void;
}

export const CarparkCard: React.FC<CarparkCardProps> = ({
  carpark,
  isFavorite,
  onToggleFavorite,
  onSelect,
  onViewOnMap,
}) => {
  const ratio = Math.round((carpark.carLots.available / Math.max(1, carpark.carLots.total)) * 100);

  const getStatusBadge = () => {
    if (ratio >= 25) {
      return {
        label: 'Vacant',
        color: 'text-emerald-700 dark:text-emerald-300',
        bar: 'bg-emerald-500',
      };
    }
    if (ratio >= 8) {
      return {
        label: 'Limited',
        color: 'text-amber-700 dark:text-amber-300',
        bar: 'bg-amber-500',
      };
    }
    return {
      label: 'Critical / Full',
      color: 'text-rose-700 dark:text-rose-300',
      bar: 'bg-rose-500',
    };
  };

  const status = getStatusBadge();

  return (
    <div className="flex flex-col justify-between p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs group">
      <div>
        {/* Unboxed Metadata Header */}
        <div className="flex items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-1.5 truncate">
            <span className="font-semibold text-slate-700 dark:text-slate-300">{carpark.agency}</span>
            <span aria-hidden="true">·</span>
            <span>{carpark.area.split('/')[0].trim()}</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono">{carpark.id}</span>
          </div>

          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleFavorite(carpark.id);
            }}
            className={`p-1 rounded-md transition-colors ${
              isFavorite
                ? 'text-amber-500 hover:text-amber-600'
                : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
            }`}
            title={isFavorite ? 'Remove from favorites' : 'Add to favorites'}
          >
            <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
          </button>
        </div>

        {/* Carpark Title */}
        <h3
          onClick={() => onSelect(carpark)}
          className="text-base font-bold text-slate-900 dark:text-white mt-1 group-hover:text-emerald-600 dark:group-hover:text-emerald-400 cursor-pointer transition-colors line-clamp-1"
        >
          {carpark.name}
        </h3>

        {/* Address */}
        <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 line-clamp-1">
          {carpark.address}
        </p>

        {/* Live Lots Availability Section */}
        <div className="mt-4 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-baseline justify-between">
            <div className="flex flex-col">
              <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">Available Car Lots</span>
              <div className="flex items-baseline gap-1 font-mono">
                <span className="text-2xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                  {carpark.carLots.available}
                </span>
                <span className="text-xs text-slate-400 tabular-nums">/ {carpark.carLots.total}</span>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-semibold ${status.color}`}>
                {status.label}
              </span>
              <div className="text-xs font-mono text-slate-500 dark:text-slate-400 tabular-nums">
                {ratio}% free
              </div>
            </div>
          </div>

          {/* Availability progress bar */}
          <div className="w-full h-1.5 bg-slate-200 dark:bg-slate-700 rounded-full mt-2.5 overflow-hidden">
            <div
              className={`h-full ${status.bar} transition-all duration-500`}
              style={{ width: `${Math.min(100, Math.max(3, ratio))}%` }}
            />
          </div>
        </div>

        {/* Secondary Amenity Indicators */}
        <div className="flex flex-wrap items-center gap-3 mt-3 text-xs text-slate-600 dark:text-slate-300">
          {carpark.motorcycleLots && (
            <span className="flex items-center gap-1 font-mono">
              <span className="text-slate-400">Moto:</span>
              <span className="font-semibold">{carpark.motorcycleLots.available}</span>
            </span>
          )}

          {carpark.evChargers && (
            <span className="flex items-center gap-1 text-sky-600 dark:text-sky-400 font-medium">
              <Zap className="w-3 h-3" />
              <span>{carpark.evChargers.available} EV plug free</span>
            </span>
          )}

          <span className="font-mono text-slate-500 dark:text-slate-400 text-[11px]">
            H: {carpark.gantryHeight}m
          </span>

          {carpark.freeParking !== 'NO' && (
            <span className="text-emerald-700 dark:text-emerald-400 font-medium text-[11px]">
              {carpark.freeParking}
            </span>
          )}
        </div>
      </div>

      {/* Card Footer Actions */}
      <div className="flex items-center gap-2 mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
        <button
          onClick={() => onSelect(carpark)}
          className="flex-1 py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg transition-colors text-center"
        >
          Rates & Details
        </button>

        <button
          onClick={() => onViewOnMap(carpark)}
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          title="Locate on Map"
        >
          <MapPin className="w-4 h-4 text-slate-500" />
        </button>

        <a
          href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
          target="_blank"
          rel="noopener noreferrer"
          className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
          title="Open Directions in Google Maps"
        >
          <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
        </a>
      </div>
    </div>
  );
};
