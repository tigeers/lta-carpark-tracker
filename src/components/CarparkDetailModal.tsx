import React, { useState } from 'react';
import { Carpark } from '../types/carpark';
import {
  X,
  Navigation,
  Clock,
  Zap,
  ShieldCheck,
  Star,
  Copy,
  Check,
  Calculator,
  Compass,
  AlertTriangle,
} from 'lucide-react';

interface CarparkDetailModalProps {
  carpark: Carpark | null;
  onClose: () => void;
  isFavorite: boolean;
  onToggleFavorite: (id: string) => void;
  onOpenCalculator: (carpark: Carpark) => void;
  onStartNavigation?: (carpark: Carpark) => void;
}

export const CarparkDetailModal: React.FC<CarparkDetailModalProps> = ({
  carpark,
  onClose,
  isFavorite,
  onToggleFavorite,
  onOpenCalculator,
  onStartNavigation,
}) => {
  const [copied, setCopied] = useState(false);

  if (!carpark) return null;

  const ratio = Math.round((carpark.carLots.available / Math.max(1, carpark.carLots.total)) * 100);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const hoursLabels = ['6am', '7am', '8am', '9am', '10am', '11am', '12pm', '1pm', '2pm', '3pm', '4pm', '5pm', '6pm', '7pm', '8pm', '9pm', '10pm', '11pm'];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-5 md:p-6 text-slate-900 dark:text-white">
        {/* Header Bar */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100 dark:border-slate-800">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <span className="font-semibold text-slate-800 dark:text-slate-200">{carpark.agency}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.area}</span>
              <span aria-hidden="true">·</span>
              <span>{carpark.carparkType}</span>
            </div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
              {carpark.name}
            </h2>
            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-slate-400 mt-1">
              <span>{carpark.address}</span>
              <button
                onClick={() => copyToClipboard(`${carpark.name}, ${carpark.address}`)}
                className="hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                title="Copy Address"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={() => onToggleFavorite(carpark.id)}
              className={`p-2 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors ${
                isFavorite
                  ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                  : 'text-slate-400 hover:text-amber-500'
              }`}
              title={isFavorite ? 'Remove from favorites' : 'Save as favorite'}
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-400 text-amber-500' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl border border-slate-200 dark:border-slate-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Live Availability Hero Gauge */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 my-5">
          <div className="md:col-span-2 p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800 flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Real-Time Car Vacancy
              </span>
              <span className="text-xs font-mono text-emerald-600 dark:text-emerald-400 font-semibold tabular-nums">
                {ratio}% Available
              </span>
            </div>

            <div className="flex items-baseline gap-2 my-2 font-mono">
              <span className="text-4xl font-extrabold text-slate-900 dark:text-white tabular-nums">
                {carpark.carLots.available}
              </span>
              <span className="text-sm text-slate-400 tabular-nums">
                / {carpark.carLots.total} total lots
              </span>
            </div>

            <div className="w-full h-2 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
              <div
                className={`h-full ${
                  ratio >= 25 ? 'bg-emerald-500' : ratio >= 8 ? 'bg-amber-500' : 'bg-rose-500'
                } transition-all duration-500`}
                style={{ width: `${Math.min(100, Math.max(3, ratio))}%` }}
              />
            </div>
            <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
              <span>Updated live from Singapore EPS Feed</span>
              <span>Code: {carpark.id}</span>
            </div>
          </div>

          {/* Quick Specifications */}
          <div className="flex flex-col justify-between p-4 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                Gantry Height
              </span>
              <div className="text-2xl font-bold font-mono text-slate-900 dark:text-white mt-1 tabular-nums">
                {carpark.gantryHeight}m
              </div>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                {carpark.gantryHeight >= 2.1 ? 'Suitable for SUVs & standard vans' : 'Low clearance; sedans only'}
              </p>
            </div>

            <div className="pt-2 border-t border-slate-200 dark:border-slate-700/60">
              <span className="text-[11px] text-slate-500 dark:text-slate-400">Grace Period</span>
              <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 font-mono">
                {carpark.rates.gracePeriodMinutes} mins free
              </div>
            </div>
          </div>
        </div>

        {/* Multi-Lot Categories Breakdown */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Motorcycle Lots</span>
            <div className="text-lg font-bold font-mono text-slate-900 dark:text-white tabular-nums mt-0.5">
              {carpark.motorcycleLots ? `${carpark.motorcycleLots.available} / ${carpark.motorcycleLots.total}` : 'N/A'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">EV Fast Chargers</span>
            <div className="text-lg font-bold font-mono text-sky-600 dark:text-sky-400 tabular-nums mt-0.5">
              {carpark.evChargers ? `${carpark.evChargers.available} / ${carpark.evChargers.total}` : 'None'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Night Parking</span>
            <div className="text-sm font-semibold text-slate-800 dark:text-slate-200 mt-1">
              {carpark.nightParking ? 'Available (Capped)' : 'Day Only'}
            </div>
          </div>

          <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
            <span className="text-[11px] text-slate-500 dark:text-slate-400">Free Parking</span>
            <div className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 mt-1">
              {carpark.freeParking}
            </div>
          </div>
        </div>

        {/* Parking Rates Breakdown */}
        <div className="mb-5">
          <h4 className="text-sm font-bold text-slate-900 dark:text-white mb-2">
            Parking Rates & Charges
          </h4>
          <div className="divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-xl overflow-hidden text-xs">
            <div className="flex justify-between p-3 bg-white dark:bg-slate-900">
              <span className="font-medium text-slate-600 dark:text-slate-400">Monday - Friday (Day)</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right">{carpark.rates.weekdayDay}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/30">
              <span className="font-medium text-slate-600 dark:text-slate-400">Monday - Friday (Night)</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right">{carpark.rates.weekdayNight}</span>
            </div>
            <div className="flex justify-between p-3 bg-white dark:bg-slate-900">
              <span className="font-medium text-slate-600 dark:text-slate-400">Saturdays</span>
              <span className="font-semibold text-slate-900 dark:text-white text-right">{carpark.rates.weekendDay}</span>
            </div>
            <div className="flex justify-between p-3 bg-slate-50 dark:bg-slate-800/30">
              <span className="font-medium text-slate-600 dark:text-slate-400">Sundays & Public Holidays</span>
              <span className="font-semibold text-emerald-700 dark:text-emerald-400 text-right">{carpark.freeParking === 'SUN & PH ONLY' ? 'FREE 7:00 AM - 10:30 PM' : carpark.rates.weekendNight}</span>
            </div>
          </div>
        </div>

        {/* Typical Hourly Occupancy Curve */}
        <div className="mb-6 p-4 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-300">
              Typical Daily Occupancy Pattern
            </span>
            <span className="text-[11px] text-slate-400">06:00 - 23:00</span>
          </div>

          <div className="flex items-end gap-1.5 h-20 pt-2">
            {carpark.historicalTrend.map((occ, idx) => (
              <div key={idx} className="flex-1 flex flex-col items-center gap-1 h-full justify-end group">
                <div
                  className={`w-full rounded-t-sm transition-all duration-300 ${
                    occ > 90 ? 'bg-rose-500' : occ > 75 ? 'bg-amber-500' : 'bg-slate-400 dark:bg-slate-600'
                  }`}
                  style={{ height: `${occ}%` }}
                  title={`${hoursLabels[idx]}: ${occ}% occupied`}
                />
              </div>
            ))}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1.5">
            <span>6 AM</span>
            <span>12 PM (Peak)</span>
            <span>6 PM (Peak)</span>
            <span>11 PM</span>
          </div>
        </div>

        {/* Action Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                onClose();
                onOpenCalculator(carpark);
              }}
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <Calculator className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Estimate Cost</span>
            </button>

            {onStartNavigation && (
              <button
                onClick={() => {
                  onClose();
                  onStartNavigation(carpark);
                }}
                className="flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 rounded-xl transition-colors"
              >
                <Compass className="w-3.5 h-3.5" />
                <span>Map Route</span>
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl shadow-xs transition-colors"
            >
              <Navigation className="w-3.5 h-3.5" />
              <span>Google Maps</span>
            </a>

            <a
              href={`https://waze.com/ul?ll=${carpark.coordinates.lat},${carpark.coordinates.lng}&navigate=yes`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-700 dark:text-slate-300 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"
            >
              <span>Waze</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};
