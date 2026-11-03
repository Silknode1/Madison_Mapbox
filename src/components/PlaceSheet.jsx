import { useEffect, useRef, useState } from 'react';
import { HYPE_LEVELS } from '../hype.js';
import { formatWindow } from '../lib/hype.js';

const STAY_CATEGORIES = new Set(['hotels', 'airbnbs', 'outside']);
const PEEK = 0.42; // phone: share of the sheet's height pushed below the screen when "peeking"

/* ---------- Small inline icons (SF Symbols–like strokes) -------------------------------- */
const Icon = ({ children }) => (
  <svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const DirectionsIcon = () => (
  <Icon>
    <path d="M12 2.8 21.2 12 12 21.2 2.8 12Z" />
    <path d="M9 14v-2.5a1.5 1.5 0 0 1 1.5-1.5H15m-2-2 2 2-2 2" />
  </Icon>
);
const GlobeIcon = () => (
  <Icon>
    <circle cx="12" cy="12" r="9" />
    <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
  </Icon>
);
const StarIcon = ({ filled }) => (
  <Icon>
    <path d="m12 3.5 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.8l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8Z" fill={filled ? 'currentColor' : 'none'} />
  </Icon>
);
const ListIcon = () => (
  <Icon>
    <path d="M9 6h11M9 12h11M9 18h6M4.5 6h.01M4.5 12h.01M4.5 18h.01" />
    <path d="M19 15v6m-3-3h6" />
  </Icon>
);

function linkLabel(place) {
  if (place.urlLabel) return place.urlLabel;
  try {
    return new URL(place.url).hostname.includes('airbnb') ? 'Listing' : 'Website';
  } catch {
    return 'Website';
  }
}

function Meter({ level }) {
  return (
    <span className={`meter meter--${level}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

function ListPicker({ placeId, lists, isIn, onToggle, onCreate }) {
  const submit = async (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.listName;
    const name = input.value.trim().slice(0, 40);
    if (!name) return;
    const id = await onCreate(name);
    onToggle(id, placeId);
    input.value = '';
  };
  return (
    <div className="group list-picker" role="group" aria-label="Add to lists">
      <p className="group__title">Add to lists</p>
      <div className="list-picker__lists">
        {lists.map((l) => (
          <button key={l.id} type="button" className="list-chip" aria-pressed={isIn(l.id, placeId)} onClick={() => onToggle(l.id, placeId)}>
            <span aria-hidden="true">{l.emoji}</span> {l.name}
          </button>
        ))}
      </div>
      <form className="list-picker__new" onSubmit={submit}>
        <input name="listName" type="text" placeholder="New list…" aria-label="New list name" maxLength={40} />
        <button type="submit" className="pill-btn">Add</button>
      </form>
    </div>
  );
}

const isPhone = () => !window.matchMedia('(min-width: 820px)').matches;

/**
 * Apple Maps–style place card. Lives outside the map, so it never hides behind pins and
 * never slides away when you pan or zoom.
 *  • iPhone: bottom sheet with a grabber — peeks at ~half height; drag/tap up for full, down to close.
 *  • Desktop: card in the left column (where the filter panel sits).
 */
export default function PlaceSheet({
  place,
  category,
  starred,
  onToggleStar,
  onClose,
  hype,
  hypeWindows,
  distance,
  lists,
  isIn,
  onToggleList,
  onCreateList,
}) {
  const [full, setFull] = useState(false);
  const [picking, setPicking] = useState(false);
  const sheetRef = useRef(null);
  const drag = useRef(null);

  // New place -> back to the peek position, list picker closed, scrolled to top.
  useEffect(() => {
    setFull(false);
    setPicking(false);
    sheetRef.current?.querySelector('.sheet__body')?.scrollTo(0, 0);
  }, [place.id]);

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [onClose]);

  // ---- drag to expand / collapse / dismiss (phones only) ----
  const onPointerDown = (e) => {
    if (!isPhone() || e.button > 0) return;
    if (full && !e.target.closest('.sheet__head')) return; // when expanded, the body scrolls instead
    if (e.target.closest('button, a, input, select, form')) return;
    drag.current = { y: e.clientY, dy: 0, moved: false, id: e.pointerId };
  };
  const onPointerMove = (e) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.dy = e.clientY - d.y;
    if (!d.moved && Math.abs(d.dy) < 6) return;
    if (!d.moved) {
      d.moved = true;
      sheetRef.current.setPointerCapture(e.pointerId);
      sheetRef.current.style.transition = 'none';
    }
    const height = sheetRef.current.offsetHeight;
    const base = full ? 0 : height * PEEK;
    const y = Math.max(0, base + d.dy);
    sheetRef.current.style.transform = `translateY(${y}px)`;
  };
  const onPointerUp = () => {
    const d = drag.current;
    drag.current = null;
    if (!d || !d.moved) return;
    const el = sheetRef.current;
    el.style.transition = '';
    el.style.transform = '';
    if (d.dy < -48) setFull(true);
    else if (d.dy > 72) (full ? setFull(false) : onClose());
  };

  const walk = place.category !== 'outside';
  const directions = `https://maps.apple.com/?daddr=${place.lat},${place.lng}&dirflg=${walk ? 'w' : 'd'}`;
  const address = place.address && (place.address.includes(',') ? place.address : `${place.address}, Madison`);
  const isStay = STAY_CATEGORIES.has(place.category);
  const listCount = lists.filter((l) => l.id !== 'starred' && isIn(l.id, place.id)).length;

  const sub = [
    place.priceLevel ? '$'.repeat(place.priceLevel) : null,
    distance,
    hype ? `🔥 ${HYPE_LEVELS[hype.level].label}` : null,
  ].filter(Boolean);

  return (
    <section
      ref={sheetRef}
      className={`sheet${full ? ' sheet--full' : ''}`}
      role="dialog"
      aria-label={place.name}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
    >
      <header className="sheet__head">
        <button
          type="button"
          className="sheet__grabber"
          aria-label={full ? 'Collapse' : 'Expand'}
          onClick={() => setFull((v) => !v)}
        />
        <div className="sheet__titles">
          <span className="place__eyebrow" style={{ '--c': category.color }}>
            <span className="dot" aria-hidden="true" />
            {category.label}
          </span>
          <h2 className="place__name">{place.name}</h2>
          {sub.length > 0 && (
            <p className={`place__sub${hype ? ` place__sub--hype-${hype.level}` : ''}`}>{sub.join('  ·  ')}</p>
          )}
        </div>
        <button type="button" className="sheet__close" aria-label="Close" onClick={onClose}>
          <svg viewBox="0 0 24 24" width="14" height="14" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" />
          </svg>
        </button>
      </header>

      <div className="sheet__body">
        <div className="place__actions">
          <a className="action action--primary" href={directions} target="_blank" rel="noreferrer">
            <DirectionsIcon />
            <span>Directions</span>
          </a>
          {place.url ? (
            <a className="action" href={place.url} target="_blank" rel="noreferrer">
              <GlobeIcon />
              <span>{linkLabel(place)}</span>
            </a>
          ) : (
            <span className="action action--disabled" aria-disabled="true">
              <GlobeIcon />
              <span>No site</span>
            </span>
          )}
          <button type="button" className="action" aria-pressed={starred} onClick={() => onToggleStar(place.id)}>
            <StarIcon filled={starred} />
            <span>{starred ? 'Starred' : 'Star'}</span>
          </button>
          <button type="button" className="action" aria-expanded={picking} onClick={() => setPicking((v) => !v)}>
            <ListIcon />
            <span>{listCount > 0 ? `Lists · ${listCount}` : 'Lists'}</span>
          </button>
        </div>

        {picking && (
          <ListPicker
            placeId={place.id}
            lists={lists.filter((l) => l.id !== 'starred')}
            isIn={isIn}
            onToggle={onToggleList}
            onCreate={onCreateList}
          />
        )}

        <p className="place__desc">{place.description}</p>

        {place.warning && (
          <p className="callout" role="note">
            <span aria-hidden="true">⚠︎</span> {place.warning}
          </p>
        )}

        <div className="group">
          {(place.priceLevel || place.priceText) && (
            <div className="row">
              <span className="row__label">Price</span>
              <span className="row__value">
                {place.priceLevel && (
                  <span className="price">
                    <span className="price__on">{'$'.repeat(place.priceLevel)}</span>
                    <span className="price__off">{'$'.repeat(4 - place.priceLevel)}</span>
                    {place.priceEstimated && <span className="tag">est.</span>}
                  </span>
                )}
                {place.priceText && <span className="row__sub">{place.priceText}</span>}
              </span>
            </div>
          )}
          {isStay && (
            <div className="row">
              <span className="row__label">Nightly</span>
              <span className="row__value">
                {place.rate ?? 'Not published for Nov 6–7 — check the site'}
                {place.rateNote && <span className="row__sub">{place.rateNote}</span>}
              </span>
            </div>
          )}
          {(address || distance) && (
            <div className="row">
              <span className="row__label">Address</span>
              <span className="row__value">
                {address ?? 'Exact address not public'}
                {distance && <span className="row__sub">{distance} from the epicenter</span>}
              </span>
            </div>
          )}
        </div>

        {hypeWindows.length > 0 && (
          <div className={`group place-hype${hype ? ` place-hype--${hype.level}` : ''}`}>
            <p className="group__title">Crowd forecast</p>
            <div className="place-hype__now">
              <Meter level={hype?.level ?? 0} />
              <strong>{hype ? HYPE_LEVELS[hype.level].label : 'Calm at this time'}</strong>
            </div>
            {hype && <p className="place-hype__reason">{hype.reason}</p>}
            <ul className="place-hype__list">
              {hypeWindows.slice(0, 4).map((w) => (
                <li key={`${w.start}-${w.level}`} aria-current={w === hype ? 'true' : undefined}>
                  <span>{formatWindow(w)}</span>
                  <span>
                    {HYPE_LEVELS[w.level].label}
                    {!w.verified && <span className="tag">est.</span>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="group__foot">From the schedule (show times, kickoffs, sell-outs) — not live data.</p>
          </div>
        )}
      </div>
    </section>
  );
}
