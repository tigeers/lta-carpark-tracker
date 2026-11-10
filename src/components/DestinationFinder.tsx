import React, { useState, useMemo } from 'react';
import { Carpark, PopularDestination } from '../types/carpark';
import { POPULAR_DESTINATIONS } from '../data/singaporeCarparks';
import { CarparkService } from '../services/carparkService';
import { Compass, Navigation, MapPin, Footprints, ArrowRight, Star } from 'lucide-react';

interface DestinationFinderProps {
  carparks: Carpark[];
  onSelectCarpark: (carpark: Carpark) => void;
  onViewOnMap: (carpark: Carpark) => void;
}

export const DestinationFinder: React.FC<DestinationFinderProps> = ({
  carparks,
  onSelectCarpark,
  onViewOnMap,
}) => {
  const [selectedDestinationId, setSelectedDestinationId] = useState<string>(
    POPULAR_DESTINATIONS[0].id
  );
  const [customSearch, setCustomSearch] = useState<string>('');

  const currentDestination = useMemo(() => {
    return (
      POPULAR_DESTINATIONS.find((d) => d.id === selectedDestinationId) ||
      POPULAR_DESTINATIONS[0]
    );
  }, [selectedDestinationId]);

  // Compute closest carparks with distance calculation
  const rankedCarparks = useMemo(() => {
    return carparks
      .map((c) => {
        const distKm = CarparkService.calculateDistanceKm(
          currentDestination.lat,
          currentDestination.lng,
          c.coordinates.lat,
          c.coordinates.lng
        );
        return {
          ...c,
          distanceKm: distKm,
          walkTimeMins: Math.round(distKm * 12), // avg walking speed ~5km/h => 12 mins per km
        };
      })
      .sort((a, b) => (a.distanceKm || 0) - (b.distanceKm || 0))
      .slice(0, 5);
  }, [carparks, currentDestination]);

  return (
    <div className="flex flex-col gap-6">
      {/* Destination Selector Header */}
      <div className="p-5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Nearby Parking by Destination
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Select popular shopping belts, dining hubs, or landmarks to find nearest carparks with live lots
            </p>
          </div>
        </div>

        {/* Destination Quick Selection Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {POPULAR_DESTINATIONS.map((dest) => (
            <button
              key={dest.id}
              onClick={() => setSelectedDestinationId(dest.id)}
              className={`p-3 text-left rounded-xl border transition-all ${
                selectedDestinationId === dest.id
                  ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950 border-transparent shadow-xs'
                  : 'bg-slate-50 dark:bg-slate-800/60 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:border-slate-400'
              }`}
            >
              <div className="text-[11px] opacity-75">{dest.category}</div>
              <div className="text-xs font-bold mt-0.5 line-clamp-1">{dest.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Closest Carparks Results */}
      <div>
        <div className="flex items-center justify-between mb-3 px-1">
          <div className="text-xs text-slate-500 dark:text-slate-400">
            <span>Closest Carparks to </span>
            <strong className="text-slate-800 dark:text-slate-200">{currentDestination.name}</strong>
          </div>
          <span className="text-xs text-slate-400 font-mono">Ranked by proximity</span>
        </div>

        <div className="flex flex-col gap-3">
          {rankedCarparks.map((carpark, index) => {
            const ratio = Math.round((carpark.carLots.available / Math.max(1, carpark.carLots.total)) * 100);

            return (
              <div
                key={carpark.id}
                className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl hover:border-slate-300 dark:hover:border-slate-700 transition-all shadow-xs"
              >
                {/* Carpark Info with rank badge */}
                <div className="flex items-start gap-3">
                  <div className="flex items-center justify-center w-7 h-7 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold font-mono shrink-0">
                    #{index + 1}
                  </div>

                  <div>
                    <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
                      <span className="font-semibold text-slate-700 dark:text-slate-300">{carpark.agency}</span>
                      <span aria-hidden="true">·</span>
                      <span>{carpark.carparkType}</span>
                      <span aria-hidden="true">·</span>
                      <span className="font-mono">{carpark.id}</span>
                    </div>

                    <h4
                      onClick={() => onSelectCarpark(carpark)}
                      className="text-sm font-bold text-slate-900 dark:text-white hover:text-emerald-600 dark:hover:text-emerald-400 cursor-pointer mt-0.5"
                    >
                      {carpark.name}
                    </h4>

                    <div className="flex items-center gap-3 text-xs text-slate-500 dark:text-slate-400 mt-1">
                      <span className="flex items-center gap-1 font-mono text-emerald-600 dark:text-emerald-400 font-medium">
                        <Footprints className="w-3.5 h-3.5" />
                        <span>{carpark.distanceKm} km (~{carpark.walkTimeMins}m walk)</span>
                      </span>
                      <span>{carpark.rates.weekdayDay}</span>
                    </div>
                  </div>
                </div>

                {/* Live Availability & Action */}
                <div className="flex items-center justify-between md:justify-end gap-5 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                  <div className="text-right">
                    <span className="text-[11px] text-slate-500 dark:text-slate-400">Available Lots</span>
                    <div className="flex items-baseline gap-1 font-mono">
                      <span
                        className={`text-xl font-bold tabular-nums ${
                          ratio >= 25 ? 'text-emerald-600 dark:text-emerald-400' : ratio >= 8 ? 'text-amber-500' : 'text-rose-600'
                        }`}
                      >
                        {carpark.carLots.available}
                      </span>
                      <span className="text-xs text-slate-400">/ {carpark.carLots.total}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => onSelectCarpark(carpark)}
                      className="py-2 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg transition-colors whitespace-nowrap"
                    >
                      Details
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                      title="Navigate"
                    >
                      <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </a>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
