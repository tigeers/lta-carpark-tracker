import { Carpark, UserLocation, NavigationRoute } from '../types/carpark';
import { INITIAL_CARPARKS } from '../data/singaporeCarparks';

const FAVORITES_KEY = 'sg_parklive_favorites';
const BACKEND_URL_KEY = 'sg_parklive_backend_url';
const DATA_GOV_SG_API = 'https://api.data.gov.sg/v1/transport/carpark-availability';
const LOCAL_API_CARPARK = '/api/carparkavailability';
const LOCAL_API_HEALTH = '/api/health';

export interface DataGovSgCarparkInfo {
  total_lots: string;
  lot_type: string;
  lots_available: string;
}

export interface DataGovSgItem {
  carpark_number: string;
  update_datetime: string;
  carpark_info: DataGovSgCarparkInfo[];
}

export interface LTACarparkItem {
  CarParkID: string;
  Area: string;
  Development: string;
  Location: string; // "lat lng"
  AvailableLots: number;
  LotType: 'C' | 'H' | 'M';
  Agency: string;
}

export interface FetchResult {
  carparks: Carpark[];
  source: 'lta_datamall' | 'data.gov.sg' | 'backend' | 'local_simulated';
  timestamp: string;
  totalLotsCount: number;
  availableLotsCount: number;
  ltaKeyConfigured?: boolean;
  message?: string;
  error?: string;
}

export interface ApiHealthInfo {
  status: 'ok' | 'degraded' | 'offline';
  ltaAccountKeyConfigured: boolean;
  uptimeSeconds: number;
  endpoints: {
    health: string;
    carparkAvailability: string;
  };
}

export class CarparkService {
  private static favorites: Set<string> = new Set();
  private static isInitialized = false;

  private static init() {
    if (this.isInitialized) return;
    try {
      const stored = localStorage.getItem(FAVORITES_KEY);
      if (stored) {
        this.favorites = new Set(JSON.parse(stored));
      }
    } catch {
      // fallback to empty set
    }
    this.isInitialized = true;
  }

  public static getFavorites(): Set<string> {
    this.init();
    return new Set(this.favorites);
  }

  public static toggleFavorite(carparkId: string): boolean {
    this.init();
    const isFav = this.favorites.has(carparkId);
    if (isFav) {
      this.favorites.delete(carparkId);
    } else {
      this.favorites.add(carparkId);
    }
    try {
      localStorage.setItem(FAVORITES_KEY, JSON.stringify(Array.from(this.favorites)));
    } catch {
      // ignore
    }
    return !isFav;
  }

  public static getBackendUrl(): string {
    return localStorage.getItem(BACKEND_URL_KEY) || '';
  }

  public static setBackendUrl(url: string): void {
    localStorage.setItem(BACKEND_URL_KEY, url);
  }

  /**
   * Check health of the serverless /api/health route
   */
  public static async checkHealth(): Promise<ApiHealthInfo> {
    try {
      const res = await fetch(LOCAL_API_HEALTH);
      if (res.ok) {
        const data = await res.json();
        return {
          status: data.status || 'ok',
          ltaAccountKeyConfigured: Boolean(data.environment?.ltaAccountKeyConfigured),
          uptimeSeconds: data.uptimeSeconds || 0,
          endpoints: data.endpoints || {
            health: '/api/health',
            carparkAvailability: '/api/carparkavailability',
          },
        };
      }
    } catch {
      // ignore
    }
    return {
      status: 'offline',
      ltaAccountKeyConfigured: false,
      uptimeSeconds: 0,
      endpoints: {
        health: '/api/health',
        carparkAvailability: '/api/carparkavailability',
      },
    };
  }

