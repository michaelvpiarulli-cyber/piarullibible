import { useEffect, useMemo, useState } from 'react';
import { BOOKS } from '../data/books';
import { bollsBookId } from '../data/bookRefs';
import PassageText, { TRANSLATION_LABEL } from './PassageText';

const OT = BOOKS.slice(0, 39);
const NT = BOOKS.slice(39);

/** bolls book id → our book name, for mapping search hits back. */
const NAME_BY_ID = new Map(BOOKS.map((b) => [bollsBookId(b.name), b.name]));

const clean = (s) => (s || '').replace(/<[^>]+>/g, '').replace(/[⌃⌄]/g, '').trim();

export default function ReadView() {
  const [book, setBook] = useState(null);
  const [chapter, setChapter] = useState(null);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [searching, setSearching] = useState(false);
  const [error, setError] = useState(null);

  // Remember where you were so the tab doesn't reset every visit.
  useEffect(() => {
    try {
      const last = JSON.parse(localStorage.getItem('bible-plan-last-read') || 'null');
      if (last?.book) {
        setBook(last.book);
        setChapter(last.chapter);
      }
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    if (book && chapter) {
      localStorage.setItem('bible-plan-last-read', JSON.stringify({ book, chapter }));
    }
  }, [book, chapter]);

  const chapters = useMemo(
    () => (book && chapter ? [{ book, chapter }] : null),
    [book, chapter]
  );

  const bookMeta = BOOKS.find((b) => b.name === book);

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

  const openAt = (b, c) => {
    setBook(b);
    setChapter(c);
    setResults(null);
    setQuery('');
  };

  // --- reading a chapter ----------------------------------------------------
  if (book && chapter) {
    return (
      <div className="read-view">
        <div className="read-bar">
          <button type="button" className="pager-btn" onClick={() => setChapter(null)}>
            ← {book}
          </button>
          <span className="read-where">
            {book} {chapter} · {TRANSLATION_LABEL}
          </span>
          <button
            type="button"
            className="pager-btn"
            onClick={() => {
              setBook(null);
              setChapter(null);
            }}
          >
            All books
          </button>
        </div>

        <div className="read-flow">
          <PassageText chapters={chapters} />
        </div>

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
      </div>
    );
  }

  // --- choosing a chapter ---------------------------------------------------
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

  // --- browsing / searching -------------------------------------------------
  return (
    <div className="read-view">
      <form className="memorize-add" onSubmit={runSearch}>
        <input
          type="search"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the Bible — e.g. fear not"
        />
        <button type="submit" className="btn-primary" disabled={searching || query.trim().length < 2}>
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
            <p className="empty-sub">No matches in the 66 books.</p>
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
              <button key={b.name} type="button" className="book-chip" onClick={() => setBook(b.name)}>
                {b.name}
              </button>
            ))}
          </div>

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
    </div>
  );
}
