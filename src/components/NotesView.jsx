import { useState } from 'react';
import { colorValue } from '../hooks/useAnnotations';

const FILTERS = [
  { id: 'all', label: 'All' },
  { id: 'notes', label: 'Notes' },
  { id: 'highlights', label: 'Highlights' },
];

/** "Genesis 1:1" -> sortable [book, chapter, verse] */
function parseId(id) {
  const [ref, verse] = id.split(':');
  const lastSpace = ref.lastIndexOf(' ');
  return {
    book: ref.slice(0, lastSpace),
    chapter: Number(ref.slice(lastSpace + 1)),
    verse: Number(verse),
  };
}

export default function NotesView({ highlights, notes, onSelectVerse, setHighlight, setNote }) {
  const [filter, setFilter] = useState('all');

  const ids = Array.from(new Set([...Object.keys(highlights), ...Object.keys(notes)]));

  const visible = ids
    .filter((id) => {
      if (filter === 'notes') return notes[id];
      if (filter === 'highlights') return highlights[id];
      return true;
    })
    .sort((a, b) => {
      const pa = parseId(a);
      const pb = parseId(b);
      return pa.book.localeCompare(pb.book) || pa.chapter - pb.chapter || pa.verse - pb.verse;
    });

  return (
    <div className="notes-view">
      <div className="filter-row">
        {FILTERS.map((f) => (
          <button
            key={f.id}
            type="button"
            className={`chip${filter === f.id ? ' active' : ''}`}
            onClick={() => setFilter(f.id)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          <p className="empty-title">Nothing saved yet</p>
          <p className="empty-sub">
            Open a reading, tap any verse, and you can highlight it or leave a note.
          </p>
        </div>
      ) : (
        <ul className="note-list">
          {visible.map((id) => (
            <li key={id} className="note-card">
              <div className="note-card-head">
                <span className="note-ref">{id}</span>
                {highlights[id] && (
                  <span className="note-dot" style={{ background: colorValue(highlights[id]) }} />
                )}
              </div>

              {notes[id] && <p className="note-body">{notes[id]}</p>}

              <div className="note-card-actions">
                <button
                  type="button"
                  className="btn-text"
                  onClick={() => onSelectVerse({ id, text: notes[id] || '' })}
                >
                  Edit
                </button>
                <button
                  type="button"
                  className="btn-text danger"
                  onClick={() => {
                    setHighlight(id, null);
                    setNote(id, '');
                  }}
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
