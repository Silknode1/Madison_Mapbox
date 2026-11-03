// Sanity-check src/data.js before you ship:  npm run check:data
import { CATEGORIES, PLACES } from '../src/data.js';

// Rough bounding box around Madison, WI — catches swapped lat/lng and typos.
const BOUNDS = { minLat: 42.95, maxLat: 43.2, minLng: -89.6, maxLng: -89.2 };

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

  if (p.coordsApprox) warnings.push(`${where}: pin position is approximate`);
  if (p.warning) warnings.push(`${where}: ${p.warning}`);
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
