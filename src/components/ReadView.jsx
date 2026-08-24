import { useEffect, useMemo, useState } from 'react';
import { BOOKS } from '../data/books';
import { bollsBookId, parsePassage } from '../data/bookRefs';
import PassageText, { TRANSLATION_LABEL } from './PassageText';
import { useReaderPrefs } from '../hooks/useReaderPrefs';

const OT = BOOKS.slice(0, 39);
const NT = BOOKS.slice(39);

/** bolls book id → our book name, for mapping search hits back. */
const NAME_BY_ID = new Map(BOOKS.map((b) => [bollsBookId(b.name), b.name]));

const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/[⌃⌄]/g, '').trim();

/** Next / previous chapter across book boundaries. */
function neighborChapter(book, chapter, dir) {
  const idx = BOOKS.findIndex((b) => b.name === book);
  if (idx < 0) return null;
  const meta = BOOKS[idx];
  const next = chapter + dir;
  if (next >= 1 && next <= meta.chapters) return { book, chapter: next };
  if (dir > 0 && idx < BOOKS.length - 1) return { book: BOOKS[idx + 1].name, chapter: 1 };
  if (dir < 0 && idx > 0) {
    const prev = BOOKS[idx - 1];
    return { book: prev.name, chapter: prev.chapters };
  }
  return null;
}

function FontControls({ canShrink, canGrow, bumpFont }) {
  return (
    <div className="font-controls" role="group" aria-label="Text size">
      <button
        type="button"
        className="font-btn"
        disabled={!canShrink}
        onClick={() => bumpFont(-1)}
        aria-label="Smaller text"
      >
        A−
      </button>
      <button
        type="button"
        className="font-btn"
        disabled={!canGrow}
        onClick={() => bumpFont(1)}
        aria-label="Larger text"
      >
        A+
      </button>
    </div>
  );
}

