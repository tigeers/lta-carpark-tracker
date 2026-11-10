# SG ParkLive - Singapore Carpark Tracker

A real-time Singapore carpark lot availability tracking web application built with React, TypeScript, and Tailwind CSS v4.

## Features

- **Interactive Singapore Vector Map**: Live color-coded occupancy indicators (Green $>25\%$, Amber $8\text{--}25\%$, Red $<8\%$), SVG landmass with planning zones and major expressways, pan/zoom, and quick filters (EV charging, shopping malls, high vacancy).
- **Carpark Directory**: Search and filter across HDB, URA, and major shopping mall carparks with tabular numbers and real-time availability ratios.
- **Carpark Details & Navigation**: Live vacancy meters, multi-lot category breakdowns (Cars, Motorcycles, Heavy vehicles, EV charging), gantry height clearance check, and 1-tap navigation deeplinks to Google Maps, Waze, and Apple Maps.
- **Singapore Parking Fee Estimator**: Calculates EPS 30-minute block charges, grace period deductions, Sunday/PH free parking rules, and night parking caps.
- **Destination & Nearby Finder**: Find and rank the closest carparks to popular shopping belts and landmarks (ION Orchard, Marina Bay Sands, Chinatown, VivoCity, Jewel Changi, Jurong Gateway, etc.) with walking distance and time calculations.
- **Backend Bridge**: Built-in developer guide and configurable endpoint tester to seamlessly connect custom backend servers or real-time data feeds from Singapore `data.gov.sg` and LTA DataMall.

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite
- **Styling**: Tailwind CSS v4 with Light and Dark mode
- **Icons**: Lucide React
- **Animations**: Motion

## Getting Started

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build
```
