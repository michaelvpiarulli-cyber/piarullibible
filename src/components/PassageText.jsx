import { useEffect, useState } from 'react';
import { colorValue, verseId } from '../hooks/useAnnotations';
import { useVerseAnnotations } from '../context/annotations';
import Commentary from './Commentary';

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

function ReaderChapter({ part, highlights, notes, onSelectVerse }) {
  const [showCommentary, setShowCommentary] = useState(false);

  return (
    <article className="reader-chapter">
      <h4 className="reader-chapter-title">
        {part.heading}
        <span className="reader-translation">{TRANSLATION_LABEL}</span>
      </h4>

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
              {hasNote && (
                <svg className="note-flag" viewBox="0 0 24 24" fill="currentColor" aria-label="Has note">
                  <path d="M12 20h9M16.5 3.5a2.1 2.1 0 0 1 3 3L7 19l-4 1 1-4Z" />
                </svg>
              )}{' '}
            </span>
          );
        })}
      </p>

      <div className="commentary-toggle-row">
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
