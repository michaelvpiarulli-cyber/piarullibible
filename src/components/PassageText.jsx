import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { colorValue, verseId } from '../hooks/useAnnotations';
import { useVerseAnnotations } from '../context/annotations';
import Commentary from './Commentary';
import DrawCanvas from './DrawCanvas';

const INK_COLORS = [
  { id: 'ink', value: '#121212', label: 'Black' },
  { id: 'red', value: '#ff3d4d', label: 'Red' },
  { id: 'blue', value: '#2f6fd0', label: 'Blue' },
  { id: 'green', value: '#2e9e5b', label: 'Green' },
];

/** World English Bible — modern-English public-domain revision of the ASV. */
export const TRANSLATION = 'web';
export const TRANSLATION_LABEL = 'WEB';

const textCache = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

async function fetchChapter(book, chapter) {
  const reference = `${book} ${chapter}`;
  const cacheKey = `${TRANSLATION}|${reference}`;
  if (textCache.has(cacheKey)) return textCache.get(cacheKey);

  const url = `https://bible-api.com/${encodeURIComponent(reference)}?translation=${TRANSLATION}`;

  // bible-api.com throttles bursts, so back off and retry rather than failing
  // the whole passage on one dropped chapter.
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      const data = await res.json();
      const result = {
        book,
        chapter,
        heading: reference,
        verses: data.verses.map((v) => ({
          number: v.verse,
          // The API preserves poetry line breaks; flow them as prose the way a
          // chapter view reads.
          text: v.text.replace(/\s*\n\s*/g, ' ').trim(),
        })),
      };
      textCache.set(cacheKey, result);
      return result;
    } catch (err) {
      lastErr = err;
      await sleep(400 * (attempt + 1));
    }
  }
  throw new Error(`Couldn't load ${reference} (${lastErr.message})`);
}

/**
 * The note indicator on a verse. On hover (pointer devices only) it previews
 * the note text in a fixed-position tooltip rendered to <body>, so the reader's
 * scroll container can't clip it. On touch, tapping the verse opens the sheet.
 */
function NoteFlag({ note }) {
  const [coords, setCoords] = useState(null);

  const show = (e) => {
    if (!window.matchMedia('(hover: hover)').matches) return;
    const r = e.currentTarget.getBoundingClientRect();
    // Clamp so a ~260px tooltip stays on screen at the edges.
    const x = Math.min(Math.max(r.left + r.width / 2, 140), window.innerWidth - 140);
    setCoords({ x, y: r.top });
  };
  const hide = () => setCoords(null);

  // Any scroll dismisses it so the fixed tooltip can't drift from the icon.
  useEffect(() => {
    if (!coords) return;
    const onScroll = () => setCoords(null);
    window.addEventListener('scroll', onScroll, true);
    return () => window.removeEventListener('scroll', onScroll, true);
  }, [coords]);

  return (
    <span className="note-flag-wrap" onMouseEnter={show} onMouseLeave={hide} onClick={hide}>
      <svg className="note-flag" viewBox="0 0 24 24" fill="currentColor" aria-label={`Note: ${note}`}>
        <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
      </svg>
      {coords &&
        createPortal(
          <div className="note-tooltip" style={{ left: coords.x, top: coords.y }} role="tooltip">
            <span className="note-tooltip-label">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
              </svg>
              Note
            </span>
            <span className="note-tooltip-body">{note}</span>
          </div>,
          document.body
        )}
    </span>
  );
}

