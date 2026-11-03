import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { supabase, TRIP_CODE } from '../lib/supabase.js';

/** Lists every trip starts with. Custom lists are added on top (and synced via `trip_lists`). */
export const BUILT_IN_LISTS = [
  { id: 'starred', name: 'Starred', emoji: '★', builtIn: true },
  { id: 'fri', name: 'Fri night', emoji: '🌙', builtIn: true },
  { id: 'sat', name: 'Saturday', emoji: '☀️', builtIn: true },
  { id: 'sun', name: 'Sunday', emoji: '🧀', builtIn: true },
  { id: 'maybe', name: 'Maybe', emoji: '🤔', builtIn: true },
];

const KEY = 'madison-map:lists:v1';
const LEGACY_STARRED_KEY = 'madison-map:starred';
const POLL_MS = 8000;

const itemKey = (listId, placeId) => `${listId}|${placeId}`;
const splitKey = (key) => key.split('|');

function readLocal() {
  try {
    const saved = JSON.parse(localStorage.getItem(KEY) || 'null');
    if (saved) return { items: saved.items ?? [], custom: saved.custom ?? [] };
    // First run after the lists update: carry over the old stars.
    const stars = JSON.parse(localStorage.getItem(LEGACY_STARRED_KEY) || '[]');
    return { items: stars.map((id) => itemKey('starred', id)), custom: [] };
  } catch {
    return { items: [], custom: [] };
  }
}

function writeLocal(items, custom) {
  try {
    localStorage.setItem(KEY, JSON.stringify({ items: [...items], custom }));
  } catch {
    /* private mode / quota — lists just won't persist on this device */
  }
}

const isMissingColumn = (error) => error && /list_id/.test(error.message ?? '');
const isMissingTable = (error) => error && (error.code === 'PGRST205' || /trip_lists/.test(error.message ?? ''));

/**
 * Named lists of places ("Fri night", "Saturday", "Maybe", custom ones...).
 *  • Always cached in localStorage.
 *  • With Supabase + VITE_TRIP_CODE they're shared between phones: items live in `shared_pins`
 *    (trip_code, list_id, place_id) and custom list names in `trip_lists`. Optimistic writes +
 *    a light poll, same as before.
 *  • Older database (no `list_id` column yet): only "Starred" syncs; other lists stay on the
 *    device until the latest supabase/setup.sql is run. status = 'partial'.
 *
 * status: 'local' | 'connecting' | 'synced' | 'partial' | 'error'
 */
