import { useEffect, useState } from 'react';
import { HIGHLIGHT_COLORS } from '../hooks/useAnnotations';

export default function VerseActionSheet({
  verse,
  highlight,
  note,
  onHighlight,
  onSaveNote,
  onClose,
}) {
  const [noteOpen, setNoteOpen] = useState(Boolean(note));
  const [draft, setDraft] = useState(note || '');

  // Re-sync when the user taps a different verse without closing the sheet.
  useEffect(() => {
    setDraft(note || '');
    setNoteOpen(Boolean(note));
  }, [verse.id, note]);

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const save = () => {
    onSaveNote(verse.id, draft);
    onClose();
  };

  return (
    <>
      <div className="sheet-scrim" onClick={onClose} />
      <div className="verse-sheet" role="dialog" aria-label={`Actions for ${verse.id}`}>
        <div className="sheet-grabber" />

        <div className="sheet-head">
          <span className="sheet-ref">{verse.id}</span>
          <button type="button" className="sheet-close" onClick={onClose} aria-label="Close">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        <p className="sheet-verse-text">{verse.text}</p>

        <div className="swatches">
          {HIGHLIGHT_COLORS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`swatch${highlight === c.id ? ' active' : ''}`}
              style={{ background: c.value }}
              onClick={() => onHighlight(verse.id, c.id)}
              aria-label={`Highlight ${c.label}`}
              aria-pressed={highlight === c.id}
            />
          ))}
          <button
            type="button"
            className="swatch clear"
            onClick={() => onHighlight(verse.id, null)}
            aria-label="Remove highlight"
            disabled={!highlight}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>

        {noteOpen ? (
          <div className="note-editor">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write a note…"
              rows={4}
              autoFocus
            />
            <div className="note-actions">
              {note && (
                <button
                  type="button"
                  className="btn-text danger"
                  onClick={() => {
                    onSaveNote(verse.id, '');
                    onClose();
                  }}
                >
                  Delete
                </button>
              )}
              <button type="button" className="btn-text" onClick={onClose}>
                Cancel
              </button>
              <button type="button" className="btn-primary" onClick={save}>
                Save
              </button>
            </div>
          </div>
        ) : (
          <button type="button" className="btn-secondary" onClick={() => setNoteOpen(true)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            Add note
          </button>
        )}
      </div>
    </>
  );
}
