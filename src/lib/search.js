// Search over places. Pure functions — no React — so they're easy to tweak and test.

/** Lowercase, strip accents and apostrophes so "gennas" finds "Genna’s". */
export const normalize = (s) =>
  (s ?? '')
    .toString()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/['’]/g, '')
    .toLowerCase();

/**
 * Score how well a place matches the query tokens. 0 = no match (hidden), higher = listed first.
 * Every token must match somewhere (AND), so "state coffee" narrows rather than widens.
 *
 * ▶ This is the one function worth tuning to taste: change the weights to decide what
 *   floats to the top of the dropdown (name prefix vs. category vs. address, etc.).
 */
export function scoreMatch(place, tokens, categories) {
  const name = normalize(place.name);
  const words = name.split(/\s+/);
  const rest = normalize(
    [place.description, place.address, categories[place.category]?.label].join(' '),
  );

  let total = 0;
  for (const token of tokens) {
    if (name.startsWith(token)) total += 100; // start of the full name: "kohl" -> Kohl Center…
    else if (words.some((w) => w.startsWith(token))) total += 60; // start of any word: "syl" -> The Sylvee…
    else if (name.includes(token)) total += 40; // anywhere in the name
    else if (rest.includes(token)) total += 10; // description / address / category label
    else return 0;
  }
  return total;
}

/** Filter + rank places for a query. An empty query returns the input unchanged (original order). */
export function searchPlaces(places, query, categories) {
  const tokens = normalize(query).split(/\s+/).filter(Boolean);
  if (tokens.length === 0) return places;

  return places
    .map((place) => ({ place, score: scoreMatch(place, tokens, categories) }))
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || a.place.name.localeCompare(b.place.name))
    .map((x) => x.place);
}
