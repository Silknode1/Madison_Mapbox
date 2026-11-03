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
  hotOnly,
  hotCount,
  onToggleHotOnly,
  activeList,
  activeListCount,
  onClearList,
  onOpenLists,
  listItemCount,
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

        {activeList ? (
          <button
            type="button"
            className="chip chip--star"
            style={{ '--c': '#f59e0b' }}
            aria-pressed="true"
            aria-label={`Showing list ${activeList.name}; tap to show everything`}
            onClick={onClearList}
          >
            <span aria-hidden="true">{activeList.emoji}</span>
            {activeList.name}
            <span className="chip__count">{activeListCount}</span>
            <span aria-hidden="true">✕</span>
          </button>
        ) : (
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
        )}

        <button
          type="button"
          className="chip chip--lists"
          style={{ '--c': '#6366f1' }}
          aria-pressed="false"
          aria-haspopup="dialog"
          onClick={onOpenLists}
        >
          <span aria-hidden="true">📋</span>
          Lists
          <span className="chip__count">{listItemCount}</span>
        </button>

        <button
          type="button"
          className="chip chip--hot"
          style={{ '--c': '#ff5a1f' }}
          aria-pressed={hotOnly}
          onClick={onToggleHotOnly}
        >
          <span aria-hidden="true">🔥</span>
          Busy only
          <span className="chip__count">{hotCount}</span>
        </button>
      </div>
    </section>
  );
}
