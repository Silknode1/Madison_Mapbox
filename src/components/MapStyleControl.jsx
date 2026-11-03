import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useControl, useMap } from 'react-map-gl';
import { LIGHT_OPTIONS, MAP_STYLES } from '../hooks/useMapStyle.js';

/** Minimal IControl that hands Mapbox a DOM node we render into with a React portal. */
class PortalControl {
  constructor(el) {
    this.el = el;
  }
  onAdd() {
    return this.el;
  }
  onRemove() {
    this.el.remove();
  }
}

/**
 * "Layers" button in the map's control stack. Opens a small menu to pick the basemap
 * (Standard / Satellite / Minimal) and its lighting. Also applies the lighting to the map.
 */
export default function MapStyleControl({ styleKey, onStyle, light, onLight, preset }) {
  const [el] = useState(() => {
    const div = document.createElement('div');
    div.className = 'mapboxgl-ctrl style-ctrl';
    return div;
  });
  useControl(() => new PortalControl(el), { position: 'top-right' });

  const { current: mapRef } = useMap();
  const style = MAP_STYLES[styleKey];

  // Mapbox Standard is configured at runtime, and the config resets on every style change,
  // so apply it now and again on each 'style.load'.
  useEffect(() => {
    const map = mapRef?.getMap();
    if (!map || !style.lighting) return undefined;
    const apply = () => {
      try {
        map.setConfigProperty('basemap', 'lightPreset', preset);
        map.setConfigProperty('basemap', 'showPointOfInterestLabels', false); // our pins are the POIs
      } catch {
        /* style still loading — the 'style.load' listener below will catch it */
      }
    };
    apply();
    map.on('style.load', apply);
    return () => map.off('style.load', apply);
  }, [mapRef, style, preset]);

  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const close = (event) => {
      if (!el.contains(event.target)) setOpen(false);
    };
    const onKey = (event) => event.key === 'Escape' && setOpen(false);
    document.addEventListener('pointerdown', close);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('pointerdown', close);
      document.removeEventListener('keydown', onKey);
    };
  }, [open, el]);

  return createPortal(
    <>
      <div className="mapboxgl-ctrl-group">
        <button
          type="button"
          className="style-ctrl__btn"
          aria-label="Map style"
          aria-expanded={open}
          onClick={() => setOpen((o) => !o)}
        >
          <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true">
            <path d="M12 3 2 8.5 12 14l10-5.5L12 3Z" fill="currentColor" opacity=".9" />
            <path d="m4.2 12.3-2.2 1.2L12 19l10-5.5-2.2-1.2L12 16.6l-7.8-4.3Z" fill="currentColor" opacity=".55" />
          </svg>
        </button>
      </div>

      {open && (
        <div className="style-menu" role="dialog" aria-label="Map style" ref={menuRef}>
          <p className="eyebrow">Map</p>
          <div className="style-menu__options">
            {Object.entries(MAP_STYLES).map(([key, s]) => (
              <button
                key={key}
                type="button"
                className="style-menu__option"
                aria-pressed={key === styleKey}
                onClick={() => onStyle(key)}
              >
                <span className={`style-menu__thumb style-menu__thumb--${key}`} aria-hidden="true" />
                <span className="style-menu__text">
                  <span className="style-menu__label">{s.label}</span>
                  <span className="style-menu__hint">{s.hint}</span>
                </span>
              </button>
            ))}
          </div>

          <p className="eyebrow">Light</p>
          <div className="style-menu__seg" role="group" aria-label="Lighting">
            {LIGHT_OPTIONS.map((o) => (
              <button
                key={o.value}
                type="button"
                aria-pressed={o.value === light}
                disabled={!style.lighting}
                onClick={() => onLight(o.value)}
              >
                {o.label}
              </button>
            ))}
          </div>
          <p className="style-menu__note">
            {style.lighting
              ? `Auto matches Madison's sky at the hype-meter time (now: ${preset}).`
              : 'Minimal follows your phone’s light/dark mode.'}
          </p>
        </div>
      )}
    </>,
    el,
  );
}
