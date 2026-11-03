/**
 * The "epicenter" of the map: the median latitude and the median longitude of the pins.
 * A median (not an average) so a few far-off stays in Middleton or Paoli don't drag the
 * center out of downtown.
 */
export function epicenterOf(places) {
  if (places.length === 0) return null;
  const median = (values) => {
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  };
  return { lat: median(places.map((p) => p.lat)), lng: median(places.map((p) => p.lng)) };
}

/** Straight-line ("as the crow flies") distance in miles. */
export function milesBetween(a, b) {
  const R = 3958.8; // Earth radius in miles
  const rad = (deg) => (deg * Math.PI) / 180;
  const dLat = rad(b.lat - a.lat);
  const dLng = rad(b.lng - a.lng);
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(rad(a.lat)) * Math.cos(rad(b.lat)) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/** "0.4 mi", "<0.1 mi", "12 mi" */
export function formatMiles(mi) {
  if (mi < 0.1) return '<0.1 mi';
  if (mi < 10) return `${mi.toFixed(1)} mi`;
  return `${Math.round(mi)} mi`;
}
