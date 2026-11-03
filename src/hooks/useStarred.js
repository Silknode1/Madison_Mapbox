import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase, TRIP_CODE } from '../lib/supabase.js';

const STORAGE_KEY = 'madison-map:starred';
const POLL_MS = 8000;

const readLocal = () => {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
};
const writeLocal = (ids) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(ids));
  } catch {
    /* private mode / quota — stars just won't persist */
  }
};

/**
 * Starred places.
 *  • Always cached in localStorage.
 *  • If Supabase + VITE_TRIP_CODE are configured, they're also shared between phones through
 *    the `shared_pins` table: optimistic writes, plus a light poll (and a refresh whenever the
 *    tab becomes visible) so the other phone's stars show up within a few seconds.
 *
 * status: 'local' | 'connecting' | 'synced' | 'error'
 */
export function useStarred() {
  const shared = Boolean(supabase && TRIP_CODE);
  const [starred, setStarred] = useState(() => new Set(readLocal()));
  const [status, setStatus] = useState(shared ? 'connecting' : 'local');

  const starredRef = useRef(starred);
  starredRef.current = starred;
  const inflight = useRef(0); // pending writes — don't let a poll clobber an optimistic update

  useEffect(() => writeLocal([...starred]), [starred]);

  const refresh = useCallback(async () => {
    if (!shared || inflight.current > 0) return;
    const { data, error } = await supabase
      .from('shared_pins')
      .select('place_id')
      .eq('trip_code', TRIP_CODE);
    if (inflight.current > 0) return; // a write started while we were reading
    if (error) {
      console.warn('[starred] sync failed:', error.message);
      setStatus('error');
      return;
    }
    setStarred(new Set(data.map((row) => row.place_id)));
    setStatus('synced');
  }, [shared]);

  useEffect(() => {
    if (!shared) return undefined;
    refresh();
    const timer = setInterval(() => {
      if (!document.hidden) refresh();
    }, POLL_MS);
    const onVisible = () => {
      if (!document.hidden) refresh();
    };
    document.addEventListener('visibilitychange', onVisible);
    return () => {
      clearInterval(timer);
      document.removeEventListener('visibilitychange', onVisible);
    };
  }, [shared, refresh]);

  const toggleStar = useCallback(
    async (id) => {
      const adding = !starredRef.current.has(id);
      const apply = (add) =>
        setStarred((prev) => {
          const next = new Set(prev);
          if (add) next.add(id);
          else next.delete(id);
          return next;
        });

      apply(adding); // optimistic
      if (!shared) return;

      inflight.current += 1;
      const { error } = adding
        ? await supabase
            .from('shared_pins')
            .upsert({ trip_code: TRIP_CODE, place_id: id }, { ignoreDuplicates: true })
        : await supabase.from('shared_pins').delete().eq('trip_code', TRIP_CODE).eq('place_id', id);
      inflight.current -= 1;

      if (error) {
        console.warn('[starred] write failed:', error.message);
        apply(!adding); // roll back
        setStatus('error');
      } else {
        setStatus('synced');
      }
    },
    [shared],
  );

  return { starred, toggleStar, status };
}