  /**
   * Attempts to fetch real data from:
   * 1. Custom backend if specified by user
   * 2. Local serverless route /api/carparkavailability (LTA DataMall CarParkAvailabilityv2)
   * 3. Data.gov.sg open API
   * 4. Comprehensive realistic baseline with subtle real-time updates
   */
  public static async getCarparks(forceLive = false): Promise<FetchResult> {
    this.init();
    const customBackendUrl = this.getBackendUrl();

    // 1. Try Custom Backend URL if explicitly configured
    if (customBackendUrl) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 4000);
        const resp = await fetch(customBackendUrl, { signal: controller.signal });
        clearTimeout(timeoutId);
        if (resp.ok) {
          const data = await resp.json();
          const items: Carpark[] = Array.isArray(data) ? data : data.carparks || [];
          return {
            carparks: items,
            source: 'backend',
            timestamp: new Date().toISOString(),
            totalLotsCount: items.reduce((acc, c) => acc + c.carLots.total, 0),
            availableLotsCount: items.reduce((acc, c) => acc + c.carLots.available, 0),
          };
        }
      } catch (err) {
        console.warn('Custom backend fetch failed, falling back:', err);
      }
    }

    // 2. Try the local serverless /api/carparkavailability endpoint
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      const resp = await fetch(LOCAL_API_CARPARK, { signal: controller.signal });
      clearTimeout(timeoutId);

      if (resp.ok) {
        const data = await resp.json();

        // If LTA DataMall successfully returned records
        if (data.status === 'success' && Array.isArray(data.value) && data.value.length > 0) {
          const ltaList: LTACarparkItem[] = data.value;
          const baselineMap = new Map<string, Carpark>();
          INITIAL_CARPARKS.forEach((c) => baselineMap.set(c.id, { ...c }));

          // Process all LTA records
          const dynamicCarparks: Carpark[] = [];

          ltaList.forEach((item) => {
            const liveAvail = Number(item.AvailableLots) || 0;
            // Check if matches existing baseline carpark
            const existing = baselineMap.get(item.CarParkID) ||
              Array.from(baselineMap.values()).find(
                (c) =>
                  (item.Development && c.name.toLowerCase().includes(item.Development.toLowerCase())) ||
                  (item.CarParkID && c.id.toLowerCase() === item.CarParkID.toLowerCase())
              );

            if (existing) {
              existing.carLots = {
                total: Math.max(existing.carLots.total, liveAvail + 15),
                available: liveAvail,
              };
              existing.updatedAt = new Date().toISOString();
            } else if (item.Location && item.Development) {
              // Parse coordinates "lat lng"
              const parts = item.Location.trim().split(/\s+/);
              const lat = parseFloat(parts[0]);
              const lng = parseFloat(parts[1]);

              if (!isNaN(lat) && !isNaN(lng) && lat > 1.2 && lat < 1.5 && lng > 103.5 && lng < 104.1) {
                dynamicCarparks.push({
                  id: item.CarParkID || `LTA-${Math.random().toString(36).substring(2, 7)}`,
                  name: item.Development,
                  agency: (item.Agency as any) || 'LTA',
                  carparkType: 'Basement Car Park',
                  address: `${item.Development}, Singapore`,
                  area: (item.Area as any) || 'Central / Orchard',
                  coordinates: { lat, lng },
                  parkingSystem: 'Electronic Parking System (EPS)',
                  shortTermParking: 'WHOLE DAY',
                  freeParking: 'NO',
                  nightParking: true,
                  gantryHeight: 2.1,
                  carLots: { total: Math.max(liveAvail + 30, 200), available: liveAvail },
                  rates: {
                    weekdayDay: '$1.50 1st hr, $0.50/subsq 15m',
                    weekdayNight: '$3.50/entry (after 6pm)',
                    weekendDay: '$2.00 1st hr, $0.60/subsq 15m',
                    weekendNight: '$3.50/entry',
                    gracePeriodMinutes: 10,
                    perHalfHourRate: 1.0,
                  },
                  updatedAt: new Date().toISOString(),
                  historicalTrend: [15, 25, 50, 75, 88, 92, 88, 80, 75, 82, 90, 94, 88, 78, 62, 45, 28, 16],
                });
              }
            }
          });

          const allMerged = [...Array.from(baselineMap.values()), ...dynamicCarparks];

          return {
            carparks: allMerged,
            source: 'lta_datamall',
            timestamp: new Date().toISOString(),
            totalLotsCount: allMerged.reduce((acc, c) => acc + c.carLots.total, 0),
            availableLotsCount: allMerged.reduce((acc, c) => acc + c.carLots.available, 0),
            ltaKeyConfigured: true,
            message: `Loaded ${allMerged.length} carparks with real-time lots from LTA DataMall`,
          };
        }
      }
    } catch {
      // Local serverless route offline or during pure client preview, proceed to fallback
    }

    // 3. Fallback: High-fidelity realistic comprehensive dataset with dynamic live fluctuations
    const simulated = INITIAL_CARPARKS.map((carpark) => {
      const delta = Math.floor(Math.random() * 7) - 3;
      const newAvail = Math.max(2, Math.min(carpark.carLots.total - 5, carpark.carLots.available + delta));
      return {
        ...carpark,
        carLots: { ...carpark.carLots, available: newAvail },
        updatedAt: new Date().toISOString(),
      };
    });

    return {
      carparks: simulated,
      source: 'local_simulated',
      timestamp: new Date().toISOString(),
      totalLotsCount: simulated.reduce((acc, c) => acc + c.carLots.total, 0),
      availableLotsCount: simulated.reduce((acc, c) => acc + c.carLots.available, 0),
      ltaKeyConfigured: false,
    };
  }

  /**
   * Calculate distance between two lat/lng coordinates in km using Haversine formula
   */
  public static calculateDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371;
    const dLat = ((lat2 - lat1) * Math.PI) / 180;
    const dLon = ((lon2 - lon1) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((lat1 * Math.PI) / 180) *
        Math.cos((lat2 * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return Math.round(R * c * 10) / 10;
  }

  /**
   * Generate route navigation details from an origin point to a destination carpark
   */
  public static calculateRoute(origin: UserLocation, destination: Carpark): NavigationRoute {
    const dist = this.calculateDistanceKm(
      origin.lat,
      origin.lng,
      destination.coordinates.lat,
      destination.coordinates.lng
    );

    // Approximate travel times in Singapore (avg speed ~35 km/h urban, walk ~4.5 km/h)
    const driveTime = Math.max(3, Math.round((dist / 35) * 60));
    const walkTime = Math.round((dist / 4.5) * 60);

    const steps = [
      `Head out from ${origin.name}`,
      dist > 5 ? 'Merge onto nearest Expressway (PIE / CTE / AYE / ECP)' : 'Continue on arterial road towards planning zone',
      `Take exit toward ${destination.area.split('/')[0].trim()}`,
      `Turn into ${destination.address}`,
      `Arrive at ${destination.name} gantry clearance ${destination.gantryHeight}m (EPS)`,
    ];

    return {
      origin,
      destination,
      distanceKm: dist,
      driveTimeMins: driveTime,
      walkTimeMins: walkTime,
      steps,
    };
  }
}
