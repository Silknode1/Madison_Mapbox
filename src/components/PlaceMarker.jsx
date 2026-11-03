import { memo } from 'react';
import { Marker } from 'react-map-gl';
import { HYPE_LEVELS } from '../hype.js';

/**
 * One color-coded pin. The emoji is a second cue besides color, so similar hues
 * (Packers green vs Airbnb green, Vikings purple vs Sports purple) are still easy to tell apart.
 * `hype` (0–3) adds the pulsing glow for places expected to be busy at the chosen time.
 */
function PlaceMarker({ place, category, selected, starred, hype, onSelect }) {
  const className = [
    'pin',
    selected && 'pin--selected',
    starred && 'pin--starred',
    hype > 0 && `pin--hype pin--hype-${hype}`,
  ]
    .filter(Boolean)
    .join(' ');

  const label = [place.name, category.label, starred && 'starred', hype > 0 && HYPE_LEVELS[hype].label.toLowerCase()]
    .filter(Boolean)
    .join(', ');

  return (
    <Marker
      longitude={place.lng}
      latitude={place.lat}
      anchor="center"
      style={{ zIndex: selected ? 10 : hype > 0 ? 2 + hype : 1 }}
      onClick={(event) => {
        // Without this the map would also see the click and immediately close the popup.
        event.originalEvent.stopPropagation();
        onSelect(place);
      }}
    >
      <button type="button" className={className} style={{ '--pin': category.color }} aria-label={label}>
        {hype > 0 && <span className="pin__glow" aria-hidden="true" />}
        <span aria-hidden="true">{category.emoji}</span>
      </button>
    </Marker>
  );
}

export default memo(PlaceMarker);
