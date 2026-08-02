import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { colorValue, verseId } from '../hooks/useAnnotations';
import { useVerseAnnotations } from '../context/annotations';
import { BOOK_BY_CODE, HELLOAO_CODES, formatRef } from '../data/bookRefs';
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

/** helloao.org id for WEB — includes wordsOfJesus markup for red-letter text. */
const HELLOAO_TRANSLATION = 'ENGWEBP';

/** Cap how many cross-refs we surface per verse (dataset can have 30+). */
const MAX_CROSS_REFS = 10;

const textCache = new Map();
const xrefCache = new Map();

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/** Turn helloao verse content into plain text + red-letter segments. */
function parseVerseContent(content) {
  const segments = [];
  for (const part of content || []) {
    let text = null;
    let wordsOfJesus = false;
    if (typeof part === 'string') {
      text = part.replace(/\s*\n\s*/g, ' ');
    } else if (part?.text) {
      text = String(part.text).replace(/\s*\n\s*/g, ' ');
      wordsOfJesus = Boolean(part.wordsOfJesus);
    }
    // noteId / other markers are skipped — footnotes aren't shown yet.
    if (!text) continue;

    // helloao splits speech tags from dialogue without a joining space
    // ("Jesus answered him," + "“Most…"), so insert one when needed.
    if (segments.length) {
      const prev = segments[segments.length - 1].text;
      if (!/\s$/.test(prev) && !/^\s|^[,.;:!?…”']/.test(text)) {
        text = ` ${text}`;
      }
    }
    segments.push({ text, wordsOfJesus });
  }
  const text = segments
    .map((s) => s.text)
    .join('')
    .replace(/\s+/g, ' ')
    .trim();
  return { segments, text };
}

async function fetchJson(url) {
  let lastErr;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url);
      if (!res.ok) throw new Error(`${res.status}`);
      if (!(res.headers.get('content-type') || '').includes('json')) {
        throw new Error('bad response');
      }
      return await res.json();
    } catch (err) {
      lastErr = err;
      await sleep(400 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function fetchChapter(book, chapter) {
  const reference = `${book} ${chapter}`;
  const cacheKey = `${HELLOAO_TRANSLATION}|${reference}`;
  if (textCache.has(cacheKey)) return textCache.get(cacheKey);

  const code = HELLOAO_CODES[book];
  if (!code) throw new Error(`Unknown book: ${book}`);

  const data = await fetchJson(
    `https://bible.helloao.org/api/${HELLOAO_TRANSLATION}/${code}/${chapter}.json`
  );

  const verses = (data.chapter?.content || [])
    .filter((item) => item.type === 'verse')
    .map((v) => {
      const { segments, text } = parseVerseContent(v.content);
      return { number: v.number, segments, text };
    });

  const result = { book, chapter, heading: reference, verses };
  textCache.set(cacheKey, result);
  return result;
}

/**
 * OpenBible.info cross-refs via helloao's open-cross-ref dataset.
 * Returns a map of verse number → top scored references.
 */
async function fetchCrossRefs(book, chapter) {
  const cacheKey = `${book}|${chapter}`;
  if (xrefCache.has(cacheKey)) return xrefCache.get(cacheKey);

  const code = HELLOAO_CODES[book];
  if (!code) return {};

  try {
    const data = await fetchJson(
      `https://bible.helloao.org/api/d/open-cross-ref/${code}/${chapter}.json`
    );
    const byVerse = {};
    for (const entry of data.chapter?.content || []) {
      const refs = (entry.references || [])
        .filter((r) => BOOK_BY_CODE[r.book]) // 66-book canon only
        .sort((a, b) => (b.score || 0) - (a.score || 0))
        .slice(0, MAX_CROSS_REFS)
        .map((r) => ({
          book: BOOK_BY_CODE[r.book],
          chapter: r.chapter,
          verse: r.verse,
          endVerse: r.endVerse,
          label: formatRef(r),
        }));
      if (refs.length) byVerse[entry.verse] = refs;
    }
    xrefCache.set(cacheKey, byVerse);
    return byVerse;
  } catch {
    // Cross-refs are additive — don't fail the whole chapter if they're down.
    xrefCache.set(cacheKey, {});
    return {};
  }
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

function VerseText({ segments }) {
  return (
    <span className="verse-content">
      {segments.map((seg, i) =>
        seg.wordsOfJesus ? (
          <span key={i} className="words-of-jesus">
            {seg.text}
          </span>
        ) : (
          <span key={i}>{seg.text}</span>
        )
      )}
    </span>
  );
}

function ReaderChapter({ part, crossRefs, highlights, notes, onSelectVerse }) {
  const [showCommentary, setShowCommentary] = useState(false);
  const [showNotes, setShowNotes] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [tool, setTool] = useState({ mode: 'pen', color: '#121212', width: 0.006 });
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
        ? {
            id,
            number: v.number,
            text: v.text,
            segments: v.segments,
            note: notes[id],
            color: colorValue(highlights[id]),
            crossRefs: crossRefs[v.number] || [],
          }
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
          const refs = crossRefs[v.number] || [];
          return (
            <span
              key={v.number}
              id={`v-${part.book.replace(/\s+/g, '-')}-${part.chapter}-${v.number}`}
              className={`verse${hasNote ? ' has-note' : ''}${refs.length ? ' has-xrefs' : ''}`}
              style={color ? { background: color } : undefined}
              onClick={() =>
                onSelectVerse({
                  id,
                  text: v.text,
                  segments: v.segments,
                  crossRefs: refs,
                })
              }
              role="button"
              tabIndex={0}
              onKeyDown={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  onSelectVerse({
                    id,
                    text: v.text,
                    segments: v.segments,
                    crossRefs: refs,
                  });
                }
              }}
            >
              <span className="verse-number">{v.number}</span>
              <VerseText segments={v.segments} />
              {refs.length > 0 && (
                <span className="xref-marker" title={`${refs.length} cross references`} aria-hidden="true">
                  †
                </span>
              )}
              {hasNote && <NoteFlag note={notes[id]} />}{' '}
            </span>
          );
        })}
      </p>

        <DrawCanvas
          chapterKey={part.heading}
          active={drawing}
          tool={tool}
          registerApi={registerApi}
        />
      </div>

      {drawing && (
        <>
          <p className="sketch-hint">Apple Pencil only — rest your hand; fingers just scroll.</p>
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
            </div>
          </div>
        </>
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
              onClick={() =>
                onSelectVerse({
                  id: n.id,
                  text: n.text,
                  segments: n.segments,
                  crossRefs: n.crossRefs,
                })
              }
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

export default function PassageText({ chapters, focusVerse }) {
  const { highlights, notes, onSelectVerse } = useVerseAnnotations();
  const [parts, setParts] = useState([]);
  const [xrefs, setXrefs] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setParts([]);
    setXrefs({});
    setError(null);
    setLoading(true);

    (async () => {
      const loaded = [];
      const xrefMap = {};
      for (const c of chapters) {
        try {
          const [part, refs] = await Promise.all([
            fetchChapter(c.book, c.chapter),
            fetchCrossRefs(c.book, c.chapter),
          ]);
          if (cancelled) return;
          loaded.push(part);
          xrefMap[part.heading] = refs;
          setParts([...loaded]);
          setXrefs({ ...xrefMap });
        } catch (err) {
          if (cancelled) return;
          setError(err.message?.startsWith("Couldn't") ? err.message : `Couldn't load ${c.book} ${c.chapter}`);
          break;
        }
      }
      if (!cancelled) setLoading(false);
    })();

    return () => {
      cancelled = true;
    };
  }, [chapters]);

  // Scroll a jumped-to verse into view once its chapter has loaded.
  useEffect(() => {
    if (!focusVerse?.book || !focusVerse?.chapter || !focusVerse?.verse) return;
    if (loading) return;
    const id = `v-${focusVerse.book.replace(/\s+/g, '-')}-${focusVerse.chapter}-${focusVerse.verse}`;
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('verse-flash');
      const t = setTimeout(() => el.classList.remove('verse-flash'), 1600);
      return () => clearTimeout(t);
    }
  }, [focusVerse, parts, loading]);

  return (
    <div className="reader">
      {parts.map((part) => (
        <ReaderChapter
          key={part.heading}
          part={part}
          crossRefs={xrefs[part.heading] || {}}
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
