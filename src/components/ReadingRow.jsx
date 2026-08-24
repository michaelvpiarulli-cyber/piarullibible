import { useEffect, useRef } from 'react';
import PassageText from './PassageText';
import { useReaderPrefs } from '../hooks/useReaderPrefs';

export default function ReadingRow({
  reading,
  done,
  onToggle,
  expanded,
  onExpand,
  onMarkDone,
}) {
  const { fontSize } = useReaderPrefs();
  const rowRef = useRef(null);

  // When a passage opens, bring it into view so reading starts immediately.
  useEffect(() => {
    if (!expanded || !rowRef.current) return;
    const id = window.setTimeout(() => {
      rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 60);
    return () => window.clearTimeout(id);
  }, [expanded]);

  return (
    <li
      ref={rowRef}
      className={`reading-row${done ? ' done' : ''}${expanded ? ' open' : ''}`}
    >
      <div className="reading-main">
        <button
          type="button"
          className={`check${done ? ' checked' : ''}`}
          onClick={onToggle}
          role="checkbox"
          aria-checked={done}
          aria-label={`Mark ${reading.label} as read`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="3"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m5 12.5 4.5 4.5L19 7.5" />
          </svg>
        </button>

        <button type="button" className="reading-info" onClick={onExpand}>
          <span className="track-name">{reading.trackName}</span>
          <span className="reading-label">{reading.label}</span>
        </button>

        {!expanded && (
          <button
            type="button"
            className="read-action"
            onClick={onExpand}
            aria-expanded={false}
          >
            Read
          </button>
        )}
      </div>

      {expanded && (
        <div className="reading-expand">
          <PassageText chapters={reading.chapters} fontSize={fontSize} compactHead />
          <div className="reading-done-bar">
            <button type="button" className="btn-secondary" onClick={onExpand}>
              Close
            </button>
            {!done && (
              <button type="button" className="btn-primary" onClick={onMarkDone || onToggle}>
                Mark done
              </button>
            )}
          </div>
        </div>
      )}
    </li>
  );
}
