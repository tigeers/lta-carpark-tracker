import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Carpark, CarparkFilterState, UserLocation, NavigationRoute } from './types/carpark';
import { CarparkService, FetchResult } from './services/carparkService';
import { Navbar } from './components/Navbar';
import { LeafletMap } from './components/LeafletMap';
import { NavigationDrawer } from './components/NavigationDrawer';
import { FilterBar } from './components/FilterBar';
import { CarparkList } from './components/CarparkList';
import { CarparkCard } from './components/CarparkCard';
import { CarparkDetailModal } from './components/CarparkDetailModal';
import { RateCalculatorModal } from './components/RateCalculatorModal';
import { DestinationFinder } from './components/DestinationFinder';
import { BackendGuideModal } from './components/BackendGuideModal';
import {
  Search,
  SlidersHorizontal,
  Compass,
  Star,
  MapPin,
  Car,
  Navigation,
  RefreshCw,
  Crosshair,
  Zap,
  Layers,
  ChevronRight,
} from 'lucide-react';

const PRESET_ORIGINS: UserLocation[] = [
  { name: 'My GPS Location', lat: 1.2834, lng: 103.8607 },
  { name: 'Marina Bay Sands (CBD)', lat: 1.2834, lng: 103.8607 },
  { name: 'ION Orchard (Central)', lat: 1.3040, lng: 103.8318 },
  { name: 'Jewel Changi Airport (East)', lat: 1.3602, lng: 103.9898 },
  { name: 'Jurong Gateway (West)', lat: 1.3332, lng: 103.7436 },
  { name: 'Woodlands Checkpoint (North)', lat: 1.4431, lng: 103.7695 },
  { name: 'Waterway Point (North-East)', lat: 1.4067, lng: 103.9022 },
];

