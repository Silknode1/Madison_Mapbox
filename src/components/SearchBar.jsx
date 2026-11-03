import { useEffect, useId, useRef, useState } from 'react';

/**
 * Search box with a live results dropdown.
 * - Results appear under the input while typing; click/tap/Enter picks one.
 * - Closes on outside click/tap, on Escape, and after picking.
 * - ↑/↓ move through results (combobox pattern), so it works with a keyboard and VoiceOver.
 */
export default function SearchBar({
  query,
  onQueryChange,
  results,
  categories,
  hiddenMatches,
  onPick,
}) {
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const rootRef = useRef(null);
  const inputRef = useRef(null);
  const listId = useId();

  const showList = open && query.trim().length > 0;

  // Close when the user taps/clicks anywhere outside the search box.
  useEffect(() => {
    const onPointerDown = (event) => {
      if (rootRef.current && !rootRef.current.contains(event.target)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, []);

  // New query -> highlight the best match.
  useEffect(() => setActive(0), [query]);

  const pick = (place) => {
    setOpen(false);
    inputRef.current?.blur(); // dismiss the mobile keyboard
    onPick(place);
  };

  const onKeyDown = (event) => {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setOpen(true);
      setActive((i) => Math.min(i + 1, results.length - 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActive((i) => Math.max(i - 1, 0));
    } else if (event.key === 'Enter' && showList && results[active]) {
      event.preventDefault();
      pick(results[active]);
    } else if (event.key === 'Escape') {
      setOpen(false);
    }
  };

  return (
    <div className="search" ref={rootRef}>
      <svg className="search__icon" viewBox="0 0 24 24" aria-hidden="true">
        <circle cx="11" cy="11" r="6.5" fill="none" stroke="currentColor" strokeWidth="2" />
        <path d="m16 16 4.5 4.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
      </svg>

      <input
        ref={inputRef}
        className="search__input"
        type="search"
        inputMode="search"
        enterKeyHint="search"
        placeholder="Search bars, hotels, shows…"
        aria-label="Search places"
        role="combobox"
        aria-expanded={showList}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={showList && results[active] ? `${listId}-${active}` : undefined}
        autoComplete="off"
        autoCorrect="off"
        autoCapitalize="off"
        spellCheck={false}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKeyDown}
      />

      {query && (
        <button
          type="button"
          className="search__clear"
          aria-label="Clear search"
          onClick={() => {
            onQueryChange('');
            inputRef.current?.focus();
          }}
        >
          ×
        </button>
      )}

      {showList && (
        <ul id={listId} className="results" role="listbox" aria-label="Matching places">
          {results.length === 0 ? (
            <li className="results__empty">
              {hiddenMatches > 0
                ? `No matches in the selected categories (${hiddenMatches} hidden by filters).`
                : `No places match “${query.trim()}”.`}
            </li>
          ) : (
            results.map((place, i) => {
              const category = categories[place.category];
              return (
                <li
                  key={place.id}
                  id={`${listId}-${i}`}
                  role="option"
                  aria-selected={i === active}
                  className="result"
                  onPointerEnter={() => setActive(i)}
                  onClick={() => pick(place)}
                >
                  <span className="dot" style={{ '--c': category.color }} aria-hidden="true" />
                  <span className="result__text">
                    <span className="result__name">{place.name}</span>
                    <span className="result__meta">
                      {category.label}
                      {place.address ? ` · ${place.address}` : ''}
                    </span>
                  </span>
                </li>
              );
            })
          )}
        </ul>
      )}
    </div>
  );
}
