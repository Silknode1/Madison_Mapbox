import { useCallback, useMemo, useRef, useState } from 'react';
import MapGL, { GeolocateControl, NavigationControl, Popup } from 'react-map-gl';

import { CATEGORIES, MAP_CENTER } from './data.js';
import { searchPlaces } from './lib/search.js';
import { usePlaces } from './hooks/usePlaces.js';
import { useStarred } from './hooks/useStarred.js';
import { useColorScheme } from './hooks/useColorScheme.js';

import SearchBar from './components/SearchBar.jsx';
import CategoryFilters from './components/CategoryFilters.jsx';
import Legend from './components/Legend.jsx';
import PlaceMarker from './components/PlaceMarker.jsx';
import PlacePopup from './components/PlacePopup.jsx';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const hasToken = Boolean(MAPBOX_TOKEN) && !MAPBOX_TOKEN.includes('YOUR_');

const MAP_STYLES = {
  light: 'mapbox://styles/mapbox/light-v11',
  dark: 'mapbox://styles/mapbox/dark-v11',
};

const ALL_CATEGORIES = Object.keys(CATEGORIES);

const SYNC_BADGE = {
  synced: { label: 'Synced', tip: 'Starred places are shared between your phones.' },
  connecting: { label: 'Syncing…', tip: 'Connecting to Supabase…' },
  error: { label: 'Sync error', tip: 'Could not reach Supabase — stars are saved on this device.' },
  local: {
    label: 'This device',
    tip: 'Starred places are saved on this device. Set the Supabase env vars and VITE_TRIP_CODE to sync two phones.',
  },
};

export default function App() {
  if (!hasToken) return <SetupNotice />;
  return <MapApp />;
}

function MapApp() {
  const { places, source } = usePlaces();
  const { starred, toggleStar, status: syncStatus } = useStarred();
  const scheme = useColorScheme();
  const mapRef = useRef(null);

  const [enabled, setEnabled] = useState(() => new Set(ALL_CATEGORIES));
  const [query, setQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // How many places per category (for the chip badges).
  const counts = useMemo(() => {
    const result = {};
    for (const place of places) result[place.category] = (result[place.category] ?? 0) + 1;
    return result;
  }, [places]);

  // 1) category + "starred only" filters  ->  2) search on top of that.
  // The markers and the dropdown both use `results`, so they always agree.
  const allowed = useMemo(
    () =>
      places.filter(
        (p) => enabled.has(p.category) && (!starredOnly || starred.has(p.id)),
      ),
    [places, enabled, starredOnly, starred],
  );
  const results = useMemo(() => searchPlaces(allowed, query, CATEGORIES), [allowed, query]);

  // Matches that exist but are hidden by a category filter (used for the empty-state message).
  const hiddenMatches = useMemo(
    () => (query.trim() ? searchPlaces(places, query, CATEGORIES).length - results.length : 0),
    [places, query, results],
  );

  const selected = useMemo(
    () => results.find((p) => p.id === selectedId) ?? null,
    [results, selectedId],
  );

  const flyToPlace = useCallback((place, minZoom) => {
    const map = mapRef.current;
    if (!map) return;
    const wide = window.matchMedia('(min-width: 820px)').matches;
    map.flyTo({
      center: [place.lng, place.lat],
      zoom: Math.max(map.getZoom(), minZoom),
      duration: 700,
      // Leave room for the floating panel and the popup that opens above the pin.
      padding: { top: wide ? 120 : 220, bottom: 24, left: wide ? 380 : 24, right: 24 },
    });
  }, []);

  // Tapping a pin keeps the current zoom; picking a search result zooms in to street level.
  const selectFromMap = useCallback(
    (place) => {
      setSelectedId(place.id);
      flyToPlace(place, 0);
    },
    [flyToPlace],
  );
  const selectFromSearch = useCallback(
    (place) => {
      setSelectedId(place.id);
      flyToPlace(place, 15);
    },
    [flyToPlace],
  );

  const toggleCategory = useCallback((key) => {
    setEnabled((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  }, []);

  const badge = SYNC_BADGE[syncStatus];

  return (
    <div className="app">
      <MapGL
        ref={mapRef}
        mapboxAccessToken={MAPBOX_TOKEN}
        initialViewState={MAP_CENTER}
        mapStyle={MAP_STYLES[scheme]}
        style={{ width: '100%', height: '100%' }}
        onClick={() => setSelectedId(null)}
      >
        <NavigationControl position="top-right" showCompass={false} />
        <GeolocateControl position="top-right" />

        {results.map((place) => (
          <PlaceMarker
            key={place.id}
            place={place}
            category={CATEGORIES[place.category]}
            selected={place.id === selectedId}
            starred={starred.has(place.id)}
            onSelect={selectFromMap}
          />
        ))}

        {selected && (
          <Popup
            longitude={selected.lng}
            latitude={selected.lat}
            offset={24}
            maxWidth="300px"
            closeOnClick={false}
            focusAfterOpen={false}
            onClose={() => setSelectedId(null)}
          >
            <PlacePopup
              place={selected}
              category={CATEGORIES[selected.category]}
              starred={starred.has(selected.id)}
              onToggleStar={toggleStar}
            />
          </Popup>
        )}
      </MapGL>

      <header className="panel">
        <div className="panel__title">
          <div>
            <h1>Madison Weekend</h1>
            <p aria-live="polite">
              Nov 6–7, 2026 · {results.length} of {places.length} places
            </p>
          </div>
          <span
            className={`badge badge--${syncStatus}`}
            title={`${badge.tip} Places: ${source}.`}
          >
            <span className="badge__dot" aria-hidden="true" />
            {badge.label}
          </span>
        </div>

        <SearchBar
          query={query}
          onQueryChange={setQuery}
          results={results}
          categories={CATEGORIES}
          hiddenMatches={hiddenMatches}
          onPick={selectFromSearch}
        />

        <CategoryFilters
          categories={CATEGORIES}
          counts={counts}
          enabled={enabled}
          onToggle={toggleCategory}
          onAll={() => setEnabled(new Set(ALL_CATEGORIES))}
          onNone={() => setEnabled(new Set())}
          starredOnly={starredOnly}
          starredCount={starred.size}
          onToggleStarredOnly={() => setStarredOnly((v) => !v)}
        />
      </header>

      <Legend categories={CATEGORIES} />
    </div>
  );
}

/** Shown instead of a broken map until a Mapbox public token is configured. */
function SetupNotice() {
  return (
    <main className="setup">
      <div className="setup__card">
        <p className="eyebrow">One step left</p>
        <h1>Add your Mapbox token</h1>
        <ol>
          <li>
            Create a <strong>public</strong> token (starts with <code>pk.</code>) at{' '}
            <a href="https://account.mapbox.com/access-tokens/" target="_blank" rel="noreferrer">
              account.mapbox.com
            </a>
            .
          </li>
          <li>
            Copy <code>.env.example</code> to <code>.env.local</code> and set{' '}
            <code>VITE_MAPBOX_TOKEN=pk.…</code>
          </li>
          <li>
            Restart <code>npm run dev</code>.
          </li>
        </ol>
      </div>
    </main>
  );
}
