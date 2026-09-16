/**
 * Book-by-book reading plans for the Old and New Testaments.
 *
 * Each testament is read in canonical order, one book at a time, with a
 * steady daily chapter pace (about 3/day in the OT, 2/day in the NT).
 * Days are tagged with traditional section themes for Progress “By section.”
 */

import { BOOKS, TRACKS } from './books';

const DAYS_PER_WEEK = 7;

/** @typedef {{ id: string, name: string, books: string[] }} TestamentSection */

/** Old Testament sections (39 books). */
export const OT_SECTIONS = [
  {
    id: 'law',
    name: 'The Law',
    books: ['Genesis', 'Exodus', 'Leviticus', 'Numbers', 'Deuteronomy'],
  },
  {
    id: 'history',
    name: 'History',
    books: [
      'Joshua',
      'Judges',
      'Ruth',
      '1 Samuel',
      '2 Samuel',
      '1 Kings',
      '2 Kings',
      '1 Chronicles',
      '2 Chronicles',
      'Ezra',
      'Nehemiah',
      'Esther',
    ],
  },
  {
    id: 'wisdom',
    name: 'Wisdom & Poetry',
    books: ['Job', 'Psalms', 'Proverbs', 'Ecclesiastes', 'Song of Solomon'],
  },
  {
    id: 'major-prophets',
    name: 'Major Prophets',
    books: ['Isaiah', 'Jeremiah', 'Lamentations', 'Ezekiel', 'Daniel'],
  },
  {
    id: 'minor-prophets',
    name: 'Minor Prophets',
    books: [
      'Hosea',
      'Joel',
      'Amos',
      'Obadiah',
      'Jonah',
      'Micah',
      'Nahum',
      'Habakkuk',
      'Zephaniah',
      'Haggai',
      'Zechariah',
      'Malachi',
    ],
  },
];

/** New Testament sections (27 books). */
export const NT_SECTIONS = [
  {
    id: 'gospels',
    name: 'Gospels',
    books: ['Matthew', 'Mark', 'Luke', 'John'],
  },
  {
    id: 'acts',
    name: 'Acts',
    books: ['Acts'],
  },
  {
    id: 'paul',
    name: 'Paul’s Letters',
    books: [
      'Romans',
      '1 Corinthians',
      '2 Corinthians',
      'Galatians',
      'Ephesians',
      'Philippians',
      'Colossians',
      '1 Thessalonians',
      '2 Thessalonians',
      '1 Timothy',
      '2 Timothy',
      'Titus',
      'Philemon',
    ],
  },
  {
    id: 'general',
    name: 'General Letters',
    books: [
      'Hebrews',
      'James',
      '1 Peter',
      '2 Peter',
      '1 John',
      '2 John',
      '3 John',
      'Jude',
    ],
  },
  {
    id: 'revelation',
    name: 'Revelation',
    books: ['Revelation'],
  },
];

function booksForSections(sections) {
  const names = new Set(sections.flatMap((s) => s.books));
  return BOOKS.filter((b) => names.has(b.name));
}

function sectionForBook(sections, bookName) {
  return sections.find((s) => s.books.includes(bookName)) || sections[0];
}

function labelForChapters(chapters) {
  const segments = [];
  let segStart = 0;
  for (let i = 1; i <= chapters.length; i++) {
    const prev = chapters[i - 1];
    const curr = chapters[i];
    const sameBook = curr && curr.book === prev.book;
    const consecutive = curr && curr.chapter === prev.chapter + 1;
    if (!sameBook || !consecutive) {
      const first = chapters[segStart];
      const last = prev;
      segments.push(
        first.chapter === last.chapter
          ? `${first.book} ${first.chapter}`
          : `${first.book} ${first.chapter}–${last.chapter}`
      );
      segStart = i;
    }
  }
  return segments.join('; ');
}

/**
 * Pack a book's chapters into days of up to `perDay` chapters.
 * Never mixes two books on the same day.
 */
function chunkBook(book, perDay) {
  const days = [];
  for (let start = 1; start <= book.chapters; start += perDay) {
    const end = Math.min(book.chapters, start + perDay - 1);
    const chapters = [];
    for (let ch = start; ch <= end; ch++) {
      chapters.push({ book: book.name, chapter: ch });
    }
    days.push(chapters);
  }
  return days;
}

/**
 * Build a sequential book-by-book plan for the given sections.
 *
 * @param {{
 *   idPrefix: string,
 *   sections: TestamentSection[],
 *   chaptersPerDay: number,
 * }} opts
 */
export function buildTestamentPlan({ idPrefix, sections, chaptersPerDay }) {
  const books = booksForSections(sections);
  const days = [];
  let dayNum = 0;

  for (const book of books) {
    const section = sectionForBook(sections, book.name);
    const chunks = chunkBook(book, chaptersPerDay);
    for (const chapters of chunks) {
      dayNum += 1;
      days.push({
        day: dayNum,
        week: Math.ceil(dayNum / DAYS_PER_WEEK),
        theme: section.name,
        sectionId: section.id,
        readings: [
          {
            id: `${idPrefix}-d${dayNum}-r0`,
            trackName: section.name,
            label: labelForChapters(chapters),
            chapters,
          },
        ],
      });
    }
  }

  return days;
}

export function testamentTotalChapters(sections) {
  return booksForSections(sections).reduce((n, b) => n + b.chapters, 0);
}

/** Cached builders so plan meta lengths stay stable. */
let _otPlan = null;
let _ntPlan = null;

export function buildOldTestamentPlan() {
  if (!_otPlan) {
    _otPlan = buildTestamentPlan({
      idPrefix: 'ot',
      sections: OT_SECTIONS,
      chaptersPerDay: 3,
    });
  }
  return _otPlan;
}

export function buildNewTestamentPlan() {
  if (!_ntPlan) {
    _ntPlan = buildTestamentPlan({
      idPrefix: 'nt',
      sections: NT_SECTIONS,
      chaptersPerDay: 2,
    });
  }
  return _ntPlan;
}

export const OT_DAYS = buildOldTestamentPlan().length;
export const OT_WEEKS = Math.ceil(OT_DAYS / DAYS_PER_WEEK);
export const NT_DAYS = buildNewTestamentPlan().length;
export const NT_WEEKS = Math.ceil(NT_DAYS / DAYS_PER_WEEK);

/** OT books only (excludes NT track). */
export function oldTestamentBooks() {
  return BOOKS.filter((b) => b.track !== TRACKS.NEW_TESTAMENT);
}

/** NT books only. */
export function newTestamentBooks() {
  return BOOKS.filter((b) => b.track === TRACKS.NEW_TESTAMENT);
}
