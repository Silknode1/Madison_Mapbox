/** Category toggle chips with All / None shortcuts, plus a "Starred" filter. */
export default function CategoryFilters({
  categories,
  counts,
  enabled,
  onToggle,
  onAll,
  onNone,
  starredOnly,
  starredCount,
  onToggleStarredOnly,
}) {
  return (
    <section className="filters" aria-label="Category filters">
      <div className="filters__head">
        <h2 className="eyebrow">Categories</h2>
        <div className="filters__actions">
          <button type="button" className="link-btn" onClick={onAll}>
            All
          </button>
          <span aria-hidden="true">·</span>
          <button type="button" className="link-btn" onClick={onNone}>
            None
          </button>
        </div>
      </div>

      <div className="chips" role="group" aria-label="Toggle categories">
        {Object.entries(categories).map(([key, category]) => (
          <button
            key={key}
            type="button"
            className="chip"
            style={{ '--c': category.color }}
            aria-pressed={enabled.has(key)}
            onClick={() => onToggle(key)}
          >
            <span className="dot" aria-hidden="true" />
            {category.label}
            <span className="chip__count">{counts[key] ?? 0}</span>
          </button>
        ))}

        <button
          type="button"
          className="chip chip--star"
          style={{ '--c': '#f59e0b' }}
          aria-pressed={starredOnly}
          onClick={onToggleStarredOnly}
        >
          <span aria-hidden="true">★</span>
          Starred only
          <span className="chip__count">{starredCount}</span>
        </button>
      </div>
    </section>
  );
}
