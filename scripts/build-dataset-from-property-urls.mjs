#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';

const inputFile = process.argv[2] ?? 'data/source/amex-fhr-us.urls.txt';
const outputFile = process.argv[3] ?? 'src/data/hotels.us.fhr.normalized.json';

const normalize = (v) => (v ?? '').toString().trim();
const slugToWords = (slug) =>
  normalize(slug)
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());

const normalizeKey = (v) => normalize(v).toLowerCase().replace(/[^a-z0-9]/g, '');

const parseAmexUrl = (url) => {
  const clean = normalize(url).replace(/[?#].*$/, '');
  const match = clean.match(/\/property\/([^/]+)\/([^/]+)\/([^/]+)$/i);
  if (!match) return null;

  const [, stateSlug, citySlug, hotelSlug] = match;
  const state = stateSlug.replace(/-US$/i, '');

  return {
    name: slugToWords(hotelSlug),
    city: slugToWords(citySlug),
    state: state.length <= 2 ? state.toUpperCase() : state,
    amexUrl: clean,
  };
};

const geocode = async (query) => {
  const url = new URL('https://nominatim.openstreetmap.org/search');
  url.searchParams.set('q', query);
  url.searchParams.set('format', 'jsonv2');
  url.searchParams.set('limit', '1');

  const response = await fetch(url, {
    headers: { 'User-Agent': 'amex-fhr-map-url-import/1.0' },
  });

  if (!response.ok) {
    return { latitude: null, longitude: null };
  }

  const payload = await response.json();
  if (!Array.isArray(payload) || payload.length === 0) {
    return { latitude: null, longitude: null };
  }

  return {
    latitude: Number(payload[0].lat),
    longitude: Number(payload[0].lon),
  };
};

const dedupe = (records) => {
  const seen = new Map();
  for (const record of records) {
    const key = `${normalizeKey(record.name)}|${normalizeKey(record.city)}|${normalizeKey(record.state)}`;
    if (!seen.has(key)) seen.set(key, record);
  }
  return [...seen.values()];
};

const buildRecord = async (parsed) => {
  const geo = await geocode(`${parsed.name}, ${parsed.city}, ${parsed.state}, USA`);
  return {
    id: `${normalizeKey(parsed.state)}-${normalizeKey(parsed.city)}-${normalizeKey(parsed.name)}`,
    name: parsed.name,
    city: parsed.city,
    state: parsed.state,
    address: null,
    latitude: geo.latitude,
    longitude: geo.longitude,
    brand: null,
    amexUrl: parsed.amexUrl,
    websiteUrl: null,
    phone: null,
    description: null,
    isFineHotelsResorts: true,
    dataStatus: geo.latitude !== null && geo.longitude !== null ? 'incomplete' : 'review',
    source: 'AMEX property URL list + geocoding',
    sourceLastChecked: new Date().toISOString().slice(0, 10),
  };
};

const main = async () => {
  const sourcePath = path.resolve(inputFile);
  const outputPath = path.resolve(outputFile);

  const content = await fs.readFile(sourcePath, 'utf-8');
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter((line) => line && !line.startsWith('#'));

  const parsed = lines.map(parseAmexUrl).filter(Boolean);
  const unique = dedupe(parsed);

  const records = [];
  for (const item of unique) {
    records.push(await buildRecord(item));
  }

  await fs.mkdir(path.dirname(outputPath), { recursive: true });
  await fs.writeFile(outputPath, `${JSON.stringify(records, null, 2)}\n`, 'utf-8');

  console.log(`Processed ${lines.length} URLs -> ${records.length} unique hotels`);
  console.log(`Wrote ${outputPath}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
