import PassageText from './PassageText';

export default function ReadingRow({
  reading,
  done,
  onToggle,
  expanded,
  onExpand,
  onOpenReading,
}) {
  const openFullscreen = Boolean(onOpenReading);
  const open = () => {
    if (openFullscreen) onOpenReading(reading);
    else onExpand?.();
  };

  return (
    <li className={`reading-row${done ? ' done' : ''}${openFullscreen ? ' opens-bible' : ''}`}>
      <div className="reading-main">
        <button
          type="button"
          className={`check${done ? ' checked' : ''}`}
          onClick={onToggle}
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark ${reading.label} as read`}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </button>

        <button type="button" className="reading-info" onClick={open}>
          <span className="track-name">{reading.trackName}</span>
          <span className="reading-label">{reading.label}</span>
        </button>

        <button
          type="button"
          className="chevron"
          onClick={open}
          aria-label={openFullscreen ? 'Open in Bible' : expanded ? 'Hide text' : 'Read'}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            {openFullscreen ? (
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
            ) : (
              <path d={expanded ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
            )}
          </svg>
        </button>
      </div>

      {!openFullscreen && expanded && <PassageText chapters={reading.chapters} />}
    </li>
  );
}
