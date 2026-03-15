# AMEX Fine Hotels + Resorts USA Explorer

Premium, map-first single-page app for exploring **AMEX Fine Hotels + Resorts** properties in the United States.

## Features

- Interactive USA map (Leaflet + OSM tiles)
- Marker clustering for dense views
- Fast search across name, city, state, address, and brand
- Filters for state, city, and brand
- Side-panel results with active selection highlighting
- Marker-click and list-click synchronization
- Auto fit-bounds to visible results
- Empty state messaging for no matches
- Data quality status tags (`confirmed`, `review`, `incomplete`)

## Tech stack

- React + TypeScript + Vite
- Tailwind CSS
- React-Leaflet + react-leaflet-cluster

## Quick start

```bash
npm install
npm run dev
```

Open `http://localhost:5173`.

## Current dataset in app

The app currently uses:

- `src/data/hotels.us.fhr.full.json`

This file currently contains a full US-only FHR property list derived from the US Credit Card Guide FHR/THC map feed and filtered to `Program = FHR` + `-US` AMEX property paths.

## Normalized schema

```ts
{
  id: string;
  name: string;
  city: string;
  state: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  brand: string | null;
  amexUrl: string | null;
  websiteUrl: string | null;
  phone: string | null;
  description: string | null;
  isFineHotelsResorts: boolean;
  dataStatus: 'confirmed' | 'incomplete' | 'review';
  source: string;
  sourceLastChecked: string;
}
```

## Data refresh workflows

### A) Refresh full US FHR list from USCCG map feed

```bash
npm run data:refresh:usccg -- src/data/hotels.us.fhr.full.json
```

- Downloads Google My Maps KML used by US Credit Card Guide map
- Filters to `Program = FHR`
- Filters to US AMEX property URLs (`/property/<State-US>/...`)
- Dedupe by AMEX URL
- Writes normalized JSON for UI use

Script: `scripts/refresh-fhr-from-usccg-map.mjs`

### B) Preferred when available: official AMEX export (CSV/JSON)

1. Export/compile a US-only FHR source file from official AMEX travel inventory.
2. Save as CSV/JSON (template: `data/source/amex-fhr-us.template.csv`).
3. Run:

```bash
npm run data:refresh -- data/source/amex-fhr-us.csv src/data/hotels.us.fhr.normalized.json
```

Script: `scripts/refresh-fhr-data.mjs`

### C) Fallback: build dataset from AMEX property URL list

If you have a URL dump but no structured export, paste one URL per line into:

- `data/source/amex-fhr-us.urls.txt`

Then run:

```bash
npm run data:from-urls -- data/source/amex-fhr-us.urls.txt src/data/hotels.us.fhr.normalized.json
```

Script: `scripts/build-dataset-from-property-urls.mjs`

## Source and validation notes

- Detailed sourcing and assumptions: `docs/data-sourcing-notes.md`
- Additional review list for older sample rows: `docs/unconfirmed-properties.md`

## Notes on data confidence

- This repo now includes a substantially expanded US FHR dataset.
- Some fields may remain `null` if missing from source metadata (e.g., full address, phone, brand).
- Revalidate against official AMEX inventory periodically.
