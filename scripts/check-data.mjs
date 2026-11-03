// Sanity-check src/data.js before you ship:  npm run check:data
import { CATEGORIES, PLACES } from '../src/data.js';
import { HYPE_WINDOWS } from '../src/hype.js';

// Rough bounding box around Madison, WI — catches swapped lat/lng and typos.
// Wide enough for the 20–30 min "Outside town" stays; matches the database's lat/lng checks.
const BOUNDS = { minLat: 42.9, maxLat: 43.3, minLng: -89.7, maxLng: -89.1 };

const errors = [];
const warnings = [];
const seen = new Set();
const perCategory = Object.fromEntries(Object.keys(CATEGORIES).map((k) => [k, 0]));

for (const [key, c] of Object.entries(CATEGORIES)) {
  if (!/^#[0-9a-f]{6}$/i.test(c.color)) errors.push(`category "${key}": color must be #rrggbb`);
  if (!c.label || !c.emoji) errors.push(`category "${key}": needs a label and an emoji`);
}

for (const p of PLACES) {
  const where = p.id ?? p.name ?? '(unnamed place)';
  if (!p.id) errors.push(`${where}: missing id`);
  if (seen.has(p.id)) errors.push(`${where}: duplicate id`);
  seen.add(p.id);

  if (!p.name) errors.push(`${where}: missing name`);
  if (!p.description) errors.push(`${where}: missing description`);

  if (!CATEGORIES[p.category]) errors.push(`${where}: unknown category "${p.category}"`);
  else perCategory[p.category] += 1;

  if (!Number.isFinite(p.lat) || !Number.isFinite(p.lng)) {
    errors.push(`${where}: lat/lng must be numbers`);
  } else if (
    p.lat < BOUNDS.minLat ||
    p.lat > BOUNDS.maxLat ||
    p.lng < BOUNDS.minLng ||
    p.lng > BOUNDS.maxLng
  ) {
    errors.push(`${where}: (${p.lat}, ${p.lng}) is outside the Madison area — lat/lng swapped?`);
  }

  if (p.url && !/^https?:\/\//.test(p.url)) errors.push(`${where}: url must start with http(s)://`);
  if (p.priceLevel != null && ![1, 2, 3, 4].includes(p.priceLevel)) errors.push(`${where}: priceLevel must be 1–4`);

  if (p.coordsApprox) warnings.push(`${where}: pin position is approximate`);
  if (p.warning) warnings.push(`${where}: ${p.warning}`);
}

// Hype windows must point at real places and have a sane time range.
const ids = new Set(PLACES.map((p) => p.id));
for (const w of HYPE_WINDOWS) {
  const s = Date.parse(`${w.start}:00-06:00`);
  const e = Date.parse(`${w.end}:00-06:00`);
  if (!ids.has(w.placeId)) errors.push(`hype: unknown place "${w.placeId}"`);
  if (!(e > s)) errors.push(`hype: ${w.placeId} ${w.start}–${w.end} ends before it starts`);
  if (![1, 2, 3].includes(w.level)) errors.push(`hype: ${w.placeId} level must be 1–3`);
}

console.log(`${PLACES.length} places in ${Object.keys(CATEGORIES).length} categories`);
console.table(perCategory);

if (warnings.length) {
  console.log(`\n⚠  ${warnings.length} item(s) to double-check:`);
  for (const w of warnings) console.log(`   • ${w}`);
}

if (errors.length) {
  console.error(`\n✖ ${errors.length} problem(s):`);
  for (const e of errors) console.error(`   • ${e}`);
  process.exit(1);
}
console.log('\n✔ data.js looks good');