export default function ReadView({ jumpTo }) {
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [focusVerse, setFocusVerse] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);
  const [testament, setTestament] = useState('all'); // all | ot | nt
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerBook, setPickerBook] = useState(null);
  const { fontSize, canShrink, canGrow, bumpFont } = useReaderPrefs();

  // Remember where you were so the tab doesn't reset every visit.
  // Skip restore when a cross-ref jump is already waiting — jump wins.
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

  // Cross-ref (or other) jumps land here — open the chapter and scroll to the verse.
  useEffect(() => {
    if (!jumpTo?.book || !jumpTo?.chapter) return;
    setBook(jumpTo.book);
    setChapter(jumpTo.chapter);
    setFocusVerse(jumpTo);
    setResults(null);
    setQuery('');
    setPickerOpen(false);
  }, [jumpTo]);

  useEffect(() => {
    if (book && chapter) {
      localStorage.setItem('bible-plan-last-read', JSON.stringify({ book, chapter }));
    }
  }, [book, chapter]);

  // Mark immersive reading mode for chrome (hide top bar on phones).
  useEffect(() => {
    const reading = Boolean(book && chapter);
    document.documentElement.classList.toggle('reading-mode', reading);
    return () => document.documentElement.classList.remove('reading-mode');
  }, [book, chapter]);

  useEffect(() => {
    if (!pickerOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape') setPickerOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [pickerOpen]);

  const chapters = useMemo(
    () => (book && chapter ? [{ book, chapter }] : null),
    [book, chapter]
  );

  const bookMeta = BOOKS.find((b) => b.name === book);
  const prev = book && chapter ? neighborChapter(book, chapter, -1) : null;
  const next = book && chapter ? neighborChapter(book, chapter, 1) : null;

  const [lastRead, setLastRead] = useState(null);

  useEffect(() => {
    try {
      setLastRead(JSON.parse(localStorage.getItem('bible-plan-last-read') || 'null'));
    } catch {
      setLastRead(null);
    }
  }, [book, chapter]);

  const filteredBooks = useMemo(() => {
    if (testament === 'ot') return OT;
    if (testament === 'nt') return NT;
    return BOOKS;
  }, [testament]);

  const openAt = (b, c, verse) => {
    setBook(b);
    setChapter(c);
    setFocusVerse(verse ? { book: b, chapter: c, verse } : null);
    setResults(null);
    setQuery('');
    setPickerOpen(false);
    setPickerBook(null);
  };

  const openPicker = () => {
    setPickerBook(book);
    setPickerOpen(true);
  };

  const runSearch = async (e) => {
    e.preventDefault();
    const q = query.trim();
    if (q.length < 2) return;

    // Reference shortcut: "John 3:16" / "1 John 4" jumps straight there.
    const parsed = parsePassage(q);
    if (parsed?.book && parsed?.chapter) {
      const meta = BOOKS.find((b) => b.name === parsed.book);
      if (meta && parsed.chapter >= 1 && parsed.chapter <= meta.chapters) {
        openAt(parsed.book, parsed.chapter, parsed.verse);
        return;
      }
    }

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
        .filter((h) => NAME_BY_ID.has(h.book)) // 66-book canon only
        .map((h) => ({
          book: NAME_BY_ID.get(h.book),
          chapter: h.chapter,
          verse: h.verse,
          text: clean(h.text),
        }));
      setResults({ total: j.total ?? hits.length, hits });
    } catch (err) {
      setError(err.message === 'Failed to fetch' ? 'Network error — try again.' : err.message);
    }
    setSearching(false);
  };

  const pickerMeta = BOOKS.find((b) => b.name === pickerBook);

  // --- book / chapter picker sheet ------------------------------------------
  const picker = pickerOpen && (
    <>
      <div className="sheet-scrim" onClick={() => setPickerOpen(false)} />
      <div className="picker-sheet" role="dialog" aria-label="Choose passage">
        <div className="sheet-grabber" />
        <div className="picker-head">
          <h2>{pickerBook ? pickerBook : 'Books'}</h2>
          {pickerBook ? (
            <button type="button" className="btn-text" onClick={() => setPickerBook(null)}>
              All books
            </button>
          ) : (
            <button type="button" className="sheet-close" onClick={() => setPickerOpen(false)} aria-label="Close">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>

        {!pickerBook ? (
          <>
            <div className="filter-row section-switch picker-testaments">
              {[
                { id: 'all', label: 'All' },
                { id: 'ot', label: 'Old' },
                { id: 'nt', label: 'New' },
              ].map((t) => (
                <button
                  key={t.id}
                  type="button"
                  className={`chip${testament === t.id ? ' active' : ''}`}
                  onClick={() => setTestament(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
            <div className="book-grid picker-books">
              {filteredBooks.map((b) => (
                <button
                  key={b.name}
                  type="button"
                  className={`book-chip${b.name === book ? ' current' : ''}`}
                  onClick={() => setPickerBook(b.name)}
                >
                  {b.name}
                </button>
              ))}
            </div>
          </>
        ) : (
          <div className="chapter-grid">
            {Array.from({ length: pickerMeta?.chapters || 0 }, (_, i) => i + 1).map((c) => (
              <button
                key={c}
                type="button"
                className={`chapter-chip${pickerBook === book && c === chapter ? ' current' : ''}`}
                onClick={() => openAt(pickerBook, c)}
              >
                {c}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  );

  // --- reading a chapter ----------------------------------------------------
  if (book && chapter) {
    return (
      <div className="read-view reading">
        <div className="reader-chrome">
          <button
            type="button"
            className="reader-chrome-icon"
            onClick={() => {
              setBook(null);
              setChapter(null);
            }}
            aria-label="Bible library"
            title="Library"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M4 19.5V5a2 2 0 0 1 2-2h13v18H6a2 2 0 0 1-2-1.5Z" />
              <path d="M8 7h7M8 11h5" />
            </svg>
          </button>

          <button type="button" className="reader-chrome-btn" onClick={openPicker} aria-label="Change book or chapter">
            <span className="reader-chrome-ref">
              {book} {chapter}
            </span>
            <span className="reader-chrome-meta">{TRANSLATION_LABEL}</span>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="m6 9 6 6 6-6" />
            </svg>
          </button>

          <FontControls canShrink={canShrink} canGrow={canGrow} bumpFont={bumpFont} />
        </div>

        <div className="read-flow" style={{ '--reader-size': `${fontSize}px` }}>
          <PassageText
            chapters={chapters}
            focusVerse={
              focusVerse?.book === book && focusVerse?.chapter === chapter ? focusVerse : null
            }
            fontSize={fontSize}
            compactHead
          />
        </div>

        <div className="day-pager reader-pager">
          <button
            type="button"
            className="pager-btn"
            disabled={!prev}
            onClick={() => prev && openAt(prev.book, prev.chapter)}
          >
            ← {prev ? (prev.book === book ? `Ch ${prev.chapter}` : prev.book) : 'Start'}
          </button>
          <button
            type="button"
            className="pager-btn"
            disabled={!next}
            onClick={() => next && openAt(next.book, next.chapter)}
          >
            {next ? (next.book === book ? `Ch ${next.chapter}` : next.book) : 'End'} →
          </button>
        </div>

        {picker}
      </div>
    );
  }

  // --- choosing a chapter (inline, before picker sheet exists) ---------------
  if (book) {
    return (
      <div className="read-view">
        <div className="read-bar">
          <button type="button" className="pager-btn" onClick={() => setBook(null)}>
            ← Books
          </button>
          <span className="read-where">{book}</span>
          <FontControls canShrink={canShrink} canGrow={canGrow} bumpFont={bumpFont} />
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

  // --- browsing / searching -------------------------------------------------
  return (
    <div className="read-view">
      <form className="bible-search" onSubmit={runSearch}>
        <input
          type="search"
          enterKeyHint="search"
          autoCapitalize="none"
          autoCorrect="off"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="John 3:16 or search words…"
          aria-label="Search or go to reference"
        />
        <button type="submit" className="btn-primary" disabled={searching || query.trim().length < 2}>
          {searching ? '…' : 'Go'}
        </button>
      </form>
      {error && <span className="account-error">{error}</span>}

      {lastRead?.book && !results && (
        <button
          type="button"
          className="continue-card"
          onClick={() => openAt(lastRead.book, lastRead.chapter)}
        >
          <span>
            <span className="continue-label">Continue</span>
            <span className="continue-ref">
              {lastRead.book} {lastRead.chapter}
            </span>
          </span>
        </button>
      )}

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
            <p className="empty-sub">No matches in the 66 books.</p>
          ) : (
            <ul className="result-list">
              {results.hits.map((h) => (
                <li key={`${h.book}-${h.chapter}-${h.verse}`}>
                  <button
                    type="button"
                    className="result-row"
                    onClick={() => openAt(h.book, h.chapter, h.verse)}
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
          <div className="filter-row section-switch picker-testaments">
            {[
              { id: 'all', label: 'All' },
              { id: 'ot', label: 'Old Testament' },
              { id: 'nt', label: 'New Testament' },
            ].map((t) => (
              <button
                key={t.id}
                type="button"
                className={`chip${testament === t.id ? ' active' : ''}`}
                onClick={() => setTestament(t.id)}
              >
                {t.label}
              </button>
            ))}
          </div>

          {(testament === 'all' || testament === 'ot') && (
            <>
              <h3 className="section-title">Old Testament</h3>
              <div className="book-grid">
                {OT.map((b) => (
                  <button key={b.name} type="button" className="book-chip" onClick={() => setBook(b.name)}>
                    {b.name}
                  </button>
                ))}
              </div>
            </>
          )}

          {(testament === 'all' || testament === 'nt') && (
            <>
              <h3 className="section-title">New Testament</h3>
              <div className="book-grid">
                {NT.map((b) => (
                  <button key={b.name} type="button" className="book-chip" onClick={() => setBook(b.name)}>
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
