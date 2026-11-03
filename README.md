# Madison Weekend Map

An interactive map of Madison, WI for the weekend of **Nov 6–8, 2026**: hotels, Airbnbs, shows, bars, Packers/Vikings watch spots, coffee and food. Built with **React + Vite**, **react-map-gl** and **Mapbox GL JS**, and designed to work well on an iPhone.

- **Mapbox Standard** basemap with 3D buildings and real dawn/day/dusk/night lighting (plus Satellite and Minimal) — pick it from the layers button under the zoom controls
- Color-coded pins (plus a per-category emoji so similar hues stay distinguishable), category chips with **All / None**
- **Hype meter**: pins glow and pulse where crowds are expected at the chosen time (show times, kickoffs, sell-outs) — schedule-based, not live
- Live search with a results dropdown (tap a result to fly to it and open its popup)
- Popups with **price** ($–$$$$ or ticket prices; nightly rate for stays), **website**, **miles from the epicenter** (the median center of all pins), Apple Maps directions
- **Lists**: ★ Starred, Fri night, Saturday, Sunday, Maybe, plus your own — synced between two phones with **Supabase**
- "Outside town" stays 20–30 minutes out, in case downtown fills up for the game

## Quick start

```bash
npm install
cp .env.example .env.local      # then edit .env.local
npm run dev
```

1. Create a **public** Mapbox token (starts with `pk.`) at <https://account.mapbox.com/access-tokens/>.
2. Put it in `.env.local` as `VITE_MAPBOX_TOKEN=pk.…`. (Until you do, the app shows a setup screen instead of a broken map.)
3. Open the URL Vite prints. It also prints a **Network** URL, which you can open on your iPhone on the same Wi-Fi.

> **iPhone note:** browsers only allow "locate me" on HTTPS. The Network URL is plain HTTP, so the location button won't work there. Deploy it (Vercel, Netlify, GitHub Pages, …) and use the HTTPS link. In Safari, **Share → Add to Home Screen** gives you a full-screen app.
>
> Restrict your Mapbox token to the URLs you'll actually use (localhost + your deployed domain).

## Where things live

```
src/
  data.js                  <- ALL the places + categories (edit this)
  hype.js                  <- when each place is expected to be busy (edit this)
  App.jsx                  state: filters, search, selection; renders the map + panel
  App.css                  styles (tokens at the top; phone layout at the bottom)
  components/
    SearchBar.jsx          input + dropdown (closes on outside click, arrow-key navigation)
    CategoryFilters.jsx    chips, All / None, "Starred only"
    Legend.jsx             collapsible legend
    PlaceMarker.jsx        one pin
    PlacePopup.jsx         popup contents (price, rate, hype meter, list picker)
    HypeBar.jsx            "Hype at [time]" picker
    ListsDrawer.jsx        your lists, nearest-first, tap to fly
    MapStyleControl.jsx    basemap + lighting menu (a real Mapbox control)
  hooks/
    usePlaces.js           data.js first, then Supabase `places` if configured
    useLists.js            lists + stars: localStorage, + Supabase sync if configured
    useMapStyle.js         Standard / Satellite / Minimal + light preset
    useNow.js              minute clock for the hype meter
    useColorScheme.js      follows the OS light/dark setting
  lib/
    search.js              search + ranking (tune `scoreMatch` to taste)
    hype.js                hype lookups (`combineHype` decides overlapping windows)
    geo.js                 epicenter (median center) + miles
    supabase.js            client (null when not configured)
scripts/
  check-data.mjs           npm run check:data   — validates data.js
  make-seed-sql.mjs        npm run seed:sql     — generates supabase/seed.sql from data.js
supabase/
  migrations/…madison_map.sql   tables + row-level security
  seed.sql                      generated places seed
```

### Add a place

Append to `PLACES` in `src/data.js`:

```js
{
  id: 'my-spot',                // unique, kebab-case
  name: 'My Spot',
  category: 'food',             // any key of CATEGORIES
  lat: 43.0747, lng: -89.3841,  // right-click a spot in Google/Apple Maps to copy coordinates
  address: '1 Main St',         // or null
  description: 'One short line for the popup.',
  warning: 'Optional ⚠ note',   // for anything unconfirmed
}
```

Run `npm run check:data` to catch typos and swapped lat/lng.

### Add a category

Add an entry to `CATEGORIES` in `src/data.js` (`label`, `color`, `emoji`, `hint`) and use its key on places. The chips, legend, pins and counts all pick it up automatically.

## Supabase (optional)

Without Supabase the app runs entirely from `src/data.js`, and stars are saved on the device. With it, the places come from a table and two phones share their starred places.

1. In your Supabase project's **SQL Editor**, paste and run `supabase/setup.sql` (all migrations + the places seed in one file; safe to re-run, and it upgrades an older database). On a Mac: `pbcopy < supabase/setup.sql`.
2. In `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Dashboard → Project Settings → API), and a `VITE_TRIP_CODE` of 8+ characters.
3. Use the **same** trip code in both phones' builds. The badge in the panel shows **Synced** when it works.

How it works and what to know:

- `src/data.js` is the source of truth for its own places. The `places` table only **adds** rows whose id isn't in data.js (add a spot from the dashboard without redeploying). After editing data.js, `npm run seed:sql` regenerates `seed.sql` and `setup.sql`.
- Lists live in `shared_pins` (`trip_code, list_id, place_id`; stars are `list_id = 'starred'`) and custom list names in `trip_lists`. On a database from before lists existed, stars still sync and the badge says **Synced ★** until `setup.sql` is re-run.
- Starred places / list items are stored in `shared_pins`. The app sends the trip code in an `x-trip-code` header, and row-level security only lets a request touch rows with that code. It's a lightweight shared secret for a private two-person app, **not real authentication**. The code ships inside the built JS, so keep the deployed URL private.
- Sync is a quick poll (every ~8 s while the tab is open, plus on return to the tab), not websockets. That's plenty for two people and works with the header-based security above.

## Data caveats

Pin positions were geocoded from street addresses/venue names on 2026-11-02, and event details come from venue and team sites at that time. Things to confirm before you go:

- **Airbnbs**: Airbnb hides exact addresses until you book, so every Airbnb pin is approximate (neighborhood level). The three original ones are pure placeholders; the three added later link to their listings (`url`) but their dates and prices for Nov 6–8 were not checked. Set real coordinates in `src/data.js` once you know them.
- **Heritage Tavern**: its operating company filed Chapter 11 in March 2025; reports say it's staying open, so call before you go.
- **Added places** (hotels, restaurants, bars) come from a hotel directory, Visit Madison, Madtown Life and venue calendars, with OpenStreetMap coordinates. Hours were not checked, so confirm anything you plan around. Book L'Etoile and Ahan early.
- **Ancora Cafe + Bakery**: map data lists Ancora cafés on Monona Dr and International Ln only, so confirm which one you mean.
- **High Noon "Unrest Fest"**, **Liquid**, **Sotto**, and the **Majestic Friday show** were not confirmed. They carry a ⚠ in their popups.
- Shows can be added, moved or cancelled. Re-check the night before.

## Scripts

| Command              | What it does                                 |
| -------------------- | -------------------------------------------- |
| `npm run dev`        | Dev server (also on your LAN)                |
| `npm run build`      | Production build into `dist/`                |
| `npm run preview`    | Serve the production build locally           |
| `npm run check:data` | Validate `src/data.js`                       |
| `npm run seed:sql`   | Regenerate `supabase/seed.sql` from `data.js` |
