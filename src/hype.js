// ---------------------------------------------------------------------------
// Hype meter data: when each place is expected to be busy over the weekend.
//
// This is NOT live foot traffic. It's built from the schedule (show times, kickoffs,
// sell-outs) researched on Nov 2–3, 2026. `verified: true` means the signal itself comes
// from the venue / team / ticketing source (e.g. "SOLD OUT"); everything else is an estimate.
//
// Times are Madison local time ("YYYY-MM-DDTHH:MM", CST = UTC-6 after Nov 1).
// Levels: 1 = busier than usual · 2 = busy · 3 = near capacity / sold out.
// A window may cross midnight; just give the real end date.
// ---------------------------------------------------------------------------

export const HYPE_LEVELS = {
  1: { label: 'Busier than usual' },
  2: { label: 'Busy' },
  3: { label: 'Near capacity' },
};

// Preset times for the "Hype at" picker (plus "Right now").
export const HYPE_TIMES = [
  { value: '2026-11-06T18:30', label: 'Fri 6:30 pm' },
  { value: '2026-11-06T21:00', label: 'Fri 9 pm' },
  { value: '2026-11-07T10:00', label: 'Sat 10 am' },
  { value: '2026-11-07T14:00', label: 'Sat 2 pm · pre-game' },
  { value: '2026-11-07T20:00', label: 'Sat 8 pm' },
  { value: '2026-11-07T23:00', label: 'Sat 11 pm' },
  { value: '2026-11-08T15:00', label: 'Sun 3 pm · Packers' },
  { value: '2026-11-08T20:00', label: 'Sun 8 pm' },
];

// The weekend itself; outside it, the picker opens on a preset instead of "Right now".
export const WEEKEND = { start: '2026-11-06T06:00', end: '2026-11-09T02:00' };
export const DEFAULT_PREVIEW = '2026-11-07T20:00';

const REGENT_BARS = ['jordans', 'luckys-1313', 'sconniebar', 'kollege-klub'];
const PACKERS_BARS = ['players', 'wilsons', 'ljs', 'baked-wings', 'jordans'];
const SATURDAY_NIGHT_BARS = ['gennas', 'ivory-room', 'merchant', 'oz-by-oz', 'settle-down'];
const DINNER_HOTSPOTS = ['letoile', 'graze', 'heritage-tavern', 'harvey-house'];
const SQUARE_COFFEE = ['wonderstate', 'colectivo-state'];

const each = (ids, window) => ids.map((placeId) => ({ placeId, ...window }));

