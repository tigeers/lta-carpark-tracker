import React, { useState, useRef, useMemo } from 'react';
import { Carpark } from '../types/carpark';
import {
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Navigation,
  Zap,
  MapPin,
  Clock,
  ExternalLink,
  ShieldCheck,
} from 'lucide-react';

interface InteractiveMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  onOpenDetailModal: (carpark: Carpark) => void;
  favorites: Set<string>;
  onToggleFavorite: (id: string) => void;
}

export const InteractiveMap: React.FC<InteractiveMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  onOpenDetailModal,
  favorites,
  onToggleFavorite,
}) => {
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [hoveredCarpark, setHoveredCarpark] = useState<Carpark | null>(null);
  const [activeLayer, setActiveLayer] = useState<'all' | 'available' | 'ev' | 'commercial'>('all');

  const containerRef = useRef<HTMLDivElement>(null);

  // Singapore coordinate bounds for projection
  const MIN_LNG = 103.65;
  const MAX_LNG = 104.01;
  const MIN_LAT = 1.23;
  const MAX_LAT = 1.465;

  const projectToSvg = (lat: number, lng: number) => {
    const svgWidth = 960;
    const svgHeight = 560;
    const x = ((lng - MIN_LNG) / (MAX_LNG - MIN_LNG)) * svgWidth;
    const y = svgHeight - ((lat - MIN_LAT) / (MAX_LAT - MIN_LAT)) * svgHeight;
    return { x, y };
  };

  // Filter carparks based on active map layer
  const filteredPins = useMemo(() => {
    return carparks.filter((c) => {
      if (activeLayer === 'available') {
        return c.carLots.available > 30;
      }
      if (activeLayer === 'ev') {
        return Boolean(c.evChargers && c.evChargers.total > 0);
      }
      if (activeLayer === 'commercial') {
        return c.agency === 'Commercial';
      }
      return true;
    });
  }, [carparks, activeLayer]);

  // Pan and drag handling
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - panOffset.x, y: e.clientY - panOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPanOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleZoom = (delta: number) => {
    setZoomLevel((prev) => Math.min(2.5, Math.max(0.85, prev + delta)));
  };

  const resetView = () => {
    setZoomLevel(1);
    setPanOffset({ x: 0, y: 0 });
  };

  const getStatusColor = (carLots: { total: number; available: number }) => {
    const ratio = carLots.available / Math.max(1, carLots.total);
    if (ratio >= 0.25) return { bg: 'bg-emerald-600', ring: 'ring-emerald-400', stroke: '#059669', text: 'text-emerald-700 dark:text-emerald-300' };
    if (ratio >= 0.08) return { bg: 'bg-amber-500', ring: 'ring-amber-300', stroke: '#d97706', text: 'text-amber-700 dark:text-amber-300' };
    return { bg: 'bg-rose-600', ring: 'ring-rose-300', stroke: '#e11d48', text: 'text-rose-700 dark:text-rose-300' };
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Map Control Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl shadow-xs">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveLayer('all')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeLayer === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            All Lots ({carparks.length})
          </button>
          <button
            onClick={() => setActiveLayer('available')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeLayer === 'available'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            High Vacancy (&gt;30 Free)
          </button>
          <button
            onClick={() => setActiveLayer('ev')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeLayer === 'ev'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            EV Fast Charging
          </button>
          <button
            onClick={() => setActiveLayer('commercial')}
            className={`px-3 py-1.5 text-xs font-medium rounded-lg whitespace-nowrap transition-colors ${
              activeLayer === 'commercial'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white'
            }`}
          >
            Shopping Malls & Commercial
          </button>
        </div>

        {/* Zoom & View Controls */}
        <div className="flex items-center gap-1 shrink-0 ml-auto">
          <button
            onClick={() => handleZoom(0.25)}
            title="Zoom In"
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => handleZoom(-0.25)}
            title="Zoom Out"
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={resetView}
            title="Reset Map View"
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-800 rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Main Map Canvas Area */}
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        className={`relative w-full h-[520px] md:h-[600px] overflow-hidden rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-900 select-none ${
          isDragging ? 'cursor-grabbing' : 'cursor-grab'
        }`}
      >
        <svg
          viewBox="0 0 960 560"
          className="w-full h-full"
          style={{
            transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
            transformOrigin: 'center center',
            transition: isDragging ? 'none' : 'transform 0.15s ease-out',
          }}
        >
          {/* Subtle Map Grid Lines */}
          <defs>
            <pattern id="grid-pattern" width="40" height="40" patternUnits="userSpaceOnUse">
              <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#334155" strokeWidth="0.5" strokeOpacity="0.3" />
            </pattern>
            {/* Gradients */}
            <radialGradient id="singaporeGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#0f766e" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background grid */}
          <rect width="960" height="560" fill="#0b1120" />
          <rect width="960" height="560" fill="url(#grid-pattern)" />
          <circle cx="480" cy="280" r="320" fill="url(#singaporeGlow)" />

          {/* Realistic Singapore Mainland Geometry */}
          <g id="singapore-landmass" opacity="0.95">
            {/* Johor Strait Water Line */}
            <path
              d="M 120 70 Q 280 60 480 80 T 800 130"
              fill="none"
              stroke="#1e293b"
              strokeWidth="1.5"
              strokeDasharray="4 4"
            />

            {/* Singapore Mainland Silhouette */}
            <path
              d="M 180 180 
                 C 220 140, 310 110, 420 115 
                 C 510 110, 620 130, 720 160 
                 C 790 185, 870 210, 890 260 
                 C 900 300, 840 330, 780 340 
                 C 710 355, 660 385, 590 395 
                 C 540 405, 480 435, 430 425 
                 C 370 415, 310 390, 260 380 
                 C 200 370, 150 345, 120 310 
                 C 95 280, 110 240, 140 210 
                 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="2"
            />

            {/* Sentosa Island */}
            <path
              d="M 440 460 C 470 455, 500 465, 520 480 C 490 495, 450 490, 435 475 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Jurong Island */}
            <path
              d="M 170 380 C 210 385, 230 425, 210 445 C 175 455, 150 425, 160 395 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.5"
            />

            {/* Pulau Ubin */}
            <path
              d="M 770 170 C 810 165, 840 185, 820 195 C 790 200, 765 185, 770 170 Z"
              fill="#1e293b"
              stroke="#334155"
              strokeWidth="1.2"
            />
          </g>

          {/* Expressways (PIE, CTE, AYE, ECP) Guidance Lines */}
          <g id="expressways" opacity="0.4" stroke="#475569" strokeWidth="1.5" fill="none">
            {/* PIE (Tuas to Changi) */}
            <path d="M 190 300 Q 350 270 510 280 T 830 250" />
            {/* CTE (North to South) */}
            <path d="M 490 125 Q 480 250 470 400" />
            {/* AYE (West to Marina) */}
            <path d="M 200 350 Q 320 360 480 415" />
            {/* ECP (Marina to Changi) */}
            <path d="M 520 415 Q 670 370 860 270" />
          </g>

          {/* Regional Area Label Anchors */}
          <g id="region-labels" fill="#94a3b8" fontSize="11" fontFamily="'Plus Jakarta Sans', sans-serif" fontWeight="600" opacity="0.65">
            <text x="440" y="145">WOODLANDS</text>
            <text x="240" y="315">JURONG EAST</text>
            <text x="490" y="275">BISHAN / AMK</text>
            <text x="640" y="200">PUNGGOL</text>
            <text x="730" y="295">TAMPINES</text>
            <text x="820" y="255">CHANGI</text>
            <text x="460" y="375">ORCHARD</text>
            <text x="480" y="425">CBD / MARINA</text>
          </g>

          {/* Carpark Markers */}
          {filteredPins.map((carpark) => {
            const { x, y } = projectToSvg(carpark.coordinates.lat, carpark.coordinates.lng);
            const status = getStatusColor(carpark.carLots);
            const isSelected = selectedCarpark?.id === carpark.id;
            const isFav = favorites.has(carpark.id);

            return (
              <g
                key={carpark.id}
                transform={`translate(${x}, ${y})`}
                className="cursor-pointer transition-transform duration-150"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectCarpark(carpark);
                }}
                onMouseEnter={() => setHoveredCarpark(carpark)}
                onMouseLeave={() => setHoveredCarpark(null)}
              >
                {/* Selected Halo */}
                {isSelected && (
                  <circle
                    r="24"
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2.5"
                    strokeDasharray="3 3"
                    className="animate-spin"
                    style={{ transformOrigin: '0 0', animationDuration: '6s' }}
                  />
                )}

                {/* Base Marker Ring */}
                <circle
                  r={isSelected ? 16 : 13}
                  fill="#0f172a"
                  stroke={status.stroke}
                  strokeWidth={isSelected ? 3 : 2}
                  className="transition-all"
                />

                {/* Lot Availability Number or EV Icon */}
                <text
                  textAnchor="middle"
                  dy="4"
                  fill="#ffffff"
                  fontSize={isSelected ? "10" : "8.5"}
                  fontWeight="700"
                  fontFamily="'JetBrains Mono', monospace"
                >
                  {carpark.carLots.available > 999 ? '999+' : carpark.carLots.available}
                </text>

                {/* Agency Pill indicator (tiny dot) */}
                <circle
                  cx="10"
                  cy="-10"
                  r="3.5"
                  fill={carpark.agency === 'HDB' ? '#38bdf8' : carpark.agency === 'URA' ? '#f59e0b' : '#a855f7'}
                />

                {/* Favorite Star flag */}
                {isFav && (
                  <circle
                    cx="-10"
                    cy="-10"
                    r="3"
                    fill="#fbbf24"
                  />
                )}
              </g>
            );
          })}
        </svg>

        {/* Floating Legend Overlay */}
        <div className="absolute bottom-3 left-3 bg-slate-900/90 backdrop-blur-md border border-slate-800 rounded-xl p-3 text-xs text-slate-300 pointer-events-none hidden sm:block">
          <div className="text-[11px] font-semibold text-white mb-2">Live Availability Index</div>
          <div className="flex flex-col gap-1.5 font-mono text-[11px]">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <span>Available (&gt;25% Vacant)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
              <span>Limited (8% - 25% Vacant)</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <span>Critical / Full (&lt;8% Vacant)</span>
            </div>
          </div>
        </div>

        {/* Hover / Selected Carpark Quick Popup card */}
        {(hoveredCarpark || selectedCarpark) && (
          <div className="absolute top-3 right-3 w-80 max-w-[calc(100%-24px)] bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-3.5 shadow-lg pointer-events-auto">
            {(() => {
              const active = hoveredCarpark || selectedCarpark!;
              const ratio = Math.round((active.carLots.available / Math.max(1, active.carLots.total)) * 100);
              const isFav = favorites.has(active.id);

              return (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2 text-[11px] text-slate-500 dark:text-slate-400">
                        <span>{active.agency}</span>
                        <span aria-hidden="true">·</span>
                        <span>{active.area}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{active.id}</span>
                      </div>
                      <h4 className="text-sm font-bold text-slate-900 dark:text-white leading-tight mt-0.5">
                        {active.name}
                      </h4>
                    </div>

                    <button
                      onClick={() => onToggleFavorite(active.id)}
                      className={`text-xs p-1 rounded-md transition-colors ${
                        isFav
                          ? 'text-amber-500 bg-amber-50 dark:bg-amber-950/40'
                          : 'text-slate-400 hover:text-amber-500'
                      }`}
                      title={isFav ? 'Remove Favorite' : 'Save Favorite'}
                    >
                      ★
                    </button>
                  </div>

                  {/* Lots Availability Meter */}
                  <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-slate-800/80 border border-slate-100 dark:border-slate-700/60">
                    <div className="flex flex-col">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Free Car Lots</span>
                      <div className="flex items-baseline gap-1.5 font-mono">
                        <span className="text-xl font-bold text-slate-900 dark:text-white tabular-nums">
                          {active.carLots.available}
                        </span>
                        <span className="text-xs text-slate-400">/ {active.carLots.total}</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">Vacant</span>
                      <div className="text-sm font-bold text-emerald-600 dark:text-emerald-400 font-mono tabular-nums">
                        {ratio}%
                      </div>
                    </div>
                  </div>

                  {/* Quick Metadata */}
                  <div className="flex items-center justify-between text-xs text-slate-600 dark:text-slate-300">
                    <span className="truncate max-w-[170px]">{active.rates.weekdayDay}</span>
                    <span className="font-mono text-[11px] text-slate-500">H: {active.gantryHeight}m</span>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-800">
                    <button
                      onClick={() => onOpenDetailModal(active)}
                      className="flex-1 py-1.5 px-3 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 dark:bg-emerald-600 dark:hover:bg-emerald-700 rounded-lg transition-colors text-center"
                    >
                      View Rates & Info
                    </button>
                    <a
                      href={`https://www.google.com/maps/dir/?api=1&destination=${active.coordinates.lat},${active.coordinates.lng}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white border border-slate-200 dark:border-slate-700 rounded-lg transition-colors"
                      title="Navigate via Google Maps"
                    >
                      <Navigation className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    </a>
                  </div>
                </div>
              );
            })()}
          </div>
        )}
      </div>
    </div>
  );
};
