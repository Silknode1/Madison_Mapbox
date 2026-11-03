// ---------------------------------------------------------------------------
// Single source of truth for the map.
//
//  • Add a place      -> append an object to PLACES.
//  • Add a category   -> add an entry to CATEGORIES (color, emoji, label) and use its key in PLACES.
//  • Supabase         -> if configured, the `places` table overrides PLACES at runtime
//                        (see README). Regenerate seed SQL from this file with `npm run seed:sql`.
//
// Place fields
//   id           unique kebab-case string (also used for starred/synced places)
//   category     key of CATEGORIES
//   lat / lng    WGS84 decimal degrees
//   address      street address, or null if unknown
//   description  one short line shown in the popup
//   warning      optional — shown with a ⚠ in the popup for anything not confirmed
//   coordsApprox optional — true when the pin position is a rough guess
//
// Coordinates were geocoded from street addresses / venue names (OpenStreetMap) on 2026-11-02.
// The three Airbnbs have no address, so their pins are placeholders (coordsApprox).
// ---------------------------------------------------------------------------

export const MAP_CENTER = {
  longitude: -89.3841, // Wisconsin State Capitol
  latitude: 43.0747,
  zoom: 13.6,
};

export const CATEGORIES = {
  hotels: { label: 'Hotels', color: '#3b82f6', emoji: '🛏️', hint: 'Downtown stays' },
  airbnbs: { label: 'Airbnbs', color: '#10b981', emoji: '🏠', hint: 'Near the Capitol' },
  events: { label: 'Events', color: '#ef4444', emoji: '🎟️', hint: 'Shows on Nov 6–7' },
  nightlife: { label: 'Nightlife', color: '#f97316', emoji: '🍸', hint: 'Bars, lounges, clubs' },
  packers: { label: 'Packers bars', color: '#16a34a', emoji: '🧀', hint: 'Packers watch spots' },
  vikings: { label: 'Vikings bar', color: '#7c3aed', emoji: '🛡️', hint: 'Vikings watch spot' },
  sports: { label: 'Sports', color: '#8b5cf6', emoji: '🏟️', hint: 'Badgers venues' },
  coffee: { label: 'Coffee', color: '#92400e', emoji: '☕', hint: 'Cafés and roasters' },
  food: { label: 'Food', color: '#ec4899', emoji: '🍽️', hint: 'Eats and drinks' },
};

const PACKERS_NOTE = 'Packers at Patriots — Sun Nov 8, 3:25 pm CT.';

