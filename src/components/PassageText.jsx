import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { colorValue, verseId } from '../hooks/useAnnotations';
import { useVerseAnnotations } from '../context/annotations';
import { BOOK_BY_CODE, HELLOAO_CODES, formatRef } from '../data/bookRefs';
import StudyGuide from './StudyGuide';
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

/** Fetch a chapter (WEB) — shared with the reading quiz so both hit the same cache. */
export async function fetchChapter(book, chapter) {
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

function ReaderChapter({ part, crossRefs, highlights, notes, onSelectVerse, embedded = false }) {
  const [showGuide, setShowGuide] = useState(false);
  const [guideFocus, setGuideFocus] = useState(null); // { verse, text, tab }
  const [showNotes, setShowNotes] = useState(false);
  const [drawing, setDrawing] = useState(false);
  const [studyOpen, setStudyOpen] = useState(false);
  const [tool, setTool] = useState({ mode: 'pen', color: '#121212', width: 0.006 });
  const drawApi = useRef(null);
  const studyDrawApi = useRef(null);
  const registerApi = useCallback((api) => {
    drawApi.current = api;
  }, []);
  const registerStudyApi = useCallback((api) => {
    studyDrawApi.current = api;
  }, []);

  // Verse sheet (or elsewhere) can ask this chapter to open the Logos-style guide.
  useEffect(() => {
    const onStudy = (e) => {
      const { book, chapter, verse, text, tab } = e.detail || {};
      if (book !== part.book || Number(chapter) !== Number(part.chapter)) return;
      setGuideFocus({
        verse: verse ? Number(verse) : null,
        text: text || '',
        tab: tab || (verse ? 'words' : 'guide'),
      });
      setShowGuide(true);
    };
    window.addEventListener('bible-study', onStudy);
    return () => window.removeEventListener('bible-study', onStudy);
  }, [part.book, part.chapter]);

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

  const openStudy = () => {
    setStudyOpen(true);
    setDrawing(false);
  };

  const closeStudy = useCallback(() => {
    setStudyOpen(false);
  }, []);

  useEffect(() => {
    if (!studyOpen) return;
    document.documentElement.classList.add('study-expanded');
    const onKey = (e) => {
      if (e.key === 'Escape') closeStudy();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.classList.remove('study-expanded');
      window.removeEventListener('keydown', onKey);
    };
  }, [studyOpen, closeStudy]);

  const renderVerses = (idPrefix = '') =>
    part.verses.map((v) => {
      const id = verseId(part.book, part.chapter, v.number);
      const color = colorValue(highlights[id]);
      const hasNote = Boolean(notes[id]);
      const refs = crossRefs[v.number] || [];
      const domId = `v-${idPrefix}${part.book.replace(/\s+/g, '-')}-${part.chapter}-${v.number}`;
      return (
        <span
          key={`${idPrefix}${v.number}`}
          id={domId}
          data-verse={`${part.book}|${part.chapter}|${v.number}`}
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
    });

  const inkBar = (apiRef) =>
    drawing && (
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
                onClick={() =>
                  setTool((t) => ({
                    ...t,
                    color: c.value,
                    mode: t.mode === 'erase' ? 'pen' : t.mode,
                  }))
                }
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
            <button type="button" className="ink-tool" onClick={() => apiRef.current?.undo()}>
              Undo
            </button>
          </div>
        </div>
      </>
    );

  return (
    <article className={`reader-chapter${embedded ? ' embedded' : ''}`}>
      <div className="reader-chapter-head">
        <h4 className="reader-chapter-title">
          {part.heading}
          <span className="reader-translation">{TRANSLATION_LABEL}</span>
        </h4>
        {!embedded && (
          <button
            type="button"
            className="study-expand-corner"
            onClick={openStudy}
            aria-label="Expand chapter for study notes"
            title="Expand"
          >
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M8 3H5a2 2 0 0 0-2 2v3M16 3h3a2 2 0 0 1 2 2v3M8 21H5a2 2 0 0 1-2-2v-3M16 21h3a2 2 0 0 0 2-2v-3" />
            </svg>
          </button>
        )}
      </div>

      <div className={`chapter-page${drawing && !studyOpen ? ' drawing' : ''}`}>
        <div className="reader-ink-layer">
          <p className="reader-body">{renderVerses(embedded ? 'immersive-' : '')}</p>
          {!studyOpen && (
            <DrawCanvas
              chapterKey={part.heading}
              active={drawing}
              tool={tool}
              registerApi={registerApi}
            />
          )}
        </div>
      </div>

      {!studyOpen && inkBar(drawApi)}

      <div className="commentary-toggle-row">
        <button
          type="button"
          className={`commentary-toggle${drawing ? ' active' : ''}`}
          onClick={() => setDrawing(!drawing)}
          aria-expanded={drawing}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
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
            <svg
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.7"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
            {showNotes ? 'Hide notes' : `Notes (${chapterNotes.length})`}
          </button>
        )}

        <button
          type="button"
          className={`commentary-toggle${showGuide ? ' active' : ''}`}
          onClick={() => {
            if (showGuide) {
              setShowGuide(false);
              setGuideFocus(null);
            } else {
              setGuideFocus(null);
              setShowGuide(true);
            }
          }}
          aria-expanded={showGuide}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-1.5Z" />
            <path d="M8 7h7M8 11h7" />
          </svg>
          {showGuide ? 'Hide study' : 'Study'}
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

      {showGuide && (
        <StudyGuide
          book={part.book}
          chapter={part.chapter}
          lastVerse={part.verses[part.verses.length - 1]?.number ?? part.verses.length}
          focusVerse={guideFocus?.verse || null}
          verseText={guideFocus?.text || ''}
          initialTab={guideFocus?.tab || 'guide'}
          onClose={() => {
            setShowGuide(false);
            setGuideFocus(null);
          }}
        />
      )}

      {!embedded &&
        studyOpen &&
        createPortal(
          <div className="study-overlay" role="dialog" aria-modal="true" aria-label={`${part.heading} study`}>
            <header className="study-overlay-bar">
              <div className="study-overlay-heading">
                <h2>
                  {part.heading}
                  <span className="reader-translation">{TRANSLATION_LABEL}</span>
                </h2>
              </div>

              <div className="study-overlay-toolbar">
                {drawing && (
                  <div className="ink-bar study-ink-bar">
                    <div className="ink-group">
                      {INK_COLORS.map((c) => (
                        <button
                          key={c.id}
                          type="button"
                          className={`ink-swatch${tool.color === c.value && tool.mode !== 'erase' ? ' active' : ''}`}
                          style={{ background: c.value }}
                          aria-label={c.label}
                          onClick={() =>
                            setTool((t) => ({
                              ...t,
                              color: c.value,
                              mode: t.mode === 'erase' ? 'pen' : t.mode,
                            }))
                          }
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
                      <button type="button" className="ink-tool" onClick={() => studyDrawApi.current?.undo()}>
                        Undo
                      </button>
                    </div>
                  </div>
                )}

                <div className="study-overlay-actions">
                  <button
                    type="button"
                    className={`commentary-toggle${drawing ? ' active' : ''}`}
                    onClick={() => setDrawing(!drawing)}
                  >
                    {drawing ? 'Done drawing' : 'Draw'}
                  </button>
                  <button type="button" className="btn-secondary" onClick={closeStudy}>
                    Close
                  </button>
                </div>
              </div>
            </header>

            <div className={`study-overlay-body${drawing ? ' is-inking' : ''}`}>
              <div className={`chapter-page study-page${drawing ? ' drawing' : ''}`}>
                <div className="reader-ink-layer">
                  <p className="reader-body">{renderVerses('study-')}</p>
                  <DrawCanvas
                    chapterKey={part.heading}
                    active={drawing}
                    tool={tool}
                    registerApi={registerStudyApi}
                  />
                </div>
              </div>
            </div>
          </div>,
          document.body
        )}
    </article>
  );
}

export default function PassageText({
  chapters,
  focusVerse,
  startFullscreen = false,
  onFullscreenClose,
  title,
}) {
  const { highlights, notes, onSelectVerse } = useVerseAnnotations();
  const [parts, setParts] = useState([]);
  const [xrefs, setXrefs] = useState({});
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [immersive, setImmersive] = useState(Boolean(startFullscreen));

  useEffect(() => {
    if (startFullscreen) setImmersive(true);
  }, [startFullscreen, chapters]);

  const closeImmersive = useCallback(() => {
    setImmersive(false);
    onFullscreenClose?.();
  }, [onFullscreenClose]);

  useEffect(() => {
    if (!immersive) return;
    document.documentElement.classList.add('study-expanded');
    const onKey = (e) => {
      if (e.key === 'Escape') closeImmersive();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      document.documentElement.classList.remove('study-expanded');
      window.removeEventListener('keydown', onKey);
    };
  }, [immersive, closeImmersive]);

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
    const bookSlug = focusVerse.book.replace(/\s+/g, '-');
    const candidates = immersive
      ? [`v-immersive-${bookSlug}-${focusVerse.chapter}-${focusVerse.verse}`]
      : [`v-${bookSlug}-${focusVerse.chapter}-${focusVerse.verse}`];
    const el = candidates.map((id) => document.getElementById(id)).find(Boolean);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('verse-flash');
      const t = setTimeout(() => el.classList.remove('verse-flash'), 1600);
      return () => clearTimeout(t);
    }
  }, [focusVerse, parts, loading, immersive]);

  const heading = title || parts[0]?.heading || 'Bible';
  const status = (
    <>
      {loading && !error && (
        <div className="passage-status loading">
          Loading {parts.length ? `${parts.length + 1} of ${chapters.length}` : ''}…
        </div>
      )}
      {error && <div className="passage-status passage-error">{error}</div>}
    </>
  );

  const chapterNodes = (embedded) =>
    parts.map((part) => (
      <ReaderChapter
        key={`${embedded ? 'fs-' : ''}${part.heading}`}
        part={part}
        crossRefs={xrefs[part.heading] || {}}
        highlights={highlights}
        notes={notes}
        onSelectVerse={onSelectVerse}
        embedded={embedded}
      />
    ));

  return (
    <div className="reader">
      {!immersive && (
        <>
          {chapterNodes(false)}
          {status}
        </>
      )}

      {immersive &&
        createPortal(
          <div
            className="study-overlay reading-immersive"
            role="dialog"
            aria-modal="true"
            aria-label={heading}
          >
            <header className="study-overlay-bar">
              <div className="study-overlay-heading">
                <h2>
                  {heading}
                  <span className="reader-translation">{TRANSLATION_LABEL}</span>
                </h2>
              </div>
              <div className="study-overlay-actions">
                <button type="button" className="btn-secondary" onClick={closeImmersive}>
                  Back
                </button>
              </div>
            </header>
            <div className="study-overlay-body">
              <div className="reader immersive-reader">
                {chapterNodes(true)}
                {status}
              </div>
            </div>
          </div>,
          document.body
        )}
    </div>
  );
}
