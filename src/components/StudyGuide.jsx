import { useEffect, useMemo, useState } from 'react';
import {
  COMPARE_TRANSLATIONS,
  commentariesForBook,
  fetchCommentaryChapter,
  fetchFactbook,
  fetchParallelVerses,
  fetchPerson,
  fetchPlace,
  fetchTranslationVerse,
  fetchVerseWordMap,
} from '../lib/studyData';
import { lookupStrongs, normalizeStrongs } from '../lib/strongs';

const TABS = [
  { id: 'guide', label: 'Guide' },
  { id: 'compare', label: 'Compare' },
  { id: 'words', label: 'Words' },
  { id: 'commentary', label: 'Commentary' },
];

function Status({ children, error = false }) {
  return <div className={`study-status${error ? ' error' : ''}`}>{children}</div>;
}

function FactbookTab({ book, chapter, focusVerse }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [detail, setDetail] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setData(null);
    setError(null);
    setDetail(null);
    fetchFactbook(book, chapter)
      .then((d) => {
        if (!cancelled) setData(d);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter]);

  const filterByVerse = (items) => {
    if (!focusVerse || !items?.length) return items || [];
    const matched = items.filter((i) => (i.verses || []).includes(focusVerse));
    return matched.length ? matched : items;
  };

  const openPerson = async (person) => {
    setDetail({ type: 'loading', name: person.name });
    try {
      const full = await fetchPerson(person.id);
      setDetail({ type: 'person', name: person.name, data: full.person || full });
    } catch {
      setDetail({ type: 'person', name: person.name, data: person });
    }
  };

  const openPlace = async (place) => {
    setDetail({ type: 'loading', name: place.name });
    try {
      const full = await fetchPlace(place.id);
      setDetail({ type: 'place', name: place.name, data: full.place || full });
    } catch {
      setDetail({ type: 'place', name: place.name, data: place });
    }
  };

  if (error) return <Status error>{error}</Status>;
  if (!data) return <Status>Loading passage guide…</Status>;

  const people = filterByVerse(data.people);
  const places = filterByVerse(data.places);
  const events = filterByVerse(data.events);

  if (detail?.type === 'loading') {
    return <Status>Loading {detail.name}…</Status>;
  }

  if (detail?.type === 'person') {
    const p = detail.data;
    return (
      <div className="study-detail">
        <button type="button" className="study-back" onClick={() => setDetail(null)}>
          ← Passage guide
        </button>
        <h4 className="study-detail-title">{p.name || detail.name}</h4>

        {(p.birthYear || p.deathYear || p.minYear || p.maxYear) && (
          <p className="study-detail-meta">
            {[
              (p.birthYear || p.minYear) && `b. ${p.birthYear || p.minYear}`,
              (p.deathYear || p.maxYear) && `d. ${p.deathYear || p.maxYear}`,
            ]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
        {(p.gender || p.sex) && <p className="study-detail-meta">{p.gender || p.sex}</p>}
        {(() => {
          const desc = Array.isArray(p.description) ? p.description.join(' ') : p.description;
          return desc ? (
            <p className="study-detail-body">{desc}</p>
          ) : (
            <p className="study-detail-body muted">
              Appears in this chapter
              {p.verses?.length ? ` (vv. ${p.verses.join(', ')})` : ''}.
            </p>
          );
        })()}
        {p.events?.length > 0 && (
          <p className="study-detail-meta">
            Events: {p.events.slice(0, 4).map((e) => e.name).join(', ')}
          </p>
        )}
      </div>
    );
  }

  if (detail?.type === 'place') {
    const p = detail.data;
    const lat = p.latitude ?? p.lat;
    const lng = p.longitude ?? p.lon ?? p.lng;
    const mapUrl =
      lat != null && lng != null
        ? `https://www.openstreetmap.org/?mlat=${lat}&mlon=${lng}#map=8/${lat}/${lng}`
        : null;
    return (
      <div className="study-detail">
        <button type="button" className="study-back" onClick={() => setDetail(null)}>
          ← Passage guide
        </button>
        <h4 className="study-detail-title">{p.name || detail.name}</h4>
        {(p.featureType || p.type) && (
          <p className="study-detail-meta">{p.featureType || p.type}</p>
        )}
        {p.aliases?.length > 0 && (
          <p className="study-detail-meta">Also known as: {p.aliases.slice(0, 6).join(', ')}</p>
        )}
        {(() => {
          const desc = Array.isArray(p.description) ? p.description.join(' ') : p.description;
          return desc ? <p className="study-detail-body">{desc}</p> : null;
        })()}
        {mapUrl && (
          <a className="study-map-link" href={mapUrl} target="_blank" rel="noreferrer">
            Open map
          </a>
        )}
      </div>
    );
  }

  return (
    <div className="study-guide-body">
      {focusVerse && (
        <p className="study-focus-hint">Showing items tied to verse {focusVerse} when available.</p>
      )}

      <section className="study-section">
        <h5 className="study-section-label">People</h5>
        {people.length === 0 ? (
          <p className="study-empty">No people tagged in this chapter.</p>
        ) : (
          <div className="study-chip-row">
            {people.map((p) => (
              <button key={p.id} type="button" className="study-chip" onClick={() => openPerson(p)}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="study-section">
        <h5 className="study-section-label">Places</h5>
        {places.length === 0 ? (
          <p className="study-empty">No places tagged in this chapter.</p>
        ) : (
          <div className="study-chip-row">
            {places.map((p) => (
              <button key={p.id} type="button" className="study-chip" onClick={() => openPlace(p)}>
                {p.name}
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="study-section">
        <h5 className="study-section-label">Events</h5>
        {events.length === 0 ? (
          <p className="study-empty">No events tagged in this chapter.</p>
        ) : (
          <ul className="study-event-list">
            {events.map((e) => (
              <li key={e.id || e.name}>
                <strong>{e.name || e.title}</strong>
                {e.verses?.length > 0 && <span className="muted"> · vv. {e.verses.join(', ')}</span>}
                {e.description && <p>{e.description}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="study-credit">Factbook · Theographic Bible Metadata (CC BY-SA)</p>
    </div>
  );
}

function CompareTab({ book, chapter, focusVerse, verseText }) {
  const verse = focusVerse || 1;
  const [rows, setRows] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setRows(null);
    setError(null);
    fetchParallelVerses(book, chapter, verse)
      .then((r) => {
        if (!cancelled) setRows(r);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Compare failed');
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verse]);

  if (error) return <Status error>{error}</Status>;
  if (!rows) return <Status>Loading translations…</Status>;

  const preview = verseText
    ? ` — “${verseText.slice(0, 80)}${verseText.length > 80 ? '…' : ''}”`
    : '';

  return (
    <div className="study-compare">
      <p className="study-focus-hint">
        {book} {chapter}:{verse}
        {preview}
      </p>
      {rows.map((r) => (
        <article key={r.id} className="study-compare-card">
          <header>
            <span className="study-compare-label">{r.label}</span>
            {r.error && <span className="study-compare-err">{r.error}</span>}
          </header>
          {r.text && <p>{r.text}</p>}
        </article>
      ))}
      <p className="study-credit">
        Parallel texts · {COMPARE_TRANSLATIONS.map((t) => t.label).join(', ')}
      </p>
    </div>
  );
}

function WordsTab({ book, chapter, focusVerse, verseText }) {
  const verse = focusVerse || 1;
  const [text, setText] = useState(verseText || '');
  const [words, setWords] = useState(null);
  const [error, setError] = useState(null);
  const [selected, setSelected] = useState(null);
  const [entry, setEntry] = useState(null);
  const [entryLoading, setEntryLoading] = useState(false);

  // Prefer the verse text from the reader; otherwise pull WEB for this verse.
  useEffect(() => {
    let cancelled = false;
    if (verseText) {
      setText(verseText);
      return undefined;
    }
    setText('');
    fetchTranslationVerse('ENGWEBP', book, chapter, verse)
      .then((t) => {
        if (!cancelled) setText(t || '');
      })
      .catch(() => {
        if (!cancelled) setText('');
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verse, verseText]);

  useEffect(() => {
    let cancelled = false;
    setWords(null);
    setSelected(null);
    setEntry(null);
    setError(null);
    if (!text) {
      setWords([]);
      return undefined;
    }
    fetchVerseWordMap(book, chapter, verse, text)
      .then((w) => {
        if (!cancelled) setWords(w);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Word map failed');
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, verse, text]);

  const openStrongs = async (id) => {
    const key = normalizeStrongs(id);
    setSelected(key);
    setEntryLoading(true);
    setEntry(null);
    try {
      const found = await lookupStrongs(key);
      setEntry(found || { id: key, definition: 'No lexicon entry found.' });
    } catch (e) {
      setEntry({ id: key, definition: e.message || 'Lookup failed' });
    } finally {
      setEntryLoading(false);
    }
  };

  if (error) return <Status error>{error}</Status>;
  if (!words) return <Status>Aligning Strong’s numbers…</Status>;
  if (!text) {
    return <Status>Couldn’t load verse text for word study.</Status>;
  }
  if (!words.length) {
    return <Status>No Strong’s alignment for this verse yet.</Status>;
  }

  return (
    <div className="study-words">
      <p className="study-focus-hint">
        {book} {chapter}:{verse} — tap a word
      </p>
      <div className="study-word-cloud">
        {words.map((w, i) => {
          const primary = w.strongs[0];
          const active = selected && w.strongs.includes(selected);
          return (
            <button
              key={`${w.start}-${i}`}
              type="button"
              className={`study-word${active ? ' active' : ''}${primary ? '' : ' muted'}`}
              disabled={!primary}
              onClick={() => primary && openStrongs(primary)}
              title={w.strongs.join(', ')}
            >
              {w.word}
            </button>
          );
        })}
      </div>

      {entryLoading && <Status>Loading lexicon…</Status>}
      {entry && !entryLoading && (
        <article className="study-strongs-card">
          <header>
            <span className="study-strongs-id">{entry.id}</span>
            {entry.lemma && <span className="study-strongs-lemma">{entry.lemma}</span>}
            {entry.translit && <span className="study-strongs-translit">{entry.translit}</span>}
          </header>
          {entry.pronunciation && <p className="study-detail-meta">{entry.pronunciation}</p>}
          {entry.definition && <p className="study-detail-body">{entry.definition}</p>}
          {entry.kjv && (
            <p className="study-detail-meta">
              <strong>KJV:</strong> {entry.kjv}
            </p>
          )}
          {entry.derivation && <p className="study-detail-meta">{entry.derivation}</p>}
          <p className="study-credit">Strong’s Exhaustive Concordance · Open Scriptures (CC BY-SA)</p>
        </article>
      )}
    </div>
  );
}

function CommentaryTab({ book, chapter, lastVerse, focusVerse }) {
  const options = useMemo(() => commentariesForBook(book), [book]);
  const [commentaryId, setCommentaryId] = useState(options[0]?.id || 'matthew-henry');
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    if (!options.find((o) => o.id === commentaryId)) {
      setCommentaryId(options[0]?.id || 'matthew-henry');
    }
  }, [options, commentaryId]);

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });
    fetchCommentaryChapter(commentaryId, book, chapter, lastVerse)
      .then((data) => {
        if (!cancelled) setState({ status: 'done', ...data });
      })
      .catch((err) => {
        if (!cancelled) {
          setState({ status: 'error', error: err.message || 'Failed to load commentary' });
        }
      });
    return () => {
      cancelled = true;
    };
  }, [commentaryId, book, chapter, lastVerse]);

  const meta = options.find((o) => o.id === commentaryId);

  let sections = state.status === 'done' ? state.sections : [];
  if (focusVerse && sections.length) {
    const focused = sections.filter((s) => focusVerse >= s.from && focusVerse <= s.to);
    if (focused.length) sections = focused;
  }

  return (
    <div className="study-commentary">
      <div className="study-commentary-picker" role="tablist" aria-label="Commentary">
        {options.map((o) => (
          <button
            key={o.id}
            type="button"
            role="tab"
            aria-selected={o.id === commentaryId}
            className={`study-pill${o.id === commentaryId ? ' active' : ''}`}
            onClick={() => setCommentaryId(o.id)}
          >
            {o.short}
          </button>
        ))}
      </div>

      {state.status === 'loading' && <Status>Loading {meta?.name || 'commentary'}…</Status>}
      {state.status === 'error' && <Status error>{state.error}</Status>}
      {state.status === 'done' && (
        <>
          {state.introduction && !focusVerse && (
            <section className="commentary-section">
              <h5 className="commentary-label">Introduction</h5>
              {state.introduction
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
                .map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
            </section>
          )}
          {sections.map((s) => (
            <section key={s.from} className="commentary-section">
              <h5 className="commentary-label">{s.label}</h5>
              {s.paragraphs.map((p, i) => (
                <p key={i}>{p}</p>
              ))}
            </section>
          ))}
          {!state.sections.length && !state.introduction && (
            <Status>No commentary for this chapter.</Status>
          )}
          <p className="study-credit">{meta?.name} · public domain</p>
        </>
      )}
    </div>
  );
}

/**
 * Logos-style Passage Guide: Factbook, parallel translations, Strong’s words,
 * and multiple public-domain commentaries — YouVersion look, Logos depth.
 */
export default function StudyGuide({
  book,
  chapter,
  lastVerse,
  focusVerse = null,
  verseText = '',
  initialTab = 'guide',
  onClose,
}) {
  const [tab, setTab] = useState(initialTab);

  useEffect(() => {
    setTab(initialTab);
  }, [initialTab, book, chapter, focusVerse]);

  return (
    <div className="study-guide">
      <div className="study-guide-head">
        <div>
          <h3 className="study-guide-title">Passage Guide</h3>
          <p className="study-guide-sub">
            {book} {chapter}
            {focusVerse ? `:${focusVerse}` : ''}
          </p>
        </div>
        {onClose && (
          <button type="button" className="study-guide-close" onClick={onClose} aria-label="Close study">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        )}
      </div>

      <div className="study-tabs" role="tablist" aria-label="Study tools">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={tab === t.id}
            className={`study-tab${tab === t.id ? ' active' : ''}`}
            onClick={() => setTab(t.id)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div className="study-guide-panel">
        {tab === 'guide' && <FactbookTab book={book} chapter={chapter} focusVerse={focusVerse} />}
        {tab === 'compare' && (
          <CompareTab book={book} chapter={chapter} focusVerse={focusVerse} verseText={verseText} />
        )}
        {tab === 'words' && (
          <WordsTab book={book} chapter={chapter} focusVerse={focusVerse} verseText={verseText} />
        )}
        {tab === 'commentary' && (
          <CommentaryTab
            book={book}
            chapter={chapter}
            lastVerse={lastVerse}
            focusVerse={focusVerse}
          />
        )}
      </div>
    </div>
  );
}
