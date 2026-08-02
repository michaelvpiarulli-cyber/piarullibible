import { BOOKS } from './books';

/**
 * BOOKS is already in canonical order, which is exactly the book numbering
 * bolls.life uses (Genesis = 1 … Revelation = 66).
 */
const bookNumbers = new Map(BOOKS.map((b, i) => [b.name, i + 1]));

export const bollsBookId = (name) => bookNumbers.get(name);

/** Books 1–39 are the Hebrew scriptures; 40–66 are the Greek New Testament. */
export const isOldTestament = (name) => bollsBookId(name) <= 39;

/** USFM codes, as used by bible.helloao.org for commentaries and chapter text. */
export const HELLOAO_CODES = {
  Genesis: 'GEN', Exodus: 'EXO', Leviticus: 'LEV', Numbers: 'NUM', Deuteronomy: 'DEU',
  Joshua: 'JOS', Judges: 'JDG', Ruth: 'RUT', '1 Samuel': '1SA', '2 Samuel': '2SA',
  '1 Kings': '1KI', '2 Kings': '2KI', '1 Chronicles': '1CH', '2 Chronicles': '2CH',
  Ezra: 'EZR', Nehemiah: 'NEH', Esther: 'EST', Job: 'JOB', Psalms: 'PSA',
  Proverbs: 'PRO', Ecclesiastes: 'ECC', 'Song of Solomon': 'SNG', Isaiah: 'ISA',
  Jeremiah: 'JER', Lamentations: 'LAM', Ezekiel: 'EZK', Daniel: 'DAN', Hosea: 'HOS',
  Joel: 'JOL', Amos: 'AMO', Obadiah: 'OBA', Jonah: 'JON', Micah: 'MIC', Nahum: 'NAM',
  Habakkuk: 'HAB', Zephaniah: 'ZEP', Haggai: 'HAG', Zechariah: 'ZEC', Malachi: 'MAL',
  Matthew: 'MAT', Mark: 'MRK', Luke: 'LUK', John: 'JHN', Acts: 'ACT', Romans: 'ROM',
  '1 Corinthians': '1CO', '2 Corinthians': '2CO', Galatians: 'GAL', Ephesians: 'EPH',
  Philippians: 'PHP', Colossians: 'COL', '1 Thessalonians': '1TH', '2 Thessalonians': '2TH',
  '1 Timothy': '1TI', '2 Timothy': '2TI', Titus: 'TIT', Philemon: 'PHM', Hebrews: 'HEB',
  James: 'JAS', '1 Peter': '1PE', '2 Peter': '2PE', '1 John': '1JN', '2 John': '2JN',
  '3 John': '3JN', Jude: 'JUD', Revelation: 'REV',
};

/** Reverse lookup: USFM code → book name (e.g. JHN → John). */
export const BOOK_BY_CODE = Object.fromEntries(
  Object.entries(HELLOAO_CODES).map(([name, code]) => [code, name])
);

/** Format a cross-ref for display: "Romans 5:8" or "1 John 4:9–10". */
export function formatRef(ref) {
  const name = BOOK_BY_CODE[ref.book] || ref.book;
  const end = ref.endVerse && ref.endVerse !== ref.verse ? `–${ref.endVerse}` : '';
  return `${name} ${ref.chapter}:${ref.verse}${end}`;
}

/**
 * Parse a free-form passage string like "Romans 8:1–11" or "1 John 4".
 * Returns { book, chapter, verse } or null if it can't match a canon book.
 */
export function parsePassage(input) {
  const raw = (input || '').trim();
  if (!raw) return null;

  // Longest names first so "1 John" wins over "John", "Song of Solomon" over "Song".
  const names = [...BOOKS.map((b) => b.name)].sort((a, b) => b.length - a.length);
  const lower = raw.toLowerCase();
  const book = names.find((n) => lower.startsWith(n.toLowerCase()));
  if (!book) return null;

  const rest = raw.slice(book.length).trim().replace(/^[\s.:]+/, '');
  const m = rest.match(/^(\d+)(?:\s*[:.]\s*(\d+))?/);
  if (!m) return { book, chapter: 1, verse: 1 };
  return {
    book,
    chapter: Number(m[1]),
    verse: m[2] ? Number(m[2]) : 1,
  };
}
