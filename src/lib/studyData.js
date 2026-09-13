import { HELLOAO_CODES, isOldTestament } from '../data/bookRefs';

const BASE = 'https://bible.helloao.org/api';

/** Public-domain commentaries on helloao. */
export const COMMENTARIES = [
  { id: 'matthew-henry', name: 'Matthew Henry', short: 'Henry' },
  { id: 'adam-clarke', name: 'Adam Clarke', short: 'Clarke' },
  { id: 'jamieson-fausset-brown', name: 'Jamieson-Fausset-Brown', short: 'JFB' },
  { id: 'john-gill', name: 'John Gill', short: 'Gill' },
  { id: 'john-calvin', name: 'John Calvin', short: 'Calvin' },
  { id: 'tyndale', name: 'Tyndale Study Notes', short: 'Tyndale' },
  { id: 'keil-delitzsch', name: 'Keil & Delitzsch (OT)', short: 'K&D', otOnly: true },
];

/** Free English translations for parallel compare. */
export const COMPARE_TRANSLATIONS = [
  { id: 'ENGWEBP', label: 'WEB' },
  { id: 'BSB', label: 'BSB' },
  { id: 'eng_kjv', label: 'KJV' },
  { id: 'eng_asv', label: 'ASV' },
  { id: 'eng_bbe', label: 'BBE' },
  { id: 'eng_ylt', label: 'YLT' },
];

const jsonCache = new Map();

async function fetchJson(url) {
  if (jsonCache.has(url)) return jsonCache.get(url);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status}`);
  const ctype = res.headers.get('content-type') || '';
  if (!ctype.includes('json')) throw new Error('not json');
  const data = await res.json();
  jsonCache.set(url, data);
  return data;
}

function codeFor(book) {
  const code = HELLOAO_CODES[book];
  if (!code) throw new Error(`Unknown book: ${book}`);
  return code;
}

function flattenVerseContent(content) {
  const parts = [];
  for (const part of content || []) {
    if (typeof part === 'string') parts.push(part);
    else if (part?.text) parts.push(String(part.text));
  }
  return parts.join('').replace(/\s+/g, ' ').trim();
}

export function verseTextFromChapter(data, verseNumber) {
  const verses = (data.chapter?.content || []).filter((i) => i.type === 'verse');
  const v = verses.find((x) => x.number === verseNumber);
  return v ? flattenVerseContent(v.content) : '';
}

export async function fetchTranslationVerse(translationId, book, chapter, verse) {
  const code = codeFor(book);
  const data = await fetchJson(`${BASE}/${translationId}/${code}/${chapter}.json`);
  return verseTextFromChapter(data, verse);
}

/** Full chapter verses for continuous parallel reading. */
export async function fetchTranslationChapter(translationId, book, chapter) {
  const code = codeFor(book);
  const data = await fetchJson(`${BASE}/${translationId}/${code}/${chapter}.json`);
  const verses = (data.chapter?.content || [])
    .filter((item) => item.type === 'verse')
    .map((v) => ({
      number: v.number,
      text: flattenVerseContent(v.content),
    }));
  return {
    translationId,
    book,
    chapter,
    heading: `${book} ${chapter}`,
    verses,
  };
}

/**
 * Rough concordance: search WEB for a Strong’s gloss / lemma keyword.
 * Returns [{ book, chapter, verse, text }].
 */
export async function searchConcordance(query, limit = 40) {
  const q = String(query || '').trim();
  if (q.length < 2) return [];
  const url = `https://bolls.life/v2/find/WEB?search=${encodeURIComponent(q)}&limit=${limit}&page=1`;
  const res = await fetch(url);
  if (!res.ok) throw new Error('Concordance search failed');
  const data = await res.json();
  return (data.results || []).map((h) => ({
    bookId: h.book,
    chapter: h.chapter,
    verse: h.verse,
    text: String(h.text || '')
      .replace(/<[^>]+>/g, '')
      .replace(/[⌃⌄]/g, '')
      .trim(),
  }));
}

export async function fetchParallelVerses(
  book,
  chapter,
  verse,
  translationIds = COMPARE_TRANSLATIONS.map((t) => t.id)
) {
  return Promise.all(
    translationIds.map(async (id) => {
      const meta = COMPARE_TRANSLATIONS.find((t) => t.id === id) || { id, label: id };
      try {
        const text = await fetchTranslationVerse(id, book, chapter, verse);
        return { ...meta, text, error: text ? null : 'Missing verse' };
      } catch (err) {
        return { ...meta, text: '', error: err.message || 'Failed' };
      }
    })
  );
}

function toCommentarySections(chapter, lastVerse) {
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

export async function fetchCommentaryChapter(commentaryId, book, chapter, lastVerse) {
  const code = codeFor(book);
  const data = await fetchJson(`${BASE}/c/${commentaryId}/${code}/${chapter}.json`);
  return {
    introduction: data.chapter?.introduction || null,
    sections: toCommentarySections(data.chapter || {}, lastVerse),
  };
}

export async function fetchFactbook(book, chapter) {
  const code = codeFor(book);
  try {
    const data = await fetchJson(`${BASE}/d/theographic/${code}/${chapter}.json`);
    const ch = data.chapter || {};
    return {
      people: ch.people || [],
      places: ch.places || [],
      events: ch.events || [],
    };
  } catch {
    return { people: [], places: [], events: [] };
  }
}

export async function fetchPerson(id) {
  return fetchJson(`${BASE}/d/theographic/people/${id}.json`);
}

export async function fetchPlace(id) {
  return fetchJson(`${BASE}/d/theographic/places/${id}.json`);
}

/**
 * Map Strong’s ranges onto verse text.
 * Returns [{ word, strongs, start, end }].
 */
export async function fetchVerseWordMap(book, chapter, verse, verseText) {
  const code = codeFor(book);
  let data;
  try {
    data = await fetchJson(`${BASE}/ENGWEBP/${code}/${chapter}.words.json`);
  } catch {
    return [];
  }

  const ranges = data.verses?.[String(verse)] || data.verses?.[verse] || [];
  if (!ranges.length || !verseText) return [];

  const prefer = isOldTestament(book) ? 'H' : 'G';
  return ranges
    .map((r) => {
      const start = r.start ?? 0;
      const end = r.end ?? start;
      const word = verseText.slice(start, end);
      const strongs = (r.strongs || [])
        .map((s) => {
          const raw = String(s).toUpperCase();
          if (raw.startsWith('G') || raw.startsWith('H')) return raw;
          return `${prefer}${raw.replace(/\D/g, '')}`;
        })
        .filter(Boolean);
      return word.trim() ? { word, strongs, start, end } : null;
    })
    .filter(Boolean);
}

export function commentariesForBook(book) {
  const ot = isOldTestament(book);
  return COMMENTARIES.filter((c) => !c.otOnly || ot);
}