export default function App() {
  const [activeTab, setActiveTab] = useState<'map' | 'directory' | 'destinations' | 'calculator' | 'backend'>('map');
  const [carparks, setCarparks] = useState<Carpark[]>([]);
  const [isRefreshing, setIsRefreshing] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('Just now');
  const [dataSource, setDataSource] = useState<'lta_datamall' | 'data.gov.sg' | 'backend' | 'local_simulated'>('local_simulated');
  const [totalLotsCount, setTotalLotsCount] = useState<number>(0);
  const [availableLotsCount, setAvailableLotsCount] = useState<number>(0);

  const [selectedCarpark, setSelectedCarpark] = useState<Carpark | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState<boolean>(false);
  const [isCalculatorModalOpen, setIsCalculatorModalOpen] = useState<boolean>(false);
  const [calculatorCarpark, setCalculatorCarpark] = useState<Carpark | null>(null);

  const [favorites, setFavorites] = useState<Set<string>>(CarparkService.getFavorites());
  const [autoRefresh, setAutoRefresh] = useState<boolean>(true);

  // Navigation route & User location state
  const [userLocation, setUserLocation] = useState<UserLocation>(PRESET_ORIGINS[0]);
  const [activeRoute, setActiveRoute] = useState<NavigationRoute | null>(null);
  const [sidebarFilterMode, setSidebarFilterMode] = useState<'all' | 'favorites' | 'nearby' | 'vacant'>('all');

  // Dark mode state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    return document.documentElement.classList.contains('dark') ||
      window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  useEffect(() => {
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => {
    setIsDarkMode((prev) => !prev);
  };

  // Filter state
  const [filter, setFilter] = useState<CarparkFilterState>({
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

  // Load carparks
  const loadCarparks = useCallback(async (forceLive = false) => {
    setIsRefreshing(true);
    try {
      const result: FetchResult = await CarparkService.getCarparks(forceLive);
      setCarparks(result.carparks);
      setDataSource(result.source);
      setTotalLotsCount(result.totalLotsCount);
      setAvailableLotsCount(result.availableLotsCount);
      setLastUpdated(new Date().toLocaleTimeString('en-SG', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    } catch (e) {
      console.error('Failed to load carparks:', e);
    } finally {
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    loadCarparks(false);
  }, [loadCarparks]);

  // Periodic auto-refresh every 60 seconds
  useEffect(() => {
    if (!autoRefresh) return;
    const interval = setInterval(() => {
      loadCarparks(true);
    }, 60000);
    return () => clearInterval(interval);
  }, [autoRefresh, loadCarparks]);

  // Handle Favorites toggle
  const handleToggleFavorite = (id: string) => {
    CarparkService.toggleFavorite(id);
    setFavorites(CarparkService.getFavorites());
  };

  // Open detail modal
  const handleOpenDetailModal = (carpark: Carpark) => {
    setSelectedCarpark(carpark);
    setIsDetailModalOpen(true);
  };

  // View on map action
  const handleViewOnMap = (carpark: Carpark) => {
    setSelectedCarpark(carpark);
    setActiveTab('map');
  };

  // Start route navigation
  const handleStartNavigation = (carpark: Carpark) => {
    const route = CarparkService.calculateRoute(userLocation, carpark);
    setActiveRoute(route);
    setSelectedCarpark(carpark);
    setActiveTab('map');
  };

  // Update origin location
  const handleUpdateUserLocation = (loc: UserLocation) => {
    setUserLocation(loc);
    if (activeRoute) {
      const route = CarparkService.calculateRoute(loc, activeRoute.destination);
      setActiveRoute(route);
    }
  };

  // Open fee estimator for carpark
  const handleOpenCalculator = (carpark: Carpark) => {
    setCalculatorCarpark(carpark);
    setIsCalculatorModalOpen(true);
  };

  // Filter and sort carparks with distance calculation
  const processedCarparks = useMemo(() => {
    return carparks.map((c) => {
      const dist = CarparkService.calculateDistanceKm(
        userLocation.lat,
        userLocation.lng,
        c.coordinates.lat,
        c.coordinates.lng
      );
      return { ...c, distanceKm: dist };
    });
  }, [carparks, userLocation]);

  const filteredCarparks = useMemo(() => {
    return processedCarparks
      .filter((c) => {
        // Sidebar tab mode filter
        if (sidebarFilterMode === 'favorites' && !favorites.has(c.id)) {
          return false;
        }
        if (sidebarFilterMode === 'vacant' && c.carLots.available < 30) {
          return false;
        }

        // Search query
        if (filter.searchQuery.trim()) {
          const q = filter.searchQuery.toLowerCase();
          const match =
            c.name.toLowerCase().includes(q) ||
            c.id.toLowerCase().includes(q) ||
            c.address.toLowerCase().includes(q) ||
            c.area.toLowerCase().includes(q);
          if (!match) return false;
        }

        // Area filter
        if (filter.area !== 'all' && c.area !== filter.area) {
          return false;
        }

        // Agency filter
        if (filter.agency !== 'all' && c.agency !== filter.agency) {
          return false;
        }

        // Vehicle Type filter
        if (filter.vehicleType === 'motorcycle' && (!c.motorcycleLots || c.motorcycleLots.total === 0)) {
          return false;
        }
        if (filter.vehicleType === 'heavy' && (!c.heavyLots || c.heavyLots.total === 0)) {
          return false;
        }
        if (filter.vehicleType === 'ev' && (!c.evChargers || c.evChargers.total === 0)) {
          return false;
        }

        // Availability status filter
        const ratio = c.carLots.available / Math.max(1, c.carLots.total);
        if (filter.availabilityStatus === 'available' && ratio < 0.25) return false;
        if (filter.availabilityStatus === 'limited' && (ratio < 0.08 || ratio >= 0.25)) return false;
        if (filter.availabilityStatus === 'full' && ratio >= 0.08) return false;

        // Free parking filter
        if (filter.freeParkingOnly && c.freeParking === 'NO') {
          return false;
        }

        return true;
      })
      .sort((a, b) => {
        if (sidebarFilterMode === 'nearby' || filter.sortBy === 'distance') {
          return (a.distanceKm || 0) - (b.distanceKm || 0);
        }
        if (filter.sortBy === 'availability') {
          const ratioA = a.carLots.available / Math.max(1, a.carLots.total);
          const ratioB = b.carLots.available / Math.max(1, b.carLots.total);
          return ratioB - ratioA;
        }
        if (filter.sortBy === 'lots') {
          return b.carLots.available - a.carLots.available;
        }
        if (filter.sortBy === 'name') {
          return a.name.localeCompare(b.name);
        }
        return 0;
      });
  }, [processedCarparks, filter, sidebarFilterMode, favorites]);

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
    setSidebarFilterMode('all');
  };

  const overallRatio = Math.round((availableLotsCount / Math.max(1, totalLotsCount)) * 100);

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors">
      {/* Top Navigation Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onRefresh={() => loadCarparks(true)}
        isRefreshing={isRefreshing}
        isDarkMode={isDarkMode}
        toggleDarkMode={toggleDarkMode}
      />

      {/* Main App Canvas */}
      <main className="flex-1 flex flex-col max-w-[1600px] w-full mx-auto px-3 sm:px-4 lg:px-6 py-3">
        {/* Live Feed Status Ribbon */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3 px-4 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Singapore Real-Time Availability
            </span>
            <span aria-hidden="true">·</span>
            <span>
              Source:{' '}
              <strong className="text-slate-700 dark:text-slate-300 font-mono">
                {dataSource === 'lta_datamall'
                  ? 'LTA DataMall (Live)'
                  : dataSource === 'backend'
                  ? 'Custom Backend'
                  : dataSource === 'data.gov.sg'
                  ? 'Data.gov.sg Live'
                  : 'Singapore EPS Engine'}
              </strong>
            </span>
            <span aria-hidden="true">·</span>
            <span className="font-mono tabular-nums">Refreshed: {lastUpdated}</span>
          </div>

          <div className="flex items-center gap-4 text-xs">
            <span className="font-mono tabular-nums">
              <strong className="text-emerald-600 dark:text-emerald-400 font-bold">{availableLotsCount.toLocaleString()}</strong> / {totalLotsCount.toLocaleString()} free ({overallRatio}%)
            </span>
            <span aria-hidden="true">·</span>
            <label className="flex items-center gap-1.5 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={autoRefresh}
                onChange={(e) => setAutoRefresh(e.target.checked)}
                className="rounded text-emerald-600 focus:ring-emerald-500 accent-emerald-600"
              />
              <span>Auto-refresh (60s)</span>
            </label>
          </div>
        </div>

        {/* TAB 1: INTEGRATED MAP & SIDEBAR WORKSPACE */}
        {activeTab === 'map' && (
          <div className="flex-1 flex flex-col lg:flex-row gap-4 h-[calc(100vh-165px)] min-h-[620px]">
            {/* Left Workspace Sidebar */}
            <aside className="w-full lg:w-[420px] shrink-0 flex flex-col bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xs overflow-hidden">
              {/* Sidebar Header & Search */}
              <div className="p-3.5 border-b border-slate-100 dark:border-slate-800 flex flex-col gap-2.5">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    value={filter.searchQuery}
                    onChange={(e) => setFilter((prev) => ({ ...prev, searchQuery: e.target.value }))}
                    placeholder="Search mall, HDB code (ACB, TP24), or road..."
                    className="w-full pl-9 pr-8 py-2 text-xs bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                  {filter.searchQuery && (
                    <button
                      onClick={() => setFilter((prev) => ({ ...prev, searchQuery: '' }))}
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                    >
                      ×
                    </button>
                  )}
                </div>

                {/* Sidebar Mode Tabs */}
                <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-xs">
                  <button
                    onClick={() => setSidebarFilterMode('all')}
                    className={`flex-1 py-1 rounded-md font-medium transition-colors ${
                      sidebarFilterMode === 'all'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    All ({carparks.length})
                  </button>
                  <button
                    onClick={() => setSidebarFilterMode('nearby')}
                    className={`flex-1 py-1 rounded-md font-medium transition-colors ${
                      sidebarFilterMode === 'nearby'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Near Me
                  </button>
                  <button
                    onClick={() => setSidebarFilterMode('vacant')}
                    className={`flex-1 py-1 rounded-md font-medium transition-colors ${
                      sidebarFilterMode === 'vacant'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    Vacant (&gt;30)
                  </button>
                  <button
                    onClick={() => setSidebarFilterMode('favorites')}
                    className={`flex-1 py-1 rounded-md font-medium transition-colors flex items-center justify-center gap-1 ${
                      sidebarFilterMode === 'favorites'
                        ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Star className="w-3 h-3 text-amber-500 fill-amber-400" />
                    <span>({favorites.size})</span>
                  </button>
                </div>

                {/* Origin Selector Indicator */}
                <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 px-0.5">
                  <span className="flex items-center gap-1 truncate max-w-[240px]">
                    <span className="w-2 h-2 rounded-full bg-sky-500 shrink-0"></span>
                    <span>GPS: {userLocation.name}</span>
                  </span>
                  <span>{filteredCarparks.length} matches</span>
                </div>
              </div>

              {/* Active Route Drawer (If navigation is initiated) */}
              {activeRoute && (
                <div className="p-3 border-b border-slate-100 dark:border-slate-800">
                  <NavigationDrawer
                    route={activeRoute}
                    onClose={() => setActiveRoute(null)}
                    onSelectOrigin={handleUpdateUserLocation}
                    availableOrigins={PRESET_ORIGINS}
                  />
                </div>
              )}

              {/* Scrollable Carpark Cards List */}
              <div className="flex-1 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 p-2.5 flex flex-col gap-1.5">
                {filteredCarparks.length === 0 ? (
                  <div className="py-12 text-center text-xs text-slate-500 dark:text-slate-400">
                    No carparks match current filters.
                    <button
                      onClick={resetFilters}
                      className="block mx-auto mt-2 text-emerald-600 dark:text-emerald-400 font-semibold"
                    >
                      Reset Filters
                    </button>
                  </div>
                ) : (
                  filteredCarparks.map((carpark) => {
                    const ratio = Math.round((carpark.carLots.available / Math.max(1, carpark.carLots.total)) * 100);
                    const isSelected = selectedCarpark?.id === carpark.id;
                    const isFav = favorites.has(carpark.id);

                    return (
                      <div
                        key={carpark.id}
                        onClick={() => setSelectedCarpark(carpark)}
                        className={`p-3 rounded-xl transition-all cursor-pointer border ${
                          isSelected
                            ? 'bg-slate-100/90 dark:bg-slate-800/90 border-emerald-500/50 shadow-xs'
                            : 'bg-white dark:bg-slate-900 border-transparent hover:border-slate-200 dark:hover:border-slate-800'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-500 dark:text-slate-400">
                              <span className="font-semibold text-slate-700 dark:text-slate-300">{carpark.agency}</span>
                              <span aria-hidden="true">·</span>
                              <span>{carpark.area.split('/')[0].trim()}</span>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono">{carpark.id}</span>
                            </div>
                            <h4 className="text-xs font-bold text-slate-900 dark:text-white mt-0.5 truncate">
                              {carpark.name}
                            </h4>
                          </div>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleToggleFavorite(carpark.id);
                            }}
                            className={`p-1 rounded-md ${
                              isFav ? 'text-amber-500' : 'text-slate-300 hover:text-amber-500 dark:text-slate-600'
                            }`}
                          >
                            <Star className={`w-3.5 h-3.5 ${isFav ? 'fill-amber-400' : ''}`} />
                          </button>
                        </div>

                        {/* Availability Bar & Stats */}
                        <div className="mt-2 flex items-baseline justify-between text-xs">
                          <div className="flex items-baseline gap-1 font-mono">
                            <span
                              className={`text-base font-extrabold tabular-nums ${
                                ratio >= 25 ? 'text-emerald-600 dark:text-emerald-400' : ratio >= 8 ? 'text-amber-500' : 'text-rose-600'
                              }`}
                            >
                              {carpark.carLots.available}
                            </span>
                            <span className="text-[11px] text-slate-400">/ {carpark.carLots.total} free</span>
                          </div>

                          <div className="flex items-center gap-2 text-[11px] font-mono text-slate-500">
                            {carpark.distanceKm !== undefined && (
                              <span className="font-semibold text-sky-600 dark:text-sky-400">
                                {carpark.distanceKm} km
                              </span>
                            )}
                            <span>{ratio}%</span>
                          </div>
                        </div>

                        <div className="w-full h-1 bg-slate-100 dark:bg-slate-800 rounded-full mt-1.5 overflow-hidden">
                          <div
                            className={`h-full ${
                              ratio >= 25 ? 'bg-emerald-500' : ratio >= 8 ? 'bg-amber-500' : 'bg-rose-500'
                            }`}
                            style={{ width: `${Math.min(100, Math.max(3, ratio))}%` }}
                          />
                        </div>

                        {/* Quick Action Buttons */}
                        <div className="flex items-center gap-2 mt-2 pt-2 border-t border-slate-100 dark:border-slate-800/60 text-[11px]">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleStartNavigation(carpark);
                            }}
                            className="flex items-center gap-1 font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400"
                          >
                            <Navigation className="w-3 h-3" />
                            <span>Navigate</span>
                          </button>

                          <span aria-hidden="true" className="text-slate-300 dark:text-slate-700">·</span>

                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleOpenDetailModal(carpark);
                            }}
                            className="text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-white"
                          >
                            Rates & Height
                          </button>

                          <span className="ml-auto font-mono text-slate-400 text-[10px]">
                            {carpark.gantryHeight}m
                          </span>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </aside>

            {/* Right Main Map Canvas */}
            <div className="flex-1 flex flex-col h-full min-h-[500px]">
              <LeafletMap
                carparks={carparks}
                selectedCarpark={selectedCarpark}
                onSelectCarpark={(c) => setSelectedCarpark(c)}
                onOpenDetailModal={handleOpenDetailModal}
                onStartNavigation={handleStartNavigation}
                userLocation={userLocation}
                onUpdateUserLocation={handleUpdateUserLocation}
                activeRoute={activeRoute}
                isDarkMode={isDarkMode}
              />
            </div>
          </div>
        )}

        {/* TAB 2: FULL CARPARK DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="flex flex-col gap-5">
            <FilterBar
              filter={filter}
              setFilter={setFilter}
              totalCount={carparks.length}
              filteredCount={filteredCarparks.length}
            />

            <CarparkList
              carparks={filteredCarparks}
              favorites={favorites}
              onToggleFavorite={handleToggleFavorite}
              onSelectCarpark={handleOpenDetailModal}
              onViewOnMap={handleViewOnMap}
              onResetFilters={resetFilters}
              totalLotsCount={totalLotsCount}
              availableLotsCount={availableLotsCount}
            />
          </div>
        )}

        {/* TAB 3: POPULAR DESTINATION FINDER */}
        {activeTab === 'destinations' && (
          <DestinationFinder
            carparks={processedCarparks}
            onSelectCarpark={handleOpenDetailModal}
            onViewOnMap={handleViewOnMap}
          />
        )}

        {/* TAB 4: PARKING FEE ESTIMATOR */}
        {activeTab === 'calculator' && (
          <div className="py-2">
            <RateCalculatorModal
              carparks={carparks}
              selectedCarpark={calculatorCarpark || selectedCarpark}
              onClose={() => setActiveTab('map')}
            />
          </div>
        )}

        {/* TAB 5: BACKEND BRIDGE & API SETUP */}
        {activeTab === 'backend' && (
          <BackendGuideModal onRefreshData={() => loadCarparks(true)} />
        )}
      </main>

      {/* Carpark Detail Modal */}
      {isDetailModalOpen && (
        <CarparkDetailModal
          carpark={selectedCarpark}
          onClose={() => setIsDetailModalOpen(false)}
          isFavorite={selectedCarpark ? favorites.has(selectedCarpark.id) : false}
          onToggleFavorite={handleToggleFavorite}
          onOpenCalculator={handleOpenCalculator}
          onStartNavigation={handleStartNavigation}
        />
      )}

      {/* Floating Rate Calculator Modal if triggered from card */}
      {isCalculatorModalOpen && activeTab !== 'calculator' && (
        <RateCalculatorModal
          carparks={carparks}
          selectedCarpark={calculatorCarpark || selectedCarpark}
          onClose={() => setIsCalculatorModalOpen(false)}
        />
      )}

      {/* Clean Footer */}
      <footer className="mt-auto border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 transition-colors py-4 text-xs text-slate-500 dark:text-slate-400">
        <div className="max-w-[1600px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-800 dark:text-slate-200">SG ParkLive</span>
            <span aria-hidden="true">·</span>
            <span>Real-time Singapore Parking Navigation</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <span>LTA DataMall & HDB Electronic Parking Systems</span>
            <span aria-hidden="true">·</span>
            <button
              onClick={() => setActiveTab('backend')}
              className="hover:text-emerald-600 dark:hover:text-emerald-400 transition-colors"
            >
              Developer API / Serverless Routes
            </button>
          </div>
        </div>
      </footer>
    </div>
  );
}
