import { useCallback, useMemo, useRef, useState } from 'react';
import MapGL, { GeolocateControl, Marker, NavigationControl, Popup } from 'react-map-gl';

import { CATEGORIES, MAP_CENTER } from './data.js';
import { DEFAULT_PREVIEW } from './hype.js';
import { searchPlaces } from './lib/search.js';
import { hypeAt, hypeWindowsFor, isDuringWeekend, madisonMs } from './lib/hype.js';
import { epicenterOf, formatMiles, milesBetween } from './lib/geo.js';
import { usePlaces } from './hooks/usePlaces.js';
import { useLists } from './hooks/useLists.js';
import { useColorScheme } from './hooks/useColorScheme.js';
import { useNow } from './hooks/useNow.js';
import { lightForTime, useMapStyle } from './hooks/useMapStyle.js';

import SearchBar from './components/SearchBar.jsx';
import CategoryFilters from './components/CategoryFilters.jsx';
import HypeBar from './components/HypeBar.jsx';
import Legend from './components/Legend.jsx';
import ListsDrawer from './components/ListsDrawer.jsx';
import MapStyleControl from './components/MapStyleControl.jsx';
import PlaceMarker from './components/PlaceMarker.jsx';
import PlacePopup from './components/PlacePopup.jsx';

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const hasToken = Boolean(MAPBOX_TOKEN) && !MAPBOX_TOKEN.includes('YOUR_');

const ALL_CATEGORIES = Object.keys(CATEGORIES);

