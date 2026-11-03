# Madison Weekend Map

An interactive map of Madison, WI for the weekend of **Nov 6–7, 2026**: hotels, Airbnbs, shows, bars, Packers/Vikings watch spots, coffee and food. Built with **React + Vite**, **react-map-gl** and **Mapbox GL JS**, and designed to work well on an iPhone.

- Color-coded pins (plus a per-category emoji so similar hues stay distinguishable)
- Category filter chips with **All / None**
- Live search with a results dropdown (tap a result to fly to it and open its popup)
- Legend, popups with an Apple Maps "Directions" link, and a ★ star to shortlist places
- Optional **Supabase** backend: the `places` table, and starred places synced between two phones
- Light/dark mode that follows the OS (UI and basemap)

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
  App.jsx                  state: filters, search, selection; renders the map + panel
  App.css                  styles (tokens at the top; phone layout at the bottom)
  components/
    SearchBar.jsx          input + dropdown (closes on outside click, arrow-key navigation)
    CategoryFilters.jsx    chips, All / None, "Starred only"
    Legend.jsx             collapsible legend
    PlaceMarker.jsx        one pin
    PlacePopup.jsx         popup contents
  hooks/
    usePlaces.js           data.js first, then Supabase `places` if configured
    useStarred.js          stars: localStorage, + Supabase sync if configured
    useColorScheme.js      follows the OS light/dark setting
  lib/
    search.js              search + ranking (tune `scoreMatch` to taste)
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

1. In your Supabase project, run `supabase/migrations/20261102000000_madison_map.sql` (SQL editor, or `supabase db push`), then `supabase/seed.sql`.
2. In `.env.local`, set `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (Dashboard → Project Settings → API), and a `VITE_TRIP_CODE` of 8+ characters.
3. Use the **same** trip code in both phones' builds. The badge in the panel shows **Synced** when it works.

How it works and what to know:

- `places` is read-only from the browser. Edit rows in the dashboard, or change `src/data.js` and re-run `npm run seed:sql` + the seed. If the table is empty or unreachable, the app falls back to `src/data.js`.
- Starred places are stored in `shared_pins`. The app sends the trip code in an `x-trip-code` header, and row-level security only lets a request touch rows with that code. It's a lightweight shared secret for a private two-person app, **not real authentication**. The code ships inside the built JS, so keep the deployed URL private.
- Sync is a quick poll (every ~8 s while the tab is open, plus on return to the tab), not websockets. That's plenty for two people and works with the header-based security above.

## Data caveats

Pin positions were geocoded from street addresses/venue names on 2026-11-02, and event details come from venue and team sites at that time. Things to confirm before you go:

- **Airbnbs**: no addresses were provided, so their pins are placeholders. Set real coordinates in `src/data.js`.
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
