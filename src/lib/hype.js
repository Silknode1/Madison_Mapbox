import { HYPE_WINDOWS, WEEKEND } from '../hype.js';

// All weekend times are Central Standard Time (DST ended Nov 1, 2026).
const MADISON_OFFSET = '-06:00';
const TZ = 'America/Chicago';

/** "2026-11-07T20:00" (Madison local) -> epoch ms. */
export const madisonMs = (local) => Date.parse(`${local}:00${MADISON_OFFSET}`);

const WINDOWS = HYPE_WINDOWS.map((w) => ({ ...w, startMs: madisonMs(w.start), endMs: madisonMs(w.end) }));

const BY_PLACE = new Map();
for (const w of WINDOWS) {
  if (!BY_PLACE.has(w.placeId)) BY_PLACE.set(w.placeId, []);
  BY_PLACE.get(w.placeId).push(w);
}
for (const list of BY_PLACE.values()) list.sort((a, b) => a.startMs - b.startMs);

/** Every hype window for a place, in time order. */
export const hypeWindowsFor = (placeId) => BY_PLACE.get(placeId) ?? [];

/**
 * Several windows can overlap (e.g. "market open" and "market peak"). Pick the one to show.
 * Highest level wins; on a tie, a verified signal beats an estimate.
 */
export function combineHype(active) {
  if (active.length === 0) return null;
  return active.reduce((best, w) =>
    w.level > best.level || (w.level === best.level && w.verified && !best.verified) ? w : best,
  );
}

/** The hype window in effect for a place at a moment (or null when it's calm). */
export function hypeAt(placeId, ms) {
  return combineHype(hypeWindowsFor(placeId).filter((w) => ms >= w.startMs && ms < w.endMs));
}

export const isDuringWeekend = (ms) => ms >= madisonMs(WEEKEND.start) && ms < madisonMs(WEEKEND.end);

const dayFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, weekday: 'short' });
const timeFmt = new Intl.DateTimeFormat('en-US', { timeZone: TZ, hour: 'numeric', minute: '2-digit' });
const shortTime = (ms) => timeFmt.format(ms).replace(':00', '').replace(' AM', ' am').replace(' PM', ' pm');

/** "Sat 11:30 am – 3:15 pm" */
export const formatWindow = (w) => `${dayFmt.format(w.startMs)} ${shortTime(w.startMs)} – ${shortTime(w.endMs)}`;

/** Minutes since midnight in Madison, for picking a light preset. */
export function madisonMinutes(ms) {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: TZ,
    hour: 'numeric',
    minute: 'numeric',
    hourCycle: 'h23',
  }).formatToParts(ms);
  const get = (type) => Number(parts.find((p) => p.type === type)?.value ?? 0);
  return get('hour') * 60 + get('minute');
}
