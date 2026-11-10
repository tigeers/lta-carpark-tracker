import React from 'react';
import { NavigationRoute, UserLocation } from '../types/carpark';
import {
  Navigation,
  Car,
  Footprints,
  MapPin,
  X,
  Compass,
  ArrowRight,
  ShieldAlert,
  Clock,
  ExternalLink,
} from 'lucide-react';

interface NavigationDrawerProps {
  route: NavigationRoute | null;
  onClose: () => void;
  onSelectOrigin: (loc: UserLocation) => void;
  availableOrigins: UserLocation[];
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  route,
  onClose,
  onSelectOrigin,
  availableOrigins,
}) => {
  if (!route) return null;

  const { origin, destination, distanceKm, driveTimeMins, walkTimeMins, steps } = route;

  const googleMapsUrl = `https://www.google.com/maps/dir/?api=1&origin=${origin.lat},${origin.lng}&destination=${destination.coordinates.lat},${destination.coordinates.lng}&travelmode=driving`;
  const wazeUrl = `https://waze.com/ul?ll=${destination.coordinates.lat},${destination.coordinates.lng}&navigate=yes`;
  const appleMapsUrl = `https://maps.apple.com/?saddr=${origin.lat},${origin.lng}&daddr=${destination.coordinates.lat},${destination.coordinates.lng}`;

  return (
    <div className="flex flex-col gap-4 p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-lg animate-in slide-in-from-top-3 duration-200">
      {/* Route Header */}
      <div className="flex items-start justify-between gap-3 pb-3 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-xl">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Navigation & Driving Guidance
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Live route preview across Singapore arterial roads & expressways
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          title="Exit Navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Origin / Destination Path */}
      <div className="flex flex-col gap-2 p-3 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
        {/* Origin Selector */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 shrink-0"></span>
          <span className="text-slate-500 dark:text-slate-400 shrink-0">From:</span>
          <select
            value={origin.name}
            onChange={(e) => {
              const selected = availableOrigins.find((o) => o.name === e.target.value);
              if (selected) onSelectOrigin(selected);
            }}
            className="flex-1 px-2 py-1 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-slate-800 dark:text-slate-200 font-semibold focus:outline-none"
          >
            {availableOrigins.map((orig) => (
              <option key={orig.name} value={orig.name}>
                {orig.name}
              </option>
            ))}
          </select>
        </div>

        {/* Destination */}
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0"></span>
          <span className="text-slate-500 dark:text-slate-400 shrink-0">To:</span>
          <span className="font-bold text-slate-900 dark:text-white truncate">
            {destination.name} ({destination.id})
          </span>
        </div>
      </div>

      {/* Travel Metrics Strip */}
      <div className="grid grid-cols-3 gap-2">
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400 flex items-center justify-center gap-1">
            <Car className="w-3 h-3 text-emerald-600" /> Drive Time
          </span>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
            ~{driveTimeMins} mins
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Total Distance</span>
          <div className="text-base font-bold font-mono text-slate-900 dark:text-white mt-0.5 tabular-nums">
            {distanceKm} km
          </div>
        </div>

        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl text-center border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] text-slate-500 dark:text-slate-400">Target Free Lots</span>
          <div className="text-base font-bold font-mono text-emerald-600 dark:text-emerald-400 mt-0.5 tabular-nums">
            {destination.carLots.available} lots
          </div>
        </div>
      </div>

      {/* Turn-by-Turn Guidance Summary */}
      <div className="flex flex-col gap-1.5 text-xs">
        <span className="font-semibold text-slate-700 dark:text-slate-300">Route Highlights:</span>
        <div className="flex flex-col gap-1 text-slate-600 dark:text-slate-400">
          {steps.map((step, idx) => (
            <div key={idx} className="flex items-start gap-2">
              <span className="font-mono text-[10px] text-slate-400 mt-0.5">0{idx + 1}.</span>
              <span>{step}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Launch Navigation Apps */}
      <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
        <a
          href={googleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
        >
          <Navigation className="w-3.5 h-3.5" />
          <span>Launch Google Maps</span>
        </a>

        <a
          href={wazeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <span>Waze</span>
        </a>

        <a
          href={appleMapsUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center justify-center gap-1 py-2 px-3 text-xs font-semibold text-slate-700 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
        >
          <span>Apple Maps</span>
        </a>
      </div>
    </div>
  );
};