function ReaderChapter({ part, highlights, notes, onSelectVerse }) {
  const [showCommentary, setShowCommentary] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState({ mode: 'pen', color: '#121212', width: 0.006 });
  // Off by default so a finger scrolls and only a stylus/mouse inks — the
  // iPad + Apple Pencil case. Turn on to draw with a fingertip.
  const [fingerDraws, setFingerDraws] = useState(false);
  const drawApi = useRef(null);
  const registerApi = useCallback((api) => {
    drawApi.current = api;
  }, []);

  // Notes for this chapter, in verse order, carrying verse text so tapping one
  // reopens the sheet with the right verse.
  const chapterNotes = part.verses
    .map((v) => {
      const id = verseId(part.book, part.chapter, v.number);
      return notes[id]
        ? { id, number: v.number, text: v.text, note: notes[id], color: colorValue(highlights[id]) }
        : null;
    })
    .filter(Boolean);

  return (
    <article className="reader-chapter">
      <h4 className="reader-chapter-title">
        {part.heading}
        <span className="reader-translation">{TRANSLATION_LABEL}</span>
      </h4>

      <div className={`chapter-page${drawing ? ' drawing' : ''}`}>
      <p className="reader-body">
        {part.verses.map((v) => {
          const id = verseId(part.book, part.chapter, v.number);
          const color = colorValue(highlights[id]);
          const hasNote = Boolean(notes[id]);
          return (
            <span
              key={v.number}
              className={`verse${hasNote ? ' has-note' : ''}`}
              style={color ? { background: color } : undefined}
              onClick={() => onSelectVerse({ id, text: v.text })}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectVerse({ id, text: v.text });
                }
              }}
            >
              <span className="verse-number">{v.number}</span>
              <span className="verse-content">{v.text}</span>
              {hasNote && <NoteFlag note={notes[id]} />}{' '}
            </span>
          );
        })}
      </p>

        <DrawCanvas
          chapterKey={part.heading}
          active={drawing}
          tool={tool}
          fingerDraws={fingerDraws}
          registerApi={registerApi}
        />
      </div>

      {drawing && (
        <div className="ink-bar">
          <div className="ink-group">
            {INK_COLORS.map((c) => (
              <button
                key={c.id}
                type="button"
                className={`ink-swatch${tool.color === c.value && tool.mode !== 'erase' ? ' active' : ''}`}
                style={{ background: c.value }}
                aria-label={c.label}
                onClick={() => setTool((t) => ({ ...t, color: c.value, mode: t.mode === 'erase' ? 'pen' : t.mode }))}
              />
            ))}
          </div>

          <div className="ink-group">
            <button
              type="button"
              className={`ink-tool${tool.mode === 'pen' ? ' active' : ''}`}
              onClick={() => setTool((t) => ({ ...t, mode: 'pen' }))}
            >
              Pen
            </button>
            <button
              type="button"
              className={`ink-tool${tool.mode === 'circle' ? ' active' : ''}`}
              onClick={() => setTool((t) => ({ ...t, mode: 'circle' }))}
            >
              Circle
            </button>
            <button
              type="button"
              className={`ink-tool${tool.mode === 'erase' ? ' active' : ''}`}
              onClick={() => setTool((t) => ({ ...t, mode: 'erase' }))}
            >
              Erase
            </button>
          </div>

          <div className="ink-group">
            <button type="button" className="ink-tool" onClick={() => drawApi.current?.undo()}>
              Undo
            </button>
            <button type="button" className="ink-tool" onClick={() => drawApi.current?.clear()}>
              Clear
            </button>
          </div>

          <div className="ink-group">
            <button
              type="button"
              className={`ink-tool${fingerDraws ? ' active' : ''}`}
              onClick={() => setFingerDraws(!fingerDraws)}
              title="Off: finger scrolls, stylus draws. On: draw with your finger."
            >
              {fingerDraws ? 'Finger draws' : 'Finger scrolls'}
            </button>
          </div>
        </div>
      )}

      <div className="commentary-toggle-row">
        <button
          type="button"
          className={`commentary-toggle${drawing ? ' active' : ''}`}
          onClick={() => setDrawing(!drawing)}
          aria-expanded={drawing}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
          </svg>
          {drawing ? 'Done drawing' : 'Draw'}
        </button>

        {chapterNotes.length > 0 && (
          <button
            type="button"
            className={`commentary-toggle${showNotes ? ' active' : ''}`}
            onClick={() => setShowNotes(!showNotes)}
            aria-expanded={showNotes}
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {showNotes ? 'Hide notes' : `Notes (${chapterNotes.length})`}
          </button>
        )}

        <button
          type="button"
          className={`commentary-toggle${showCommentary ? ' active' : ''}`}
          onClick={() => setShowCommentary(!showCommentary)}
          aria-expanded={showCommentary}
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-1.5Z" />
            <path d="M8 7h7M8 11h7" />
          </svg>
          {showCommentary ? 'Hide commentary' : 'Commentary'}
        </button>
      </div>

      {showNotes && chapterNotes.length > 0 && (
        <div className="chapter-notes">
          {chapterNotes.map((n) => (
            <button
              key={n.id}
              type="button"
              className="chapter-note"
              onClick={() => onSelectVerse({ id: n.id, text: n.text })}
            >
              <span className="chapter-note-num">{n.number}</span>
              <span className="chapter-note-text">{n.note}</span>
              {n.color && <span className="chapter-note-dot" style={{ background: n.color }} />}
            </button>
          ))}
        </div>
      )}

      {showCommentary && (
        <Commentary
          book={part.book}
          chapter={part.chapter}
          lastVerse={part.verses[part.verses.length - 1]?.number ?? part.verses.length}
        />
      )}
    </article>
  );
}

export default function PassageText({ chapters }) {
  const { highlights, notes, onSelectVerse } = useVerseAnnotations();
  const [parts, setParts] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setParts([]);
    setError(null);
    setLoading(true);

    (async () => {
      const loaded = [];
      for (const c of chapters) {
        try {
          const part = await fetchChapter(c.book, c.chapter);
          if (cancelled) return;
          loaded.push(part);
          setParts([...loaded]);
        } catch (err) {
          if (cancelled) return;
          setError(err.message);
          break;
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [chapters]);

  return (
    <div className="reader">
      {parts.map((part) => (
        <ReaderChapter
          key={part.heading}
          part={part}
          highlights={highlights}
          notes={notes}
          onSelectVerse={onSelectVerse}
        />
      ))}

      {loading && !error && (
        <div className="passage-status">
          Loading {parts.length ? `${parts.length + 1} of ${chapters.length}` : ''}…
        </div>
      )}

      {error && <div className="passage-status passage-error">{error}</div>}
    </div>
  );
}