export const PLACES = [
  // ---- Hotels --------------------------------------------------------------
  {
    id: 'madison-concourse',
    name: 'Madison Concourse Hotel',
    category: 'hotels',
    lat: 43.07561,
    lng: -89.38646,
    address: '1 W Dayton St',
    description: 'Downtown hotel a short walk from the Capitol.',
  },
  {
    id: 'doubletree-downtown',
    name: 'DoubleTree by Hilton Madison Downtown',
    category: 'hotels',
    lat: 43.07142,
    lng: -89.3943,
    address: '525 W Johnson St',
    description: 'Downtown hotel near campus and the Kohl Center.',
  },
  {
    id: 'moxy-downtown',
    name: 'Moxy Madison Downtown',
    category: 'hotels',
    lat: 43.08129,
    lng: -89.37376,
    address: '823 E Washington Ave',
    description: 'Hotel in Capitol East, close to The Sylvee and High Noon Saloon.',
  },
  {
    id: 'hampton-inn-downtown',
    name: 'Hampton Inn & Suites Madison Downtown',
    category: 'hotels',
    lat: 43.07273,
    lng: -89.39347,
    address: '440 W Johnson St',
    description: 'Hotel near campus, a short walk to State St.',
  },
  {
    id: 'embassy-suites',
    name: 'Embassy Suites by Hilton Madison Downtown',
    category: 'hotels',
    lat: 43.07386,
    lng: -89.38038,
    address: '231 S Pinckney St',
    description: 'All-suite hotel a couple of blocks off the Capitol Square.',
  },

  // ---- Airbnbs (no addresses yet — pins are placeholders) -------------------
  {
    id: 'restored-1911-flat',
    name: 'Restored 1911 Flat',
    category: 'airbnbs',
    lat: 43.0781,
    lng: -89.3862,
    address: null,
    description: 'Airbnb stay near the Capitol.',
    warning: 'Pin is a placeholder — set the real location in src/data.js.',
    coordsApprox: true,
  },
  {
    id: 'handcrafted-1929-gem',
    name: 'Handcrafted 1929 Gem',
    category: 'airbnbs',
    lat: 43.0722,
    lng: -89.3868,
    address: null,
    description: 'Airbnb stay near downtown.',
    warning: 'Pin is a placeholder — set the real location in src/data.js.',
    coordsApprox: true,
  },
  {
    id: 'the-dylin',
    name: 'The Dylin',
    category: 'airbnbs',
    lat: 43.0788,
    lng: -89.3768,
    address: null,
    description: 'Airbnb stay in the Capitol East area.',
    warning: 'Pin is a placeholder — set the real location in src/data.js.',
    coordsApprox: true,
  },

  // ---- Events (Nov 6–7) ------------------------------------------------------
  {
    id: 'sylvee',
    name: 'The Sylvee — Wage War / Avery Anna',
    category: 'events',
    lat: 43.0808,
    lng: -89.37467,
    address: '25 S Livingston St',
    description: 'Fri Nov 6: Wage War · Sat Nov 7: Avery Anna.',
  },
  {
    id: 'overture',
    name: 'Overture Center — Madison Symphony',
    category: 'events',
    lat: 43.07413,
    lng: -89.38828,
    address: '201 State St',
    description: 'Madison Symphony Tchaikovsky program · Fri & Sat, 7:30 pm.',
  },
  {
    id: 'barrymore',
    name: 'Barrymore Theatre — Better Than Ezra',
    category: 'events',
    lat: 43.09306,
    lng: -89.35227,
    address: '2090 Atwood Ave',
    description: 'Fri Nov 6: Better Than Ezra, 8 pm · Sat Nov 7: Sabrina cast reunion, 7 pm.',
  },
  {
    id: 'high-noon',
    name: 'High Noon Saloon — Unrest Fest',
    category: 'events',
    lat: 43.07972,
    lng: -89.3763,
    address: '701 E Washington Ave',
    description: 'Live-music club in Capitol East.',
    warning: '“Unrest Fest” was not confirmed on the venue’s calendar — check before going.',
  },
  {
    id: 'majestic',
    name: 'Majestic Theatre',
    category: 'events',
    lat: 43.07442,
    lng: -89.3809,
    address: '115 King St',
    description: 'Live music and comedy · Sat Nov 7: Phoebe Robinson, 8 pm.',
    warning: 'Friday’s show was not confirmed — check the venue’s calendar.',
  },

  // ---- Nightlife ---------------------------------------------------------------
  {
    id: 'ivory-room',
    name: 'Ivory Room Piano Bar',
    category: 'nightlife',
    lat: 43.0744,
    lng: -89.38715,
    address: '116 W Mifflin St',
    description: 'Piano bar near the Capitol Square.',
  },
  {
    id: 'liquid',
    name: 'Liquid',
    category: 'nightlife',
    lat: 43.07344,
    lng: -89.39692,
    address: null,
    description: 'Nightlife spot on University Ave, near campus.',
    warning: 'Not verified as open — check hours before going.',
  },
  {
    id: 'sotto',
    name: 'Sotto',
    category: 'nightlife',
    lat: 43.0751,
    lng: -89.39008,
    address: '303 N Henry St',
    description: 'Spot on N Henry St, just off lower State St.',
    warning: 'Not verified — check hours and what it is before going.',
  },
  {
    id: 'kollege-klub',
    name: 'The Kollege Klub',
    category: 'nightlife',
    lat: 43.07566,
    lng: -89.39716,
    address: '529 N Lake St',
    description: 'Campus-area bar on Lake St.',
  },
  {
    id: 'gennas',
    name: 'Genna’s Lounge',
    category: 'nightlife',
    lat: 43.0727,
    lng: -89.38442,
    address: '105 W Main St',
    description: 'Cocktail lounge just south of the Capitol Square.',
  },
  {
    id: 'oz-by-oz',
    name: 'Oz By Oz',
    category: 'nightlife',
    lat: 43.07453,
    lng: -89.38107,
    address: '113 King St',
    description: 'On King St, right next to the Majestic.',
  },

  // ---- Packers bars ------------------------------------------------------------
  {
    id: 'players',
    name: 'Players Sports Bar & Grill',
    category: 'packers',
    lat: 43.09247,
    lng: -89.35456,
    address: '2013 Winnebago St',
    description: `East-side sports bar. ${PACKERS_NOTE}`,
  },
  {
    id: 'wilsons',
    name: 'Wilson’s Bar & Grill',
    category: 'packers',
    lat: 43.09322,
    lng: -89.35045,
    address: '2144 Atwood Ave',
    description: `Atwood Ave sports bar, next to the Barrymore. ${PACKERS_NOTE}`,
  },
  {
    id: 'ljs',
    name: 'LJ’s Sports Tavern & Grill',
    category: 'packers',
    lat: 43.08242,
    lng: -89.37368,
    address: '8 N Paterson St',
    description: `Sports tavern near Capitol East. ${PACKERS_NOTE}`,
  },
  {
    id: 'baked-wings',
    name: 'Baked Wings & Things',
    category: 'packers',
    lat: 43.075,
    lng: -89.38994,
    address: '250 State St',
    description: `Wings on lower State St. ${PACKERS_NOTE}`,
  },
  {
    id: 'jordans',
    name: 'Jordan’s Big Ten Pub',
    category: 'packers',
    lat: 43.06783,
    lng: -89.40789,
    address: '1330 Regent St',
    description: 'Big Ten pub near Camp Randall — expect crowds before Saturday’s 3:15 pm kickoff.',
  },

  // ---- Vikings -----------------------------------------------------------------
  {
    id: 'nitty-gritty',
    name: 'Nitty Gritty',
    category: 'vikings',
    lat: 43.07184,
    lng: -89.39561,
    address: '223 N Frances St',
    description: 'Campus-area bar near State St — the Vikings spot on this map.',
  },

  // ---- Sports ------------------------------------------------------------------
  {
    id: 'camp-randall',
    name: 'Camp Randall Stadium — Badgers vs Rutgers',
    category: 'sports',
    lat: 43.07005,
    lng: -89.41265,
    address: '1440 Monroe St',
    description: 'Sat Nov 7, 3:15 pm kickoff. Expect heavy crowds around campus and Regent St.',
  },
  {
    id: 'kohl-center',
    name: 'Kohl Center — Badgers Basketball',
    category: 'sports',
    lat: 43.06942,
    lng: -89.39688,
    address: '601 W Dayton St',
    description: 'Fri Nov 6 · Badgers vs Delaware, 6:30 pm.',
  },

  // ---- Coffee ------------------------------------------------------------------
  {
    id: 'wonderstate',
    name: 'Wonderstate Coffee',
    category: 'coffee',
    lat: 43.07304,
    lng: -89.38391,
    address: '27 W Main St',
    description: 'Specialty coffee on the Capitol Square.',
  },
  {
    id: 'colectivo-state',
    name: 'Colectivo Coffee (State St)',
    category: 'coffee',
    lat: 43.07467,
    lng: -89.39559,
    address: '583 State St',
    description: 'Wisconsin coffee chain at the campus end of State St.',
  },
  {
    id: 'bradburys',
    name: 'Bradbury’s Coffee',
    category: 'coffee',
    lat: 43.07735,
    lng: -89.38396,
    address: '127 N Hamilton St',
    description: 'Coffee shop just north of the Capitol Square.',
  },
  {
    id: 'ancora',
    name: 'Ancora Cafe + Bakery',
    category: 'coffee',
    lat: 43.08291,
    lng: -89.32442,
    address: '3926 Monona Dr',
    description: 'Ancora café on the east side.',
    warning:
      'Location unconfirmed — map data lists Ancora cafés on Monona Dr and International Ln, none downtown.',
    coordsApprox: true,
  },
  {
    id: 'michelangelos',
    name: 'Michelangelo’s Coffee House',
    category: 'coffee',
    lat: 43.0749,
    lng: -89.38722,
    address: '114 State St',
    description: 'Coffee on lower State St.',
  },

  // ---- Food --------------------------------------------------------------------
  {
    id: 'old-fashioned',
    name: 'The Old Fashioned',
    category: 'food',
    lat: 43.0763,
    lng: -89.38357,
    address: '23 N Pinckney St',
    description: 'Wisconsin tavern on the Square: cheese curds, brats and Old Fashioneds.',
  },
  {
    id: 'great-dane',
    name: 'Great Dane Pub',
    category: 'food',
    lat: 43.07448,
    lng: -89.38008,
    address: '123 E Doty St',
    description: 'Downtown brewpub.',
  },
];
