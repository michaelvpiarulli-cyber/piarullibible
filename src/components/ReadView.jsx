import { useCallback, useEffect, useMemo, useState } from 'react';
import { BOOKS } from '../data/books';
import { bollsBookId } from '../data/bookRefs';
import PassageText from './PassageText';
import LibraryPanel from './LibraryPanel';
import { useReaderPrefs } from '../hooks/useReaderPrefs';

const OT = BOOKS.slice(0, 39);
const NT = BOOKS.slice(39);

/** bolls book id → our book name, for mapping search hits back. */
const NAME_BY_ID = new Map(BOOKS.map((b) => [bollsBookId(b.name), b.name]));

const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/[⌃⌄]/g, '').trim();

export default function ReadView({ jumpTo, onFullscreenClose, isDone, toggle }) {
  const { translationLabel, setTranslationId } = useReaderPrefs();
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [focusVerse, setFocusVerse] = useState(null);
  const [readingChapters, setReadingChapters] = useState(null);
  const [readingLabel, setReadingLabel] = useState(null);
  const [readingId, setReadingId] = useState(null);
  const [startFullscreen, setStartFullscreen] = useState(false);
  const [mode, setMode] = useState('browse'); // browse | library
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (jumpTo?.book) return;
    try {
      const last = JSON.parse(localStorage.getItem('bible-plan-last-read') || 'null');
      if (last?.book) {
        setBook(last.book);
        setChapter(last.chapter);
      }
    } catch {
      /* ignore */
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps -- mount-only restore

  useEffect(() => {
    if (!jumpTo?.book || !jumpTo?.chapter) return;
    setBook(jumpTo.book);
    setChapter(jumpTo.chapter);
    setFocusVerse(jumpTo);
    setResults(null);
    setQuery('');
    setMode('browse');
    if (jumpTo.chapters?.length) setReadingChapters(jumpTo.chapters);
    else setReadingChapters(null);
    setReadingLabel(jumpTo.label || null);
    setReadingId(jumpTo.readingId || null);
    setStartFullscreen(Boolean(jumpTo.fullscreen));
  }, [jumpTo]);

  // Concordance / deep links from Passage Guide
  useEffect(() => {
    const onOpen = (e) => {
      const { book: b, chapter: c, verse } = e.detail || {};
      if (!b || !c) return;
      setMode('browse');
      setBook(b);
      setChapter(c);
      setFocusVerse(verse ? { book: b, chapter: c, verse } : { book: b, chapter: c });
      setReadingChapters(null);
      setReadingLabel(null);
      setReadingId(null);
      setStartFullscreen(true);
    };
    window.addEventListener('bible-open-passage', onOpen);
    return () => window.removeEventListener('bible-open-passage', onOpen);
  }, []);

  useEffect(() => {
    if (book && chapter) {
      localStorage.setItem('bible-plan-last-read', JSON.stringify({ book, chapter }));
    }
  }, [book, chapter]);

  const chapters = useMemo(() => {
    if (readingChapters?.length) return readingChapters;
    return book && chapter ? [{ book, chapter }] : null;
  }, [book, chapter, readingChapters]);

  const bookMeta = BOOKS.find((b) => b.name === book);
  const immersive = startFullscreen && Boolean(onFullscreenClose);

  const runSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;
    setSearching(true);
    setError(null);
    setResults(null);
    try {
      const r = await fetch(
        `https://bolls.life/v2/find/WEB?search=${encodeURIComponent(q)}&limit=60&page=1`
      );
      if (!r.ok) throw new Error('Search failed');
      const j = await r.json();
      const hits = (j.results || [])
        .filter((h) => NAME_BY_ID.has(h.book))
        .map((h) => ({
          book: NAME_BY_ID.get(h.book),
          chapter: h.chapter,
          verse: h.verse,
          text: clean(h.text),
        }));
      setResults({ total: j.total ?? hits.length, hits });
      setMode('browse');
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error — try again.' : err.message);
    }
    setSearching(false);
  };

  const openAt = (b, c) => {
    setBook(b);
    setChapter(c);
    setReadingChapters(null);
    setReadingLabel(null);
    setReadingId(null);
    setStartFullscreen(false);
    setResults(null);
    setQuery('');
    setMode('browse');
  };

  const handleFullscreenClose = () => {
    setStartFullscreen(false);
    setReadingChapters(null);
    setReadingLabel(null);
    setReadingId(null);
    onFullscreenClose?.();
  };

  const handleToggleReading = useCallback(
    (id) => {
      if (id && toggle) toggle(id);
    },
    [toggle]
  );

  if (book && chapter && chapters) {
    return (
      <div className={`read-view${immersive ? ' read-immersive' : ''}`}>
        {!immersive && (
          <div className="read-bar">
            <button type="button" className="pager-btn" onClick={() => setChapter(null)}>
              ← {book}
            </button>
            <span className="read-where">
              {readingLabel || `${book} ${chapter}`} · {translationLabel}
            </span>
            <button
              type="button"
              className="pager-btn"
              onClick={() => {
                setBook(null);
                setChapter(null);
                setReadingChapters(null);
                setReadingLabel(null);
                setReadingId(null);
              }}
            >
              All books
            </button>
          </div>
        )}

        <div className="read-flow">
          <PassageText
            chapters={chapters}
            focusVerse={
              focusVerse?.book === book && focusVerse?.chapter === chapter ? focusVerse : null
            }
            startFullscreen={immersive}
            onFullscreenClose={immersive ? handleFullscreenClose : undefined}
            title={readingLabel}
            readingId={readingId}
            readingDone={readingId ? Boolean(isDone?.(readingId)) : false}
            onToggleReading={readingId ? handleToggleReading : null}
          />
        </div>

        {!immersive && !readingChapters && (
          <div className="day-pager">
            <button
              type="button"
              className="pager-btn"
              disabled={chapter <= 1}
              onClick={() => setChapter(chapter - 1)}
            >
              ← Previous
            </button>
            <button
              type="button"
              className="pager-btn"
              disabled={chapter >= (bookMeta?.chapters || 1)}
              onClick={() => setChapter(chapter + 1)}
            >
              Next →
            </button>
          </div>
        )}
      </div>
    );
  }

  if (book) {
    return (
      <div className="read-view">
        <div className="read-bar">
          <button type="button" className="pager-btn" onClick={() => setBook(null)}>
            ← All books
          </button>
          <span className="read-where">{book}</span>
          <span />
        </div>
        <div className="chapter-grid">
          {Array.from({ length: bookMeta?.chapters || 0 }, (_, i) => i + 1).map((c) => (
            <button key={c} type="button" className="chapter-chip" onClick={() => setChapter(c)}>
              {c}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="read-view">
      <div className="read-mode-row">
        <button
          type="button"
          className={`chip${mode === 'browse' ? ' active' : ''}`}
          onClick={() => setMode('browse')}
        >
          Books
        </button>
        <button
          type="button"
          className={`chip${mode === 'library' ? ' active' : ''}`}
          onClick={() => setMode('library')}
        >
          Library
        </button>
      </div>

      {mode === 'library' ? (
        <LibraryPanel
          onSelectTranslation={setTranslationId}
          onOpenRead={() => setMode('browse')}
          onOpenStudy={() => {
            // Open Genesis 1 with study — Logos “open resource” feel.
            setBook('Genesis');
            setChapter(1);
            setStartFullscreen(false);
          }}
        />
      ) : (
        <>
          <form className="read-search" onSubmit={runSearch}>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search Scripture — e.g. fear not"
              enterKeyHint="search"
              autoCapitalize="none"
              autoCorrect="off"
            />
            <button
              type="submit"
              className="btn-primary"
              disabled={searching || query.trim().length < 2}
            >
              {searching ? 'Searching…' : 'Search'}
            </button>
          </form>
          {error && <span className="account-error">{error}</span>}

          {results && (
            <div className="search-results">
              <div className="results-head">
                <span className="section-title">
                  {results.hits.length} of {results.total} result{results.total === 1 ? '' : 's'}
                </span>
                <button type="button" className="btn-text" onClick={() => setResults(null)}>
                  Clear
                </button>
              </div>
              {results.hits.length === 0 ? (
                <div className="empty-state">
                  <p className="empty-title">No matches</p>
                  <p className="empty-sub">Nothing in the 66 books matched that search.</p>
                </div>
              ) : (
                <ul className="result-list">
                  {results.hits.map((h) => (
                    <li key={`${h.book}-${h.chapter}-${h.verse}`}>
                      <button
                        type="button"
                        className="result-row"
                        onClick={() => openAt(h.book, h.chapter)}
                      >
                        <span className="result-ref">
                          {h.book} {h.chapter}:{h.verse}
                        </span>
                        <span className="result-text">{h.text}</span>
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          )}

          {!results && (
            <>
              <h3 className="section-title">Old Testament</h3>
              <div className="book-grid">
                {OT.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    className="book-chip"
                    onClick={() => setBook(b.name)}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
              <h3 className="section-title">New Testament</h3>
              <div className="book-grid">
                {NT.map((b) => (
                  <button
                    key={b.name}
                    type="button"
                    className="book-chip"
                    onClick={() => setBook(b.name)}
                  >
                    {b.name}
                  </button>
                ))}
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}
