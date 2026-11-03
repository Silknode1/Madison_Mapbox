import { useEffect, useState } from 'react';
import { CATEGORIES, PLACES } from '../data.js';
import { supabase } from '../lib/supabase.js';

/** DB row (snake_case) -> the shape the UI uses (same as src/data.js). */
function fromRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    lat: Number(row.lat),
    lng: Number(row.lng),
    address: row.address ?? null,
    description: row.description ?? '',
    warning: row.warning ?? undefined,
    coordsApprox: row.coords_approx || undefined,
    url: row.url ?? undefined,
  };
}

/**
 * Places for the map. Renders src/data.js instantly, then swaps in the Supabase `places`
 * table if it's configured and returns rows. Any failure keeps the local data, so the map
 * never goes blank on bad Wi-Fi.
 */
export function usePlaces() {
  const [state, setState] = useState({ places: PLACES, source: 'data.js' });

  useEffect(() => {
    if (!supabase) return undefined;
    let cancelled = false;

    supabase
      .from('places')
      .select('*')
      .order('sort', { ascending: true })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) {
          console.warn('[places] Supabase read failed, using src/data.js:', error.message);
          return;
        }
        const places = (data ?? []).map(fromRow).filter((p) => {
          const ok = CATEGORIES[p.category] && Number.isFinite(p.lat) && Number.isFinite(p.lng);
          if (!ok) console.warn('[places] skipping invalid row:', p.id);
          return ok;
        });
        if (places.length > 0) setState({ places, source: 'Supabase' });
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return state;
}