const SYNC_BADGE = {
  synced: { label: 'Synced', tip: 'Stars and lists are shared between your phones.' },
  partial: {
    label: 'Synced ★',
    tip: 'Stars sync; other lists stay on this device until supabase/setup.sql is re-run.',
  },
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
  const listsApi = useLists();
  const { starred, toggleStar, status: syncStatus } = listsApi;
  const scheme = useColorScheme();
  const mapStyle = useMapStyle(scheme);
  const mapRef = useRef(null);
  const now = useNow();

  const [enabled, setEnabled] = useState(() => new Set(ALL_CATEGORIES));
  const [query, setQuery] = useState('');
  const [starredOnly, setStarredOnly] = useState(false);
  const [hotOnly, setHotOnly] = useState(false);
  const [activeListId, setActiveListId] = useState(null); // list filter
  const [listsOpen, setListsOpen] = useState(false);
  const [selectedId, setSelectedId] = useState(null);

  // Hype clock: live during the weekend; before it, open on a preview so the glow is visible.
  const [hypeTime, setHypeTime] = useState(() => (isDuringWeekend(Date.now()) ? 'now' : DEFAULT_PREVIEW));
  const clockMs = hypeTime === 'now' ? now : madisonMs(hypeTime);
  const lightPreset = mapStyle.light === 'auto' ? lightForTime(clockMs) : mapStyle.light;

  // placeId -> the hype window in effect at the clock time (only busy places are in the map).
  const hypeById = useMemo(() => {
    const result = new Map();
    for (const place of places) {
      const hype = hypeAt(place.id, clockMs);
      if (hype) result.set(place.id, hype);
    }
    return result;
  }, [places, clockMs]);

  // The "epicenter": median center of every pin. Distances are straight-line miles from it.
  const epicenter = useMemo(() => epicenterOf(places), [places]);
  const milesFor = useCallback((place) => (epicenter ? milesBetween(epicenter, place) : 0), [epicenter]);
  const placesById = useMemo(() => new Map(places.map((p) => [p.id, p])), [places]);

  const activeList = listsApi.lists.find((l) => l.id === activeListId) ?? null;
  const activeListIds = activeList ? listsApi.byList.get(activeList.id) : null;
  const listItemCount = useMemo(
    () => [...listsApi.byList.entries()].reduce((n, [id, set]) => (id === 'starred' ? n : n + set.size), 0),
    [listsApi.byList],
  );

  // How many places per category (for the chip badges).
  const counts = useMemo(() => {
    const result = {};
    for (const place of places) result[place.category] = (result[place.category] ?? 0) + 1;
    return result;
  }, [places]);

  // 1) category + "starred only" + "busy only" filters  ->  2) search on top of that.
  // The markers and the dropdown both use `results`, so they always agree.
  const allowed = useMemo(
    () =>
      places.filter(
        (p) =>
          enabled.has(p.category) &&
          (!starredOnly || starred.has(p.id)) &&
          (!activeListIds || activeListIds.has(p.id)) &&
          (!hotOnly || hypeById.has(p.id)),
      ),
    [places, enabled, starredOnly, starred, activeListIds, hotOnly, hypeById],
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

  const pickFromList = useCallback(
    (place) => {
      setEnabled((prev) => (prev.has(place.category) ? prev : new Set([...prev, place.category])));
      setSelectedId(place.id);
      flyToPlace(place, 15);
      if (!window.matchMedia('(min-width: 820px)').matches) setListsOpen(false);
    },
    [flyToPlace],
  );

  const showList = useCallback((listId) => {
    setActiveListId(listId);
    setStarredOnly(false);
    if (listId && !window.matchMedia('(min-width: 820px)').matches) setListsOpen(false);
  }, []);

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
        mapStyle={mapStyle.url}
        style={{ width: '100%', height: '100%' }}
        onClick={() => setSelectedId(null)}
      >
        <NavigationControl position="top-right" visualizePitch />
        <GeolocateControl position="top-right" />
        <MapStyleControl
          styleKey={mapStyle.styleKey}
          onStyle={mapStyle.setStyleKey}
          light={mapStyle.light}
          onLight={mapStyle.setLight}
          preset={lightPreset}
        />

        {epicenter && (
          <Marker longitude={epicenter.lng} latitude={epicenter.lat} anchor="center" style={{ zIndex: 0 }}>
            <span className="epicenter" title="Epicenter — the middle of all the pins" aria-hidden="true" />
          </Marker>
        )}

        {results.map((place) => (
          <PlaceMarker
            key={place.id}
            place={place}
            category={CATEGORIES[place.category]}
            selected={place.id === selectedId}
            starred={starred.has(place.id)}
            hype={hypeById.get(place.id)?.level ?? 0}
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
              key={selected.id}
              place={selected}
              category={CATEGORIES[selected.category]}
              starred={starred.has(selected.id)}
              onToggleStar={toggleStar}
              hype={hypeById.get(selected.id) ?? null}
              hypeWindows={hypeWindowsFor(selected.id)}
              distance={epicenter ? formatMiles(milesFor(selected)) : null}
              lists={listsApi.lists}
              isIn={listsApi.isIn}
              onToggleList={listsApi.toggle}
              onCreateList={listsApi.createList}
            />
          </Popup>
        )}
      </MapGL>

      <header className="panel">
        <div className="panel__title">
          <div>
            <h1>Madison Weekend</h1>
            <p aria-live="polite">
              Nov 6–8, 2026 · {results.length} of {places.length} places
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

        <HypeBar value={hypeTime} onChange={setHypeTime} busyCount={hypeById.size} />

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
          hotOnly={hotOnly}
          hotCount={hypeById.size}
          onToggleHotOnly={() => setHotOnly((v) => !v)}
          activeList={activeList}
          activeListCount={activeListIds?.size ?? 0}
          onClearList={() => setActiveListId(null)}
          onOpenLists={() => setListsOpen(true)}
          listItemCount={listItemCount}
        />
      </header>

      <ListsDrawer
        open={listsOpen}
        onClose={() => setListsOpen(false)}
        lists={listsApi.lists}
        byList={listsApi.byList}
        placesById={placesById}
        categories={CATEGORIES}
        milesFor={milesFor}
        hypeById={hypeById}
        activeList={activeListId}
        onShowList={showList}
        onPick={pickFromList}
        onRemove={listsApi.toggle}
        onCreate={listsApi.createList}
        onDelete={(id) => {
          if (id === activeListId) setActiveListId(null);
          listsApi.deleteList(id);
        }}
        syncStatus={syncStatus}
      />

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
