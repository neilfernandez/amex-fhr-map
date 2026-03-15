#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import process from 'node:process';
import Papa from 'papaparse';

/**
 * Refresh pipeline:
 * 1. Start from an official AMEX export (CSV/JSON) scoped to FHR + US only.
 * 2. Normalize fields.
 * 3. Deduplicate by normalized name + city + state.
 * 4. Geocode missing coordinates via Nominatim (OpenStreetMap).
 */

const sourceFile = process.argv[2] ?? 'data/source/amex-fhr-us.csv';
const outputFile = process.argv[3] ?? 'src/data/hotels.us.fhr.normalized.json';

const normalizeText = (value) => (value ?? '').toString().trim();
const normalizeKey = (value) => normalizeText(value).toLowerCase().replace(/[^a-z0-9]/g, '');

const geocodeAddress = async (query) => {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'json');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: {
      'User-Agent': 'amex-fhr-map-refresh-script/1.0 (local tooling)',
    },
  });

  if (!response.ok) {
    throw new Error(`Geocoding failed (${response.status}) for: ${query}`);
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) return { latitude: null, longitude: null };

  return { latitude: Number(payload[0].lat), longitude: Number(payload[0].lon) };
};

const parseSource = async (sourcePath) => {
  const content = await fs.readFile(sourcePath, 'utf-8');

  if (sourcePath.endsWith('.json')) {
    const parsed = JSON.parse(content);
    if (!Array.isArray(parsed)) throw new Error('JSON source must be an array of hotel objects');
    return parsed;
  }

  const result = Papa.parse(content, { header: true, skipEmptyLines: true });
  if (result.errors.length > 0) {
    throw new Error(`CSV parse errors: ${result.errors.map((error) => error.message).join('; ')}`);
  }

  return result.data;
};

const normalizeRecord = (record) => {
  const name = normalizeText(record.name ?? record.hotel_name);
  const city = normalizeText(record.city);
  const state = normalizeText(record.state);

  return {
    id: [state, city, name].map(normalizeKey).filter(Boolean).join('-'),
    name,
    city,
    state,
    address: normalizeText(record.address) || null,
    latitude: record.latitude ? Number(record.latitude) : null,
    longitude: record.longitude ? Number(record.longitude) : null,
    brand: normalizeText(record.brand) || null,
    amexUrl: normalizeText(record.amex_url) || null,
    websiteUrl: normalizeText(record.website_url) || null,
    phone: normalizeText(record.phone) || null,
    description: normalizeText(record.description) || null,
    isFineHotelsResorts: true,
    dataStatus: 'incomplete',
    source: normalizeText(record.source) || 'Official AMEX export',
    sourceLastChecked: new Date().toISOString().slice(0, 10),
  };
};

const dedupe = (records) => {
  const seen = new Map();

  for (const record of records) {
    const key = `${normalizeKey(record.name)}|${normalizeKey(record.city)}|${normalizeKey(record.state)}`;
    const existing = seen.get(key);

    if (!existing) {
      seen.set(key, record);
      continue;
    }

    const merged = { ...existing };
    for (const [field, value] of Object.entries(record)) {
      if (merged[field] === null || merged[field] === '' || merged[field] === 'incomplete') {
        merged[field] = value;
      }
    }

    seen.set(key, merged);
  }

  return [...seen.values()];
};

const main = async () => {
  const sourcePath = path.resolve(sourceFile);
  const outputPath = path.resolve(outputFile);

  const sourceRecords = await parseSource(sourcePath);

  const usFhr = sourceRecords
    .filter((record) => {
      const country = normalizeText(record.country ?? record.country_code ?? 'US').toUpperCase();
      const program = normalizeText(record.collection ?? record.program ?? 'FHR').toLowerCase();
      return country === 'US' && (program.includes('fine hotels') || program.includes('fhr'));
    })
    .map(normalizeRecord)
    .filter((record) => record.name && record.city && record.state);

  const deduped = dedupe(usFhr);

  for (const record of deduped) {
    if (record.latitude !== null && record.longitude !== null) {
      record.dataStatus = 'confirmed';
      continue;
    }

    if (record.address) {
      const geocoded = await geocodeAddress(`${record.address}, ${record.city}, ${record.state}, USA`);
      record.latitude = geocoded.latitude;
      record.longitude = geocoded.longitude;
    }

    record.dataStatus = record.latitude !== null && record.longitude !== null ? 'confirmed' : 'review';
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(deduped, null, 2)}\n`, 'utf-8');

  console.log(`Wrote ${deduped.length} normalized records to ${outputPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
