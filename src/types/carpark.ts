export type AgencyType = 'HDB' | 'URA' | 'LTA' | 'Commercial';

export type CarparkType =
  | 'Multi-Storey Car Park'
  | 'Basement Car Park'
  | 'Surface Car Park'
  | 'Covered Car Park'
  | 'Mechanised Car Park';

export type PlanningArea =
  | 'Central / Orchard'
  | 'Downtown / Marina'
  | 'East / Tampines & Bedok'
  | 'West / Jurong & Clementi'
  | 'North / Woodlands & Yishun'
  | 'North-East / Punggol & Hougang';

export type LotCategory = 'C' | 'H' | 'M' | 'EV'; // Car, Heavy, Motorcycle, EV

export interface LotBreakdown {
  total: number;
  available: number;
}

export interface EVChargerInfo {
  total: number;
  available: number;
  powerKw: number;
  connectorType: string;
}

export interface ParkingRates {
  weekdayDay: string; // e.g. "$0.60 / 30 mins"
  weekdayNight: string; // e.g. "$0.60 / 30 mins, max $5.00"
  weekendDay: string;
  weekendNight: string;
  gracePeriodMinutes: number; // e.g. 10 or 15 mins
  perHalfHourRate: number; // numeric for calculator, e.g. 0.60, 1.20, 1.50, 2.80
  nightCap?: number;
}

export interface Carpark {
  id: string; // e.g. "ACB", "TP24", "MBS-01"
  name: string;
  agency: AgencyType;
  carparkType: CarparkType;
  address: string;
  postalCode?: string;
  area: PlanningArea;
  coordinates: {
    lat: number;
    lng: number;
  };
  parkingSystem: 'Electronic Parking System (EPS)' | 'Coupon Parking';
  shortTermParking: 'WHOLE DAY' | '7AM-10.30PM' | 'NO';
  freeParking: 'SUN & PH ONLY' | 'NO' | 'WEEKENDS AFTER 6PM';
  nightParking: boolean;
  gantryHeight: number; // meters, e.g. 2.15, 1.9, 4.5
  carLots: LotBreakdown;
  motorcycleLots?: LotBreakdown;
  heavyLots?: LotBreakdown;
  evChargers?: EVChargerInfo;
  rates: ParkingRates;
  updatedAt: string; // ISO string
  historicalTrend: number[]; // 18 data points representing occupancy % from 6:00 to 23:00
  distanceKm?: number;
}

export interface CarparkFilterState {
  searchQuery: string;
  area: string; // 'all' or specific area
  agency: string; // 'all' or specific agency
  vehicleType: 'all' | 'car' | 'motorcycle' | 'heavy' | 'ev';
  availabilityStatus: 'all' | 'available' | 'limited' | 'full'; // available (>25%), limited (5-25%), full (0-5%)
  minGantryHeight: number; // 0 = any, 1.9, 2.0, 2.1, 2.5
  freeParkingOnly: boolean;
  evChargingOnly: boolean;
  sortBy: 'availability' | 'lots' | 'name' | 'distance';
}

export interface PopularDestination {
  id: string;
  name: string;
  category: string;
  area: PlanningArea;
  lat: number;
  lng: number;
  recommendedCarparkIds: string[];
}

export interface UserLocation {
  lat: number;
  lng: number;
  name: string;
  isCustom?: boolean;
}

export interface NavigationRoute {
  origin: UserLocation;
  destination: Carpark;
  distanceKm: number;
  driveTimeMins: number;
  walkTimeMins: number;
  steps: string[];
}