export const HYPE_WINDOWS = [
  // ---- Friday Nov 6 ---------------------------------------------------------
  { placeId: 'majestic', start: '2026-11-06T19:00', end: '2026-11-06T23:00', level: 3, verified: true,
    reason: 'West 22nd w/ The 4411 — sold out' },
  { placeId: 'sylvee', start: '2026-11-06T17:30', end: '2026-11-06T23:00', level: 2,
    reason: 'Wage War w/ We Came As Romans (doors 5:30, show 7)' },
  { placeId: 'barrymore', start: '2026-11-06T19:00', end: '2026-11-06T23:00', level: 2,
    reason: 'Better Than Ezra, 8 pm' },
  { placeId: 'high-noon', start: '2026-11-06T19:00', end: '2026-11-06T23:00', level: 1,
    reason: 'Six Foot Blonde, 8 pm' },
  { placeId: 'overture', start: '2026-11-06T18:30', end: '2026-11-06T22:00', level: 2,
    reason: 'Madison Symphony 7:30 pm (prelude talk 6:30) + “Gaslight”' },
  { placeId: 'kohl-center', start: '2026-11-06T17:45', end: '2026-11-06T21:00', level: 1,
    reason: 'Badgers basketball vs Delaware, 6:30 tip' },
  { placeId: 'turn-key', start: '2026-11-06T17:00', end: '2026-11-06T20:30', level: 1,
    reason: 'Friday fish fry night' },
  ...each(DINNER_HOTSPOTS, { start: '2026-11-06T18:00', end: '2026-11-06T21:00', level: 1,
    reason: 'Friday dinner rush — book ahead' }),

  // ---- Saturday Nov 7: market morning, game day, big show night -----------------
  { placeId: 'farmers-market', start: '2026-11-07T06:15', end: '2026-11-07T13:45', level: 1,
    reason: 'Farmers’ Market on the Square' },
  { placeId: 'farmers-market', start: '2026-11-07T09:00', end: '2026-11-07T11:30', level: 2,
    reason: 'Market peak — go before 9 for elbow room' },
  ...each(SQUARE_COFFEE, { start: '2026-11-07T08:30', end: '2026-11-07T11:30', level: 1,
    reason: 'Farmers’ Market crowd on the Square' }),
  { placeId: 'winter-art-fair', start: '2026-11-07T10:00', end: '2026-11-07T13:00', level: 1,
    reason: 'Winter Art Fair peak' },
  { placeId: 'camp-randall', start: '2026-11-07T11:30', end: '2026-11-07T19:00', level: 3,
    reason: 'Badgers vs Rutgers, 3:15 kickoff (tickets still plentiful; streets packed)' },
  ...each(REGENT_BARS, { start: '2026-11-07T11:00', end: '2026-11-07T15:15', level: 3,
    reason: 'Pre-game crowd before the 3:15 kickoff' }),
  ...each(REGENT_BARS, { start: '2026-11-07T18:30', end: '2026-11-07T21:00', level: 2,
    reason: 'Post-game crowd' }),
  { placeId: 'moxy-downtown', start: '2026-11-07T16:00', end: '2026-11-07T18:00', level: 2, verified: true,
    reason: 'Q106 Avery Anna pre-show on the Ático rooftop' },
  { placeId: 'sylvee', start: '2026-11-07T18:00', end: '2026-11-07T23:00', level: 3, verified: true,
    reason: 'Avery Anna — sold out' },
  { placeId: 'high-noon', start: '2026-11-07T18:00', end: '2026-11-07T23:59', level: 2,
    reason: 'Unrest Fest 2026 (doors 6, show 7)' },
  { placeId: 'orpheum-attell', start: '2026-11-07T19:00', end: '2026-11-07T22:30', level: 2,
    reason: 'Dave Attell, 8 pm' },
  { placeId: 'majestic', start: '2026-11-07T19:00', end: '2026-11-07T22:30', level: 1,
    reason: 'Phoebe Robinson, 8 pm (tickets available)' },
  { placeId: 'barrymore', start: '2026-11-07T18:00', end: '2026-11-07T22:00', level: 1,
    reason: 'Sabrina cast reunion, 7 pm' },
  { placeId: 'overture', start: '2026-11-07T18:30', end: '2026-11-07T22:00', level: 2,
    reason: 'Madison Symphony 7:30 pm + “Gaslight”' },
  ...each(DINNER_HOTSPOTS, { start: '2026-11-07T18:00', end: '2026-11-07T21:00', level: 2,
    reason: 'Saturday dinner peak — 7 pm tables likely gone' }),
  ...each(SATURDAY_NIGHT_BARS, { start: '2026-11-07T21:00', end: '2026-11-08T01:30', level: 1,
    reason: 'Saturday night + post-game crowd' }),

  // ---- Sunday Nov 8 ------------------------------------------------------------------
  { placeId: 'winter-art-fair', start: '2026-11-08T10:00', end: '2026-11-08T13:00', level: 1,
    reason: 'Winter Art Fair, last day' },
  { placeId: 'overture', start: '2026-11-08T13:30', end: '2026-11-08T16:45', level: 2,
    reason: 'Madison Symphony matinee, 2:30 pm' },
  ...each(PACKERS_BARS, { start: '2026-11-08T14:30', end: '2026-11-08T18:30', level: 2,
    reason: 'Packers at Patriots, 3:25 pm' }),
  { placeId: 'sylvee', start: '2026-11-08T18:30', end: '2026-11-08T23:00', level: 2,
    reason: 'Cheap Trick, 8 pm (doors 6:30)' },
];
