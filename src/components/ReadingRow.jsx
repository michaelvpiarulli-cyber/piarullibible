import PassageText from './PassageText';

export default function ReadingRow({ reading, done, onToggle, expanded, onExpand }) {
  return (
    <li className={`reading-row${done ? ' done' : ''}`}>
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

        <button type="button" className="reading-info" onClick={onExpand}>
          <span className="track-name">{reading.trackName}</span>
          <span className="reading-label">{reading.label}</span>
        </button>

        <button type="button" className="chevron" onClick={onExpand} aria-label={expanded ? 'Hide text' : 'Read'}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d={expanded ? 'm6 15 6-6 6 6' : 'm6 9 6 6 6-6'} />
          </svg>
        </button>
      </div>

      {expanded && <PassageText chapters={reading.chapters} />}
    </li>
  );
}
