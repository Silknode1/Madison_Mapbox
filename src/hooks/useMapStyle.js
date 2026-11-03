import { useCallback, useState } from 'react';
import { madisonMinutes } from '../lib/hype.js';

/**
 * Basemap choices. All three are Mapbox styles; "Standard" is Mapbox's flagship style
 * (3D buildings + landmarks, with dawn/day/dusk/night lighting).
 */
export const MAP_STYLES = {
  standard: {
    label: 'Standard',
    hint: '3D buildings, real lighting',
    url: () => 'mapbox://styles/mapbox/standard',
    lighting: true,
  },
  satellite: {
    label: 'Satellite',
    hint: 'Aerial photos + labels',
    url: () => 'mapbox://styles/mapbox/standard-satellite',
    lighting: true,
  },
  minimal: {
    label: 'Minimal',
    hint: 'Flat and quiet; follows dark mode',
    url: (scheme) => (scheme === 'dark' ? 'mapbox://styles/mapbox/dark-v11' : 'mapbox://styles/mapbox/light-v11'),
    lighting: false,
  },
};

export const LIGHT_OPTIONS = [
  { value: 'auto', label: 'Auto' },
  { value: 'day', label: 'Day' },
  { value: 'dusk', label: 'Dusk' },
  { value: 'night', label: 'Night' },
];

/**
 * Light that matches Madison's sky at a given moment (early Nov: sunrise ~6:40, sunset ~4:45).
 * Mapbox Standard presets: dawn | day | dusk | night.
 */
export function lightForTime(ms) {
  const m = madisonMinutes(ms);
  if (m < 6 * 60 || m >= 17 * 60 + 45) return 'night';
  if (m < 7 * 60 + 30) return 'dawn';
  if (m >= 16 * 60 + 15) return 'dusk';
  return 'day';
}

function readPref(key, fallback, allowed) {
  try {
    const value = window.localStorage.getItem(key);
    return allowed.includes(value) ? value : fallback;
  } catch {
    return fallback; // private mode / storage blocked
  }
}

function writePref(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* ignore */
  }
}

/** Map style + light choice, remembered per device. */
export function useMapStyle(scheme) {
  const [styleKey, setStyleKeyState] = useState(() =>
    readPref('madison.mapStyle', 'standard', Object.keys(MAP_STYLES)),
  );
  const [light, setLightState] = useState(() =>
    readPref('madison.mapLight', 'auto', LIGHT_OPTIONS.map((o) => o.value)),
  );

  const setStyleKey = useCallback((key) => {
    setStyleKeyState(key);
    writePref('madison.mapStyle', key);
  }, []);
  const setLight = useCallback((value) => {
    setLightState(value);
    writePref('madison.mapLight', value);
  }, []);

  const style = MAP_STYLES[styleKey];
  return { styleKey, setStyleKey, light, setLight, style, url: style.url(scheme) };
}
