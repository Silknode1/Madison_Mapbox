import { HYPE_TIMES } from '../hype.js';

/** "🔥 Hype at [time ▾] · N busy" — picks the moment the glow on the map reflects. */
export default function HypeBar({ value, onChange, busyCount }) {
  return (
    <div className="hype-bar">
      <label className="hype-bar__label" htmlFor="hype-time">
        <span aria-hidden="true">🔥</span> Hype at
      </label>
      <select id="hype-time" className="hype-bar__select" value={value} onChange={(e) => onChange(e.target.value)}>
        <option value="now">Right now</option>
        {HYPE_TIMES.map((t) => (
          <option key={t.value} value={t.value}>
            {t.label}
          </option>
        ))}
      </select>
      <span className="hype-bar__count" aria-live="polite">
        {busyCount === 0 ? 'all calm' : `${busyCount} busy`}
      </span>
    </div>
  );
}
