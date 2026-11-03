import { useEffect, useRef } from 'react';
import { HYPE_LEVELS } from '../hype.js';
import { formatMiles } from '../lib/geo.js';

/**
 * Side sheet (bottom sheet on phones) with every list and its places, nearest to the
 * epicenter first. Tap a place to fly to it; "Show on map" filters the pins to that list.
 */
export default function ListsDrawer({
  open,
  onClose,
  lists,
  byList,
  placesById,
  categories,
  milesFor,
  hypeById,
  activeList,
  onShowList,
  onPick,
  onRemove,
  onCreate,
  onDelete,
  syncStatus,
}) {
  const closeRef = useRef(null);
  useEffect(() => {
    if (!open) return undefined;
    closeRef.current?.focus();
    const onKey = (event) => event.key === 'Escape' && onClose();
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  const submit = (event) => {
    event.preventDefault();
    const input = event.currentTarget.elements.listName;
    const name = input.value.trim().slice(0, 40);
    if (name) onCreate(name);
    input.value = '';
  };

  return (
    <aside className="drawer" aria-label="Your lists">
      <header className="drawer__head">
        <div>
          <h2 className="drawer__title">Your lists</h2>
          <p className="drawer__sub">
            {syncStatus === 'synced'
              ? 'Shared between your phones'
              : syncStatus === 'partial'
                ? 'Stars sync; other lists are on this device until the database is updated'
                : 'Saved on this device'}
          </p>
        </div>
        <button type="button" className="drawer__close" onClick={onClose} ref={closeRef} aria-label="Close lists">
          ✕
        </button>
      </header>

      <form className="list-picker__new drawer__new" onSubmit={submit}>
        <input name="listName" type="text" placeholder="New list, e.g. “Sunday brunch”" aria-label="New list name" maxLength={40} />
        <button type="submit" className="btn">Create</button>
      </form>

      <div className="drawer__body">
        {lists.map((list) => {
          const ids = [...(byList.get(list.id) ?? [])].filter((id) => placesById.has(id));
          const places = ids.map((id) => placesById.get(id)).sort((a, b) => milesFor(a) - milesFor(b));
          const showing = activeList === list.id;
          return (
            <section key={list.id} className="dlist">
              <div className="dlist__head">
                <h3 className="dlist__name">
                  <span aria-hidden="true">{list.emoji}</span> {list.name}
                  <span className="chip__count">{places.length}</span>
                </h3>
                <div className="dlist__actions">
                  {places.length > 0 && (
                    <button type="button" className="link-btn" aria-pressed={showing} onClick={() => onShowList(showing ? null : list.id)}>
                      {showing ? 'Showing' : 'Show on map'}
                    </button>
                  )}
                  {!list.builtIn && (
                    <button type="button" className="link-btn link-btn--danger" onClick={() => onDelete(list.id)}>
                      Delete
                    </button>
                  )}
                </div>
              </div>

              {places.length === 0 ? (
                <p className="dlist__empty">Empty — open a pin and tap “＋ Lists”.</p>
              ) : (
                <ul className="dlist__items">
                  {places.map((place) => {
                    const category = categories[place.category];
                    const hype = hypeById.get(place.id);
                    return (
                      <li key={place.id} className="dlist__item">
                        <button type="button" className="dlist__pick" onClick={() => onPick(place)}>
                          <span className="dot" style={{ '--c': category.color }} aria-hidden="true" />
                          <span className="dlist__text">
                            <span className="dlist__place">{place.name}</span>
                            <span className="dlist__meta">
                              {category.label} · {formatMiles(milesFor(place))}
                              {place.priceLevel ? ` · ${'$'.repeat(place.priceLevel)}` : ''}
                              {hype && <span className={`dlist__hype dlist__hype--${hype.level}`}> · 🔥 {HYPE_LEVELS[hype.level].label}</span>}
                            </span>
                          </span>
                        </button>
                        <button
                          type="button"
                          className="dlist__remove"
                          aria-label={`Remove ${place.name} from ${list.name}`}
                          onClick={() => onRemove(list.id, place.id)}
                        >
                          ✕
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </section>
          );
        })}
      </div>
    </aside>
  );
}
