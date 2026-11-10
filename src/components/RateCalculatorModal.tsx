import React, { useState, useMemo } from 'react';
import { Carpark } from '../types/carpark';
import { X, Calculator, Clock, DollarSign, Info } from 'lucide-react';

interface RateCalculatorModalProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onClose: () => void;
}

export const RateCalculatorModal: React.FC<RateCalculatorModalProps> = ({
  carparks,
  selectedCarpark,
  onClose,
}) => {
  const [chosenCarparkId, setChosenCarparkId] = useState<string>(
    selectedCarpark?.id || carparks[0]?.id || ''
  );
  const [dayType, setDayType] = useState<'weekday' | 'saturday' | 'sunday'>('weekday');
  const [entryHour, setEntryHour] = useState<number>(14); // 2:00 PM
  const [durationHours, setDurationHours] = useState<number>(2.5); // 2h 30m
  const [vehicleType, setVehicleType] = useState<'car' | 'motorcycle'>('car');

  const activeCarpark = useMemo(() => {
    return carparks.find((c) => c.id === chosenCarparkId) || carparks[0];
  }, [carparks, chosenCarparkId]);

  // Fee calculation logic
  const calculation = useMemo(() => {
    if (!activeCarpark) return { total: 0, breakdown: 'N/A', isFree: false };

    const totalMinutes = Math.round(durationHours * 60);

    // 1. Within Grace Period
    if (totalMinutes <= activeCarpark.rates.gracePeriodMinutes) {
      return {
        total: 0,
        breakdown: `Free (Within ${activeCarpark.rates.gracePeriodMinutes}-minute grace period)`,
        isFree: true,
      };
    }

    // 2. Sunday & PH free parking for HDB
    if (dayType === 'sunday' && activeCarpark.freeParking === 'SUN & PH ONLY') {
      const exitHour = entryHour + durationHours;
      if (entryHour >= 7 && exitHour <= 22.5) {
        return {
          total: 0,
          breakdown: 'Free Sunday & PH Parking Scheme (7:00 AM - 10:30 PM)',
          isFree: true,
        };
      }
    }

    // 3. Motorcycle Flat / Concession Rate
    if (vehicleType === 'motorcycle') {
      if (activeCarpark.agency === 'HDB' || activeCarpark.agency === 'URA') {
        const fee = Math.min(1.30, Math.ceil(totalMinutes / 120) * 0.65);
        return {
          total: fee,
          breakdown: `$0.65 per 2-hour session (HDB/URA Motorcycle Concession)`,
          isFree: false,
        };
      }
      return {
        total: 1.50,
        breakdown: 'Standard commercial motorcycle flat entry rate',
        isFree: false,
      };
    }

    // 4. Car parking calculations based on per-half-hour block rate
    const blocksOf30 = Math.ceil(totalMinutes / 30);
    const ratePerBlock = activeCarpark.rates.perHalfHourRate || 0.60;
    let cost = blocksOf30 * ratePerBlock;

    // Apply night cap if parking overnight
    if (entryHour >= 22 || entryHour + durationHours >= 24) {
      if (activeCarpark.rates.nightCap) {
        cost = Math.min(cost, activeCarpark.rates.nightCap + (blocksOf30 > 10 ? 2.40 : 0));
      }
    }

    return {
      total: Math.round(cost * 100) / 100,
      breakdown: `${blocksOf30} × 30-min blocks @ $${ratePerBlock.toFixed(2)} / block`,
      isFree: false,
    };
  }, [activeCarpark, dayType, entryHour, durationHours, vehicleType]);

  // Find a cheaper nearby alternative in same area
  const cheaperAlternative = useMemo(() => {
    if (!activeCarpark) return null;
    return carparks.find(
      (c) =>
        c.id !== activeCarpark.id &&
        c.area === activeCarpark.area &&
        c.rates.perHalfHourRate < activeCarpark.rates.perHalfHourRate
    );
  }, [carparks, activeCarpark]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-2xl p-6 text-slate-900 dark:text-white">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <div className="p-2 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-400 rounded-lg">
              <Calculator className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                Singapore Parking Fee Estimator
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Calculates EPS block rates, night caps, and grace period
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 rounded-lg"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Inputs */}
        <div className="flex flex-col gap-4 my-5">
          {/* Carpark Picker */}
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              Select Carpark
            </label>
            <select
              value={chosenCarparkId}
              onChange={(e) => setChosenCarparkId(e.target.value)}
              className="w-full px-3 py-2 text-sm bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none focus:border-emerald-500"
            >
              {carparks.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.agency}) - {c.rates.weekdayDay}
                </option>
              ))}
            </select>
          </div>

          {/* Vehicle Type & Day Type */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Vehicle Type
              </label>
              <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                <button
                  type="button"
                  onClick={() => setVehicleType('car')}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                    vehicleType === 'car'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Car
                </button>
                <button
                  type="button"
                  onClick={() => setVehicleType('motorcycle')}
                  className={`flex-1 py-1.5 rounded-md font-medium transition-colors ${
                    vehicleType === 'motorcycle'
                      ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-400'
                  }`}
                >
                  Motorcycle
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
                Day of Week
              </label>
              <select
                value={dayType}
                onChange={(e) => setDayType(e.target.value as any)}
                className="w-full px-3 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:outline-none"
              >
                <option value="weekday">Weekday (Mon - Fri)</option>
                <option value="saturday">Saturday</option>
                <option value="sunday">Sunday / Public Holiday</option>
              </select>
            </div>
          </div>

          {/* Duration Slider */}
          <div>
            <div className="flex justify-between items-center text-xs font-semibold text-slate-600 dark:text-slate-300 mb-1.5">
              <span>Parking Duration</span>
              <span className="font-mono text-emerald-600 dark:text-emerald-400">
                {Math.floor(durationHours)} hr {Math.round((durationHours % 1) * 60)} mins
              </span>
            </div>
            <input
              type="range"
              min="0.1"
              max="8"
              step="0.25"
              value={durationHours}
              onChange={(e) => setDurationHours(parseFloat(e.target.value))}
              className="w-full accent-emerald-600"
            />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-1">
              <span>10m (Grace)</span>
              <span>2 hours</span>
              <span>4 hours</span>
              <span>8 hours</span>
            </div>
          </div>
        </div>

        {/* Calculated Result Box */}
        <div className="p-4 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800/60 rounded-xl">
          <div className="flex items-baseline justify-between">
            <span className="text-xs font-semibold text-emerald-900 dark:text-emerald-300 uppercase tracking-wider">
              Estimated Total
            </span>
            <span className="text-2xl font-black font-mono text-emerald-700 dark:text-emerald-300 tabular-nums">
              ${calculation.total.toFixed(2)} SGD
            </span>
          </div>

          <p className="text-xs text-emerald-800/80 dark:text-emerald-400/80 mt-1">
            {calculation.breakdown}
          </p>
        </div>

        {/* Cheaper Alternative Recommendation */}
        {cheaperAlternative && (
          <div className="flex items-start gap-2.5 mt-3 p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
            <Info className="w-4 h-4 text-sky-500 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                Tip: Cheaper Nearby Parking
              </span>
              <p className="text-slate-500 dark:text-slate-400 mt-0.5">
                Park at <strong className="text-slate-800 dark:text-slate-200">{cheaperAlternative.name}</strong> ({cheaperAlternative.rates.weekdayDay}) to save up to 40% on parking.
              </p>
            </div>
          </div>
        )}

        <div className="mt-5 pt-3 border-t border-slate-100 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-lg hover:opacity-90 transition-opacity"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
