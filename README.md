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

## Dataset layout

The UI reads from:

- `src/data/hotels.us.fhr.sample.json` (sample starter data)

Normalized shape:

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

### A) Preferred: official AMEX export (CSV/JSON)

1. Export/compile a US-only FHR source file from official AMEX travel inventory.
2. Save as CSV/JSON (template: `data/source/amex-fhr-us.template.csv`).
3. Run:

```bash
npm run data:refresh -- data/source/amex-fhr-us.csv src/data/hotels.us.fhr.normalized.json
```

What it does:

- filters to `country = US` and FHR rows
- normalizes fields
- deduplicates by `name + city + state`
- geocodes missing coordinates
- marks unresolved rows as `review`

Script: `scripts/refresh-fhr-data.mjs`

### B) Fallback: build dataset from AMEX property URLs list

If you cannot export full inventory but can collect property URLs from AMEX (or browser logs), paste URLs into:

- `data/source/amex-fhr-us.urls.txt`

Then run:

```bash
npm run data:from-urls -- data/source/amex-fhr-us.urls.txt src/data/hotels.us.fhr.normalized.json
```

This importer:

- parses name/city/state from AMEX property URLs
- deduplicates records
- geocodes approximate coordinates
- marks rows `incomplete`/`review` until address/brand/phone are confirmed

Script: `scripts/build-dataset-from-property-urls.mjs`

## Notes on data confidence

- Sample dataset intentionally includes both `confirmed` and `review` rows to demonstrate uncertain/missing handling.
- See `docs/unconfirmed-properties.md` for sample entries pending reconfirmation.
- No synthetic hotels are generated: refresh/import scripts only transform provided source rows/URLs.