export function useLists() {
  const shared = Boolean(supabase && TRIP_CODE);
  const initial = useMemo(readLocal, []);
  const [items, setItems] = useState(() => new Set(initial.items));
  const [custom, setCustom] = useState(initial.custom);
  const [status, setStatus] = useState(shared ? 'connecting' : 'local');

  const itemsRef = useRef(items);
  itemsRef.current = items;
  const inflight = useRef(0); // pending writes — don't let a poll clobber an optimistic update
  const legacy = useRef(false); // shared_pins has no list_id column yet
  const hasListsTable = useRef(true);

  useEffect(() => writeLocal(items, custom), [items, custom]);

  const okStatus = () => (legacy.current || !hasListsTable.current ? 'partial' : 'synced');

  const refresh = useCallback(async () => {
    if (!shared || inflight.current > 0) return;
    const pins = await supabase.from('shared_pins').select('*').eq('trip_code', TRIP_CODE);
    if (inflight.current > 0) return; // a write started while we were reading
    if (pins.error) {
      console.warn('[lists] sync failed:', pins.error.message);
      setStatus('error');
      return;
    }
    if (pins.data.length > 0 && !('list_id' in pins.data[0])) legacy.current = true;

    const remote = new Set(pins.data.map((row) => itemKey(row.list_id ?? 'starred', row.place_id)));
    if (legacy.current) {
      // Only "Starred" is in the database; keep this device's other lists.
      for (const key of itemsRef.current) if (!key.startsWith('starred|')) remote.add(key);
    }
    setItems(remote);

    if (hasListsTable.current) {
      const lists = await supabase
        .from('trip_lists')
        .select('list_id,name,emoji')
        .eq('trip_code', TRIP_CODE)
        .order('created_at', { ascending: true });
      if (isMissingTable(lists.error)) hasListsTable.current = false;
      else if (lists.error) console.warn('[lists] list names failed:', lists.error.message);
      else setCustom(lists.data.map((r) => ({ id: r.list_id, name: r.name, emoji: r.emoji || '📍' })));
    }
    setStatus(okStatus());
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

  const toggle = useCallback(
    async (listId, placeId) => {
      const key = itemKey(listId, placeId);
      const adding = !itemsRef.current.has(key);
      const apply = (add) =>
        setItems((prev) => {
          const next = new Set(prev);
          if (add) next.add(key);
          else next.delete(key);
          return next;
        });

      apply(adding); // optimistic
      if (!shared || (legacy.current && listId !== 'starred')) return;

      const write = () => {
        const row = legacy.current
          ? { trip_code: TRIP_CODE, place_id: placeId }
          : { trip_code: TRIP_CODE, list_id: listId, place_id: placeId };
        if (adding) return supabase.from('shared_pins').upsert(row, { ignoreDuplicates: true });
        let q = supabase.from('shared_pins').delete().eq('trip_code', TRIP_CODE).eq('place_id', placeId);
        if (!legacy.current) q = q.eq('list_id', listId);
        return q;
      };

      inflight.current += 1;
      let { error } = await write();
      if (isMissingColumn(error)) {
        legacy.current = true; // old schema: only stars can sync
        error = listId === 'starred' ? (await write()).error : null;
      }
      inflight.current -= 1;

      if (error) {
        console.warn('[lists] write failed:', error.message);
        apply(!adding); // roll back
        setStatus('error');
      } else {
        setStatus(okStatus());
      }
    },
    [shared],
  );

  const createList = useCallback(
    async (name, emoji = '📍') => {
      const list = { id: `l-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`, name, emoji };
      setCustom((prev) => [...prev, list]);
      if (shared && hasListsTable.current) {
        const { error } = await supabase
          .from('trip_lists')
          .insert({ trip_code: TRIP_CODE, list_id: list.id, name, emoji });
        if (isMissingTable(error)) hasListsTable.current = false;
        else if (error) console.warn('[lists] create failed:', error.message);
        setStatus(okStatus());
      }
      return list.id;
    },
    [shared],
  );

  const deleteList = useCallback(
    async (listId) => {
      setCustom((prev) => prev.filter((l) => l.id !== listId));
      setItems((prev) => new Set([...prev].filter((key) => !key.startsWith(`${listId}|`))));
      if (!shared) return;
      if (hasListsTable.current) {
        await supabase.from('trip_lists').delete().eq('trip_code', TRIP_CODE).eq('list_id', listId);
      }
      if (!legacy.current) {
        await supabase.from('shared_pins').delete().eq('trip_code', TRIP_CODE).eq('list_id', listId);
      }
    },
    [shared],
  );

  const lists = useMemo(() => [...BUILT_IN_LISTS, ...custom], [custom]);

  // listId -> Set(placeId)
  const byList = useMemo(() => {
    const map = new Map(lists.map((l) => [l.id, new Set()]));
    for (const key of items) {
      const [listId, placeId] = splitKey(key);
      if (map.has(listId)) map.get(listId).add(placeId);
    }
    return map;
  }, [items, lists]);

  const isIn = useCallback((listId, placeId) => items.has(itemKey(listId, placeId)), [items]);
  const starred = byList.get('starred');
  const toggleStar = useCallback((placeId) => toggle('starred', placeId), [toggle]);

  return { lists, byList, isIn, toggle, createList, deleteList, starred, toggleStar, status };
}
