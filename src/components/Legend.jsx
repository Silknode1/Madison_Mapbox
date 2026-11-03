import { useState } from 'react';

/** Collapsible legend. Open by default on desktop, collapsed on phones to keep the map clear. */
export default function Legend({ categories }) {
  const [open, setOpen] = useState(() => window.matchMedia('(min-width: 820px)').matches);

  return (
    <aside className={`legend${open ? ' legend--open' : ''}`} aria-label="Map legend">
      <button
        type="button"
        className="legend__toggle"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        Legend <span aria-hidden="true">{open ? '▾' : '▴'}</span>
      </button>

      {open && (
        <ul className="legend__list">
          {Object.entries(categories).map(([key, category]) => (
            <li key={key} className="legend__item">
              <span className="legend__swatch" style={{ '--c': category.color }} aria-hidden="true">
                {category.emoji}
              </span>
              <span className="legend__text">
                <span className="legend__label">{category.label}</span>
                <span className="legend__hint">{category.hint}</span>
              </span>
            </li>
          ))}
          <li className="legend__item legend__item--note">
            <span className="legend__swatch legend__swatch--star" aria-hidden="true">
              ★
            </span>
            <span className="legend__text">
              <span className="legend__label">Starred</span>
              <span className="legend__hint">Your shortlist (synced if set up)</span>
            </span>
          </li>
          <li className="legend__item legend__item--note">
            <span className="legend__swatch legend__swatch--warn" aria-hidden="true">
              ⚠
            </span>
            <span className="legend__text">
              <span className="legend__label">Check first</span>
              <span className="legend__hint">Unconfirmed detail — see popup</span>
            </span>
          </li>
        </ul>
      )}
    </aside>
  );
}
