import { useState } from 'react';
import { HYPE_LEVELS } from '../hype.js';
import { formatWindow } from '../lib/hype.js';

const STAY_CATEGORIES = new Set(['hotels', 'airbnbs', 'outside']);

/** Button text for a place's link. */
function linkLabel(place) {
  if (place.urlLabel) return place.urlLabel;
  try {
    return new URL(place.url).hostname.includes('airbnb') ? 'Listing' : 'Website';
  } catch {
    return 'Website';
  }
}

/** Three-bar meter, filled up to `level`. */
function HypeMeter({ level }) {
  return (
    <span className={`meter meter--${level}`} aria-hidden="true">
      <span />
      <span />
      <span />
    </span>
  );
}

/** "$$$" with the unused signs dimmed, e.g. $$$·  */
function PriceLevel({ level, estimated }) {
  return (
    <span className="price" title={estimated ? 'Estimated price level' : 'Price level from listings'}>
      <span className="price__on">{'$'.repeat(level)}</span>
      <span className="price__off">{'$'.repeat(4 - level)}</span>
      {estimated && <span className="tag">est.</span>}
    </span>
  );
}

/** Inline list picker: toggle the place in/out of each list, or start a new one. */
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
    <div className="list-picker" role="group" aria-label="Add to lists">
      <div className="list-picker__lists">
        {lists.map((l) => (
          <button
            key={l.id}
            type="button"
            className="list-chip"
            aria-pressed={isIn(l.id, placeId)}
            onClick={() => onToggle(l.id, placeId)}
          >
            <span aria-hidden="true">{l.emoji}</span> {l.name}
          </button>
        ))}
      </div>
      <form className="list-picker__new" onSubmit={submit}>
        <input name="listName" type="text" placeholder="New list…" aria-label="New list name" maxLength={40} />
        <button type="submit" className="btn">Add</button>
      </form>
    </div>
  );
}

/**
 * Popup body: name, price, description, nightly rate for stays, the hype meter, then
 * directions / website / star / lists.
 */
export default function PlacePopup({
  place,
  category,
  starred,
  onToggleStar,
  hype,
  hypeWindows,
  distance,
  lists,
  isIn,
  onToggleList,
  onCreateList,
}) {
  const [picking, setPicking] = useState(false);
  const listCount = lists.filter((l) => l.id !== 'starred' && isIn(l.id, place.id)).length;
  // Apple Maps link: opens the Maps app on iPhone, maps.apple.com elsewhere. dirflg=w -> walking.
  const walk = place.category !== 'outside';
  const directions = `https://maps.apple.com/?daddr=${place.lat},${place.lng}&dirflg=${walk ? 'w' : 'd'}`;
  const address = place.address && (place.address.includes(',') ? place.address : `${place.address}, Madison`);

  return (
    <div className="popup">
      <span className="popup__cat" style={{ '--c': category.color }}>
        <span className="dot" aria-hidden="true" />
        {category.label}
      </span>

      <h3 className="popup__name">{place.name}</h3>
      {(place.priceLevel || place.priceText) && (
        <p className="popup__price">
          {place.priceLevel && <PriceLevel level={place.priceLevel} estimated={place.priceEstimated} />}
          {place.priceText && <span className="popup__price-text">{place.priceText}</span>}
        </p>
      )}
      <p className="popup__desc">{place.description}</p>
      {(address || distance) && (
        <p className="popup__addr">
          {address}
          {address && distance && ' · '}
          {distance && <span className="popup__dist">{distance} from the epicenter</span>}
        </p>
      )}

      {STAY_CATEGORIES.has(place.category) && (
        <div className="popup__rate">
          <span className="popup__rate-label">Nightly</span>
          <span className="popup__rate-value">{place.rate ?? 'Not published for Nov 6–7 — check the site'}</span>
          {place.rateNote && <span className="popup__rate-note">{place.rateNote}</span>}
        </div>
      )}

      {hypeWindows.length > 0 && (
        <div className={`popup__hype${hype ? ` popup__hype--${hype.level}` : ''}`}>
          <div className="popup__hype-now">
            <HypeMeter level={hype?.level ?? 0} />
            <strong>{hype ? HYPE_LEVELS[hype.level].label : 'Calm at this time'}</strong>
            {hype && <span className="popup__hype-reason">{hype.reason}</span>}
          </div>
          <ul className="popup__hype-list">
            {hypeWindows.slice(0, 4).map((w) => (
              <li key={`${w.start}-${w.level}`} aria-current={w === hype ? 'true' : undefined}>
                <span className="popup__hype-when">{formatWindow(w)}</span> · {HYPE_LEVELS[w.level].label}
                {!w.verified && <span className="tag">est.</span>}
              </li>
            ))}
          </ul>
          <p className="popup__hype-note">Expected crowds from the schedule, not live data.</p>
        </div>
      )}

      {place.warning && (
        <p className="popup__warn" role="note">
          <span aria-hidden="true">⚠</span> {place.warning}
        </p>
      )}

      <div className="popup__actions">
        <a className="btn btn--primary" href={directions} target="_blank" rel="noreferrer">
          Directions
        </a>
        {place.url && (
          <a className="btn" href={place.url} target="_blank" rel="noreferrer">
            {linkLabel(place)}
          </a>
        )}
        <button type="button" className="btn" aria-pressed={starred} onClick={() => onToggleStar(place.id)}>
          {starred ? '★ Starred' : '☆ Star'}
        </button>
        <button type="button" className="btn" aria-expanded={picking} onClick={() => setPicking((v) => !v)}>
          ＋ Lists{listCount > 0 ? ` (${listCount})` : ''}
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
    </div>
  );
}
