import { useEffect, useState } from 'react';
import { HELLOAO_CODES } from '../data/bookRefs';

const COMMENTARY_ID = 'matthew-henry';
const cache = new Map();

/**
 * Matthew Henry comments on passages, not single verses: each block's `number`
 * is the verse the section starts at, and it runs until the next block begins.
 */
function toSections(chapter, lastVerse) {
  const blocks = (chapter.content || []).filter((b) => b.type === 'verse');

  return blocks.map((block, i) => {
    const from = block.number;
    const next = blocks[i + 1];
    const to = next ? next.number - 1 : lastVerse;
    return {
      from,
      to,
      label: to > from ? `Verses ${from}–${to}` : `Verse ${from}`,
      paragraphs: (block.content || [])
        .flatMap((c) => String(c).split('\n'))
        .map((s) => s.trim())
        .filter(Boolean),
    };
  });
}

async function fetchCommentary(book, chapter, lastVerse) {
  const code = HELLOAO_CODES[book];
  if (!code) throw new Error(`No commentary for ${book}`);

  const cacheKey = `${code}|${chapter}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const res = await fetch(`https://bible.helloao.org/api/c/${COMMENTARY_ID}/${code}/${chapter}.json`);
  if (!res.ok) throw new Error(`Couldn't load commentary (${res.status})`);

  // Books the commentary doesn't cover (e.g. Song of Solomon) come back as an
  // HTML fallback page with a 200, not a 404 — so trust the content type.
  if (!(res.headers.get('content-type') || '').includes('json')) {
    throw new Error(`Matthew Henry’s commentary doesn’t cover ${book}.`);
  }

  const data = await res.json();
  const result = {
    introduction: data.chapter?.introduction || null,
    sections: toSections(data.chapter || {}, lastVerse),
  };
  cache.set(cacheKey, result);
  return result;
}

export default function Commentary({ book, chapter, lastVerse }) {
  const [state, setState] = useState({ status: 'loading' });

  useEffect(() => {
    let cancelled = false;
    setState({ status: 'loading' });

    fetchCommentary(book, chapter, lastVerse)
      .then((data) => !cancelled && setState({ status: 'done', ...data }))
      .catch((err) => !cancelled && setState({ status: 'error', error: err.message }));

    return () => {
      cancelled = true;
    };
  }, [book, chapter, lastVerse]);

  if (state.status === 'loading') {
    return <div className="commentary-status">Loading commentary…</div>;
  }

  if (state.status === 'error') {
    return <div className="commentary-status">{state.error}</div>;
  }

  if (!state.sections.length && !state.introduction) {
    return <div className="commentary-status">No commentary for this chapter.</div>;
  }

  return (
    <div className="commentary">
      {state.introduction && (
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

      {state.sections.map((s) => (
        <section key={s.from} className="commentary-section">
          <h5 className="commentary-label">{s.label}</h5>
          {s.paragraphs.map((p, i) => (
            <p key={i}>{p}</p>
          ))}
        </section>
      ))}

      <p className="commentary-credit">Matthew Henry’s Commentary · public domain</p>
    </div>
  );
}
