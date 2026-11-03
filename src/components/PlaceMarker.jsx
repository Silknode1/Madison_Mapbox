import { memo } from 'react';
import { Marker } from 'react-map-gl';

/**
 * One color-coded pin. The emoji is a second cue besides color, so similar hues
 * (Packers green vs Airbnb green, Vikings purple vs Sports purple) are still easy to tell apart.
 */
function PlaceMarker({ place, category, selected, starred, onSelect }) {
  const className = ['pin', selected && 'pin--selected', starred && 'pin--starred']
    .filter(Boolean)
    .join(' ');

  return (
    <Marker
      longitude={place.lng}
      latitude={place.lat}
      anchor="center"
      style={{ zIndex: selected ? 10 : 1 }}
      onClick={(event) => {
        // Without this the map would also see the click and immediately close the popup.
        event.originalEvent.stopPropagation();
        onSelect(place);
      }}
    >
      <button
        type="button"
        className={className}
        style={{ '--pin': category.color }}
        aria-label={`${place.name}, ${category.label}${starred ? ', starred' : ''}`}
      >
        <span aria-hidden="true">{category.emoji}</span>
      </button>
    </Marker>
  );
}

export default memo(PlaceMarker);
