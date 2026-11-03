/** Popup body: name + short description, plus directions and a star toggle. */
export default function PlacePopup({ place, category, starred, onToggleStar }) {
  // Apple Maps link: opens the Maps app on iPhone, maps.apple.com elsewhere. dirflg=w -> walking.
  const directions = `https://maps.apple.com/?daddr=${place.lat},${place.lng}&dirflg=w`;

  return (
    <div className="popup">
      <span className="popup__cat" style={{ '--c': category.color }}>
        <span className="dot" aria-hidden="true" />
        {category.label}
      </span>

      <h3 className="popup__name">{place.name}</h3>
      <p className="popup__desc">{place.description}</p>
      {place.address && <p className="popup__addr">{place.address}, Madison</p>}

      {place.warning && (
        <p className="popup__warn" role="note">
          <span aria-hidden="true">⚠</span> {place.warning}
        </p>
      )}

      <div className="popup__actions">
        <a className="btn btn--primary" href={directions} target="_blank" rel="noreferrer">
          Directions
        </a>
        <button
          type="button"
          className="btn"
          aria-pressed={starred}
          onClick={() => onToggleStar(place.id)}
        >
          {starred ? '★ Starred' : '☆ Star'}
        </button>
      </div>
    </div>
  );
}
