import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import { Carpark, UserLocation, NavigationRoute } from '../types/carpark';
import {
  Navigation,
  Crosshair,
  RotateCcw,
  Layers,
  Zap,
  Info,
  ExternalLink,
  Footprints,
  Compass,
} from 'lucide-react';

interface LeafletMapProps {
  carparks: Carpark[];
  selectedCarpark: Carpark | null;
  onSelectCarpark: (carpark: Carpark) => void;
  onOpenDetailModal: (carpark: Carpark) => void;
  onStartNavigation: (carpark: Carpark) => void;
  userLocation: UserLocation | null;
  onUpdateUserLocation: (loc: UserLocation) => void;
  activeRoute: NavigationRoute | null;
  isDarkMode: boolean;
}

export const LeafletMap: React.FC<LeafletMapProps> = ({
  carparks,
  selectedCarpark,
  onSelectCarpark,
  onOpenDetailModal,
  onStartNavigation,
  userLocation,
  onUpdateUserLocation,
  activeRoute,
  isDarkMode,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const routeLayerRef = useRef<L.Polyline | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);
  const tileLayerRef = useRef<L.TileLayer | null>(null);

  const [activeLayerFilter, setActiveLayerFilter] = useState<'all' | 'available' | 'ev' | 'commercial' | 'hdb'>('all');
  const [mapStyle, setMapStyle] = useState<'standard' | 'dark' | 'streets'>('dark');
  const [isLocating, setIsLocating] = useState(false);

  // Singapore geographic bounds
  const SG_CENTER: [number, number] = [1.3521, 103.8198];
  const SG_BOUNDS = L.latLngBounds(
    L.latLng(1.15, 103.55),
    L.latLng(1.49, 104.12)
  );

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const map = L.map(mapContainerRef.current, {
      center: SG_CENTER,
      zoom: 12,
      minZoom: 11,
      maxZoom: 18,
      maxBounds: SG_BOUNDS,
      maxBoundsViscosity: 0.8,
      zoomControl: false,
    });

    // Add custom zoom control in bottom-right
    L.control.zoom({ position: 'bottomright' }).addTo(map);

    // Initial tile layer
    const isDark = isDarkMode || mapStyle === 'dark';
    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';

    const tiles = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = tiles;

    // Layer group for carpark markers
    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;

    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Update Tile Layer when Dark Mode or Map Style Changes
  useEffect(() => {
    if (!mapInstanceRef.current || !tileLayerRef.current) return;

    const map = mapInstanceRef.current;
    map.removeLayer(tileLayerRef.current);

    let tileUrl = 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png';
    if (isDarkMode || mapStyle === 'dark') {
      tileUrl = 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png';
    } else if (mapStyle === 'streets') {
      tileUrl = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
    }

    const newTiles = L.tileLayer(tileUrl, {
      attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
      subdomains: 'abcd',
      maxZoom: 19,
    }).addTo(map);

    tileLayerRef.current = newTiles;
  }, [isDarkMode, mapStyle]);

  // Update User Location Marker
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (userMarkerRef.current) {
      map.removeLayer(userMarkerRef.current);
      userMarkerRef.current = null;
    }

    if (userLocation) {
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div class="relative flex items-center justify-center w-7 h-7">
            <span class="absolute w-7 h-7 rounded-full bg-sky-500 opacity-40 animate-ping"></span>
            <span class="relative w-4 h-4 rounded-full bg-sky-600 border-2 border-white shadow-md"></span>
          </div>
        `,
        iconSize: [28, 28],
        iconAnchor: [14, 14],
      });

      const marker = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);

      marker.bindTooltip(`<strong>${userLocation.name}</strong>`, {
        direction: 'top',
        offset: [0, -10],
      });

      userMarkerRef.current = marker;
    }
  }, [userLocation]);

  // Update Route Polyline
  useEffect(() => {
    if (!mapInstanceRef.current) return;
    const map = mapInstanceRef.current;

    if (routeLayerRef.current) {
      map.removeLayer(routeLayerRef.current);
      routeLayerRef.current = null;
    }

    if (activeRoute) {
      const { origin, destination } = activeRoute;
      const midLat = (origin.lat + destination.coordinates.lat) / 2 + (destination.coordinates.lng - origin.lng) * 0.08;
      const midLng = (origin.lng + destination.coordinates.lng) / 2 - (destination.coordinates.lat - origin.lat) * 0.08;

      const pathCoords: [number, number][] = [
        [origin.lat, origin.lng],
        [midLat, midLng],
        [destination.coordinates.lat, destination.coordinates.lng],
      ];

      const polyline = L.polyline(pathCoords, {
        color: '#10b981',
        weight: 4,
        opacity: 0.85,
        dashArray: '8, 6',
      }).addTo(map);

      routeLayerRef.current = polyline;

      // Fit bounds to show route
      const group = L.featureGroup([
        L.marker([origin.lat, origin.lng]),
        L.marker([destination.coordinates.lat, destination.coordinates.lng]),
      ]);
      map.fitBounds(group.getBounds().pad(0.2), { maxZoom: 15 });
    }
  }, [activeRoute]);

  // Fly to selected carpark when changed
  useEffect(() => {
    if (!mapInstanceRef.current || !selectedCarpark) return;
    const map = mapInstanceRef.current;
    map.flyTo(
      [selectedCarpark.coordinates.lat, selectedCarpark.coordinates.lng],
      15,
      { duration: 1.0 }
    );
  }, [selectedCarpark]);

  // Render Carpark Markers
  useEffect(() => {
    if (!mapInstanceRef.current || !markersLayerRef.current) return;
    const markersLayer = markersLayerRef.current;
    markersLayer.clearLayers();

    // Filter pins by active filter
    const visiblePins = carparks.filter((c) => {
      if (activeLayerFilter === 'available') return c.carLots.available > 30;
      if (activeLayerFilter === 'ev') return Boolean(c.evChargers && c.evChargers.available > 0);
      if (activeLayerFilter === 'commercial') return c.agency === 'Commercial';
      if (activeLayerFilter === 'hdb') return c.agency === 'HDB';
      return true;
    });

    visiblePins.forEach((carpark) => {
      const ratio = Math.round((carpark.carLots.available / Math.max(1, carpark.carLots.total)) * 100);
      const isSelected = selectedCarpark?.id === carpark.id;

      // Color coding
      let statusColor = '#059669'; // Green
      let statusClass = 'bg-emerald-600 text-white';
      if (ratio < 8) {
        statusColor = '#dc2626'; // Red
        statusClass = 'bg-rose-600 text-white';
      } else if (ratio < 25) {
        statusColor = '#d97706'; // Amber
        statusClass = 'bg-amber-500 text-white';
      }

      const agencyTag = carpark.agency.substring(0, 3).toUpperCase();

      // Custom HTML Marker Icon with Tabular Numerals
      const markerHtml = `
        <div class="group relative flex items-center justify-center transition-transform hover:scale-110 cursor-pointer ${
          isSelected ? 'scale-115 z-50' : ''
        }">
          ${
            isSelected
              ? `<div class="absolute -inset-2 rounded-full border-2 border-dashed border-sky-400 animate-spin" style="animation-duration: 8s;"></div>`
              : ''
          }
          <div class="flex items-center gap-1 px-2 py-1 rounded-full shadow-md font-mono font-bold text-[11px] tabular-nums border border-white/30 ${statusClass}">
            ${carpark.evChargers && carpark.evChargers.available > 0 ? `<span class="text-sky-200">⚡</span>` : ''}
            <span>${carpark.carLots.available}</span>
          </div>
          <div class="absolute -bottom-3 text-[9px] font-sans font-semibold px-1 rounded bg-slate-900 text-slate-200 border border-slate-700 uppercase tracking-tighter opacity-80 group-hover:opacity-100">
            ${agencyTag}
          </div>
        </div>
      `;

      const customIcon = L.divIcon({
        className: 'carpark-custom-div-icon',
        html: markerHtml,
        iconSize: [42, 28],
        iconAnchor: [21, 14],
      });

      const marker = L.marker([carpark.coordinates.lat, carpark.coordinates.lng], {
        icon: customIcon,
      });

      // Interactive Popup Card
      const popupHtml = document.createElement('div');
      popupHtml.className = 'p-1 text-slate-900 dark:text-slate-100 min-w-[220px] max-w-[260px] font-sans';
      popupHtml.innerHTML = `
        <div class="text-[11px] text-slate-500 flex items-center gap-1 font-medium">
          <span>${carpark.agency}</span> · <span>${carpark.area.split('/')[0].trim()}</span> · <span>${carpark.id}</span>
        </div>
        <h4 class="text-sm font-bold mt-0.5 leading-snug">${carpark.name}</h4>
        <div class="flex items-baseline justify-between mt-2 p-2 rounded-lg bg-slate-100 dark:bg-slate-800">
          <div>
            <div class="text-[10px] text-slate-500">Available Lots</div>
            <div class="text-lg font-bold font-mono" style="color: ${statusColor};">${carpark.carLots.available} <span class="text-xs font-normal text-slate-400">/ ${carpark.carLots.total}</span></div>
          </div>
          <div class="text-right">
            <div class="text-[10px] text-slate-500">Free</div>
            <div class="text-xs font-mono font-bold">${ratio}%</div>
          </div>
        </div>
        <div class="text-[11px] text-slate-500 mt-1 truncate">${carpark.rates.weekdayDay}</div>
        <div class="flex items-center gap-1.5 mt-2.5 pt-2 border-t border-slate-200 dark:border-slate-700">
          <button id="popup-detail-${carpark.id}" class="flex-1 py-1 px-2 text-[11px] font-semibold text-white bg-slate-900 dark:bg-emerald-600 rounded-md hover:opacity-90">
            Full Info
          </button>
          <button id="popup-route-${carpark.id}" class="py-1 px-2 text-[11px] font-semibold text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-300 rounded-md hover:bg-emerald-100">
            Route
          </button>
          <a href="https://www.google.com/maps/dir/?api=1&destination=${carpark.coordinates.lat},${carpark.coordinates.lng}" target="_blank" class="p-1 text-slate-500 hover:text-slate-900 rounded-md border border-slate-200 dark:border-slate-700" title="Open Google Maps">
            ↗
          </a>
        </div>
      `;

      marker.bindPopup(popupHtml, {
        offset: [0, -12],
        closeButton: false,
      });

      marker.on('popupopen', () => {
        onSelectCarpark(carpark);
        const detailBtn = document.getElementById(`popup-detail-${carpark.id}`);
        const routeBtn = document.getElementById(`popup-route-${carpark.id}`);
        if (detailBtn) {
          detailBtn.onclick = () => onOpenDetailModal(carpark);
        }
        if (routeBtn) {
          routeBtn.onclick = () => onStartNavigation(carpark);
        }
      });

      marker.on('click', () => {
        onSelectCarpark(carpark);
      });

      markersLayer.addLayer(marker);
    });
  }, [carparks, activeLayerFilter, selectedCarpark]);

  // Handle Locate Me GPS
  const handleLocateMe = () => {
    setIsLocating(true);
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocating(false);
          const newLoc: UserLocation = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            name: 'My GPS Location',
          };
          onUpdateUserLocation(newLoc);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([newLoc.lat, newLoc.lng], 14);
          }
        },
        (err) => {
          setIsLocating(false);
          console.warn('Geolocation denied or failed, falling back to Marina Bay:', err);
          // Fallback to Singapore central location
          const fallbackLoc: UserLocation = {
            lat: 1.2834,
            lng: 103.8607,
            name: 'Marina Bay (Simulated GPS)',
          };
          onUpdateUserLocation(fallbackLoc);
          if (mapInstanceRef.current) {
            mapInstanceRef.current.flyTo([fallbackLoc.lat, fallbackLoc.lng], 14);
          }
        },
        { timeout: 6000 }
      );
    } else {
      setIsLocating(false);
    }
  };

  const resetMap = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.flyTo(SG_CENTER, 12);
    }
  };

  return (
    <div className="relative w-full h-full min-h-[500px] flex flex-col rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-xs">
      {/* Top Map Control Bar */}
      <div className="absolute top-3 left-3 right-3 z-400 flex flex-wrap items-center justify-between gap-2 pointer-events-none">
        {/* Layer Filters (interactive buttons) */}
        <div className="flex items-center gap-1 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-md pointer-events-auto overflow-x-auto no-scrollbar max-w-full">
          <button
            onClick={() => setActiveLayerFilter('all')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeLayerFilter === 'all'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            All ({carparks.length})
          </button>
          <button
            onClick={() => setActiveLayerFilter('available')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeLayerFilter === 'available'
                ? 'bg-emerald-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Vacant (&gt;30)
          </button>
          <button
            onClick={() => setActiveLayerFilter('ev')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeLayerFilter === 'ev'
                ? 'bg-sky-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            ⚡ EV Stations
          </button>
          <button
            onClick={() => setActiveLayerFilter('commercial')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeLayerFilter === 'commercial'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            Malls & CBD
          </button>
          <button
            onClick={() => setActiveLayerFilter('hdb')}
            className={`px-2.5 py-1 text-xs font-semibold rounded-lg whitespace-nowrap transition-colors ${
              activeLayerFilter === 'hdb'
                ? 'bg-teal-600 text-white'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            HDB Towns
          </button>
        </div>

        {/* Quick Utility Tools */}
        <div className="flex items-center gap-1.5 p-1 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md rounded-xl border border-slate-200 dark:border-slate-800 shadow-md pointer-events-auto shrink-0 ml-auto">
          <button
            onClick={handleLocateMe}
            disabled={isLocating}
            title="Locate my position on map"
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg transition-colors"
          >
            <Crosshair className={`w-4 h-4 ${isLocating ? 'animate-spin text-emerald-600' : ''}`} />
          </button>

          <button
            onClick={() => setMapStyle(mapStyle === 'dark' ? 'standard' : 'dark')}
            title="Toggle Map Style"
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg transition-colors"
          >
            <Layers className="w-4 h-4" />
          </button>

          <button
            onClick={resetMap}
            title="Reset to Singapore Overview"
            className="p-1.5 text-slate-600 hover:text-slate-900 dark:text-slate-300 dark:hover:text-white rounded-lg transition-colors"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Real Cartographic Leaflet Canvas Container */}
      <div ref={mapContainerRef} className="w-full h-full min-h-[500px] z-10" />

      {/* Bottom Map Legend */}
      <div className="absolute bottom-3 left-3 z-400 bg-white/90 dark:bg-slate-900/90 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-xl p-2.5 text-[11px] shadow-md pointer-events-none hidden sm:flex items-center gap-3">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-600"></span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">&gt;25% Vacant</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">8-25% Limited</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-600"></span>
          <span className="text-slate-700 dark:text-slate-300 font-medium">&lt;8% Full</span>
        </div>
      </div>
    </div>
  );
};
