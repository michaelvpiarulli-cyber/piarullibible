import { useEffect, useState } from 'react';
import { COMPARE_TRANSLATIONS, fetchTranslationChapter } from '../lib/studyData';

/**
 * Logos-style continuous parallel pane for one translation beside WEB.
 */
export default function ParallelPane({ book, chapter, translationId = 'BSB', focusVerse = null }) {
  const [part, setPart] = useState(null);
  const [error, setError] = useState(null);
  const [id, setId] = useState(translationId);

  useEffect(() => {
    let cancelled = false;
    setPart(null);
    setError(null);
    fetchTranslationChapter(id, book, chapter)
      .then((p) => {
        if (!cancelled) setPart(p);
      })
      .catch((e) => {
        if (!cancelled) setError(e.message || 'Failed to load');
      });
    return () => {
      cancelled = true;
    };
  }, [book, chapter, id]);

  useEffect(() => {
    if (!focusVerse || !part) return;
    const el = document.getElementById(`para-v-${id}-${focusVerse}`);
    el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [focusVerse, part, id]);

  const label = COMPARE_TRANSLATIONS.find((t) => t.id === id)?.label || id;

  return (
    <aside className="parallel-pane">
      <div className="parallel-pane-bar">
        <label className="parallel-picker">
          <span className="sr-only">Parallel translation</span>
          <select value={id} onChange={(e) => setId(e.target.value)}>
            {COMPARE_TRANSLATIONS.filter((t) => t.id !== 'ENGWEBP').map((t) => (
              <option key={t.id} value={t.id}>
                {t.label}
              </option>
            ))}
          </select>
        </label>
        <span className="parallel-pane-ref">
          {book} {chapter} · {label}
        </span>
      </div>

      {error && <p className="parallel-status error">{error}</p>}
      {!part && !error && <p className="parallel-status">Loading {label}…</p>}

      {part && (
        <div className="parallel-verses">
          {part.verses.map((v) => (
            <p
              key={v.number}
              id={`para-v-${id}-${v.number}`}
              className={`parallel-verse${focusVerse === v.number ? ' focused' : ''}`}
            >
              <sup className="parallel-verse-num">{v.number}</sup>
              {v.text}
            </p>
          ))}
        </div>
      )}
    </aside>
  );
}
