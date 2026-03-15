#!/usr/bin/env node
import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const mapKmlUrl = 'https://www.google.com/maps/d/kml?mid=1HygPCP9ghtDptTNnpUpd_C507Mq_Fhec&forcekml=1';
const outputFile = process.argv[2] ?? 'src/data/hotels.us.fhr.full.json';

const stateToAbbrev = {
  Alabama: 'AL', Alaska: 'AK', Arizona: 'AZ', Arkansas: 'AR', California: 'CA', Colorado: 'CO', Connecticut: 'CT', Delaware: 'DE', Florida: 'FL', Georgia: 'GA', Hawaii: 'HI', Idaho: 'ID', Illinois: 'IL', Indiana: 'IN', Iowa: 'IA', Kansas: 'KS', Kentucky: 'KY', Louisiana: 'LA', Maine: 'ME', Maryland: 'MD', Massachusetts: 'MA', Michigan: 'MI', Minnesota: 'MN', Mississippi: 'MS', Missouri: 'MO', Montana: 'MT', Nebraska: 'NE', Nevada: 'NV', 'New-Hampshire': 'NH', 'New-Jersey': 'NJ', 'New-Mexico': 'NM', 'New-York': 'NY', 'North-Carolina': 'NC', 'North-Dakota': 'ND', Ohio: 'OH', Oklahoma: 'OK', Oregon: 'OR', Pennsylvania: 'PA', 'Rhode-Island': 'RI', 'South-Carolina': 'SC', 'South-Dakota': 'SD', Tennessee: 'TN', Texas: 'TX', Utah: 'UT', Vermont: 'VT', Virginia: 'VA', Washington: 'WA', 'West-Virginia': 'WV', Wisconsin: 'WI', Wyoming: 'WY', 'District-of-Columbia': 'DC', 'Puerto-Rico': 'PR',
};

const decodeXml = (value) =>
  value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, '$1')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const titleSlug = (slug) =>
  slug
    .replace(/[-_]+/g, ' ')
    .trim()
    .split(/\s+/)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');

const normalizeIdPart = (value) => value.toLowerCase().replace(/[^a-z0-9]+/g, '');

const extractTag = (xml, tag) => {
  const match = xml.match(new RegExp(`<${tag}>([\\s\\S]*?)</${tag}>`, 'i'));
  return match ? decodeXml(match[1].trim()) : null;
};

const parseDescriptionFields = (description) => {
  const fields = {};
  for (const row of description.split(/<br\s*\/?\s*>/i)) {
    const index = row.indexOf(':');
    if (index === -1) continue;
    fields[row.slice(0, index).trim()] = row.slice(index + 1).trim();
  }
  return fields;
};

const parsePlacemark = (placemarkXml) => {
  const name = extractTag(placemarkXml, 'name') ?? '';
  const description = extractTag(placemarkXml, 'description') ?? '';
  const coordinates = extractTag(placemarkXml, 'coordinates');

  const fields = parseDescriptionFields(description);
  if (fields.Program !== 'FHR') return null;

  const amexUrl = fields.Amex_Reservation;
  if (!amexUrl) return null;

  const pathMatch = amexUrl.match(/\/property\/([^/]+)\/([^/]+)\/([^/?#]+)/i);
  if (!pathMatch) return null;

  const stateSlug = pathMatch[1];
  if (!stateSlug.endsWith('-US')) return null;

  const stateKey = stateSlug.replace(/-US$/i, '');
  const city = titleSlug(pathMatch[2]);
  const state = stateToAbbrev[stateKey] ?? stateKey;

  let latitude = null;
  let longitude = null;

  const locMatch = (fields.location ?? '').match(/\[\s*([-0-9.]+)\s*,\s*([-0-9.]+)\s*\]/);
  if (locMatch) {
    latitude = Number(locMatch[1]);
    longitude = Number(locMatch[2]);
  } else if (coordinates) {
    const points = coordinates.split(',').map((part) => part.trim());
    if (points.length >= 2) {
      longitude = Number(points[0]);
      latitude = Number(points[1]);
    }
  }

  const id = `${state.toLowerCase()}-${normalizeIdPart(city)}-${normalizeIdPart(name)}`;

  return {
    id,
    name,
    city,
    state,
    address: null,
    latitude,
    longitude,
    brand: null,
    amexUrl,
    websiteUrl: fields.hotelft_link ?? null,
    phone: null,
    description: null,
    isFineHotelsResorts: true,
    dataStatus: latitude !== null && longitude !== null ? 'incomplete' : 'review',
    source: 'US Credit Card Guide FHR/THC Google Map (Program=FHR, US filter)',
    sourceLastChecked: new Date().toISOString().slice(0, 10),
  };
};


const execFileAsync = promisify(execFile);

const downloadKml = async () => {
  const { stdout } = await execFileAsync('curl', ['-L', mapKmlUrl, '-A', 'Mozilla/5.0', '--silent', '--show-error'], { maxBuffer: 20 * 1024 * 1024 });
  return stdout;
};

const dedupe = (rows) => {
  const seen = new Map();
  for (const row of rows) {
    const key = row.amexUrl ?? `${row.name}|${row.city}|${row.state}`;
    if (!seen.has(key)) seen.set(key, row);
  }
  return [...seen.values()];
};

const main = async () => {
  const kml = await downloadKml();
  const placemarks = [...kml.matchAll(/<Placemark>[\s\S]*?<\/Placemark>/g)].map((match) => match[0]);
  const parsed = dedupe(placemarks.map(parsePlacemark).filter(Boolean));
  parsed.sort((a, b) => `${a.state}|${a.city}|${a.name}`.localeCompare(`${b.state}|${b.city}|${b.name}`));

  const out = path.resolve(outputFile);
  await fs.mkdir(path.dirname(out), { recursive: true });
  await fs.writeFile(out, `${JSON.stringify(parsed, null, 2)}\n`, 'utf-8');

  console.log(`Wrote ${parsed.length} US FHR properties to ${out}`);
};

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
