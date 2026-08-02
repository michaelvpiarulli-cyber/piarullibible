import { PASTOR_BOOK, countWords } from './pastorBook';
import { DAYS as BIBLE_DAYS } from './generatePlan';

/** Sensible lengths offered in Plan settings. */
export const BOOK_PLAN_DAY_OPTIONS = [30, 60, 90, 180, 364];
export const DEFAULT_BOOK_PLAN_DAYS = 90;

const STORAGE_KEY = 'bible-plan-book-days';

export function loadBookPlanDays() {
  try {
    const n = Number(localStorage.getItem(STORAGE_KEY));
    if (BOOK_PLAN_DAY_OPTIONS.includes(n)) return n;
  } catch {
    /* ignore */
  }
  return DEFAULT_BOOK_PLAN_DAYS;
}

export function saveBookPlanDays(days) {
  localStorage.setItem(STORAGE_KEY, String(days));
}

/**
 * Flatten chapters into ordered paragraph units the packer can slice.
 */
function flattenParagraphs(book) {
  const units = [];
  for (const ch of book.chapters) {
    ch.paragraphs.forEach((text, idx) => {
      units.push({
        chapterId: ch.id,
        chapterNumber: ch.number,
        chapterTitle: ch.title,
        paragraphIndex: idx,
        text,
        words: countWords(text),
        isChapterStart: idx === 0,
        isChapterEnd: idx === ch.paragraphs.length - 1,
      });
    });
  }
  return units;
}

function labelForUnits(units) {
  if (units.length === 0) return '';
  const first = units[0];
  const last = units[units.length - 1];
  const sameChapter = first.chapterNumber === last.chapterNumber;

  if (sameChapter) {
    const wholeChapter =
      first.isChapterStart && last.isChapterEnd && first.paragraphIndex === 0;
    if (wholeChapter) return `${first.chapterTitle}`;
    if (first.paragraphIndex === 0 && last.isChapterEnd) return first.chapterTitle;
    if (first.isChapterStart) return `${first.chapterTitle} (begin)`;
    if (last.isChapterEnd) return `${first.chapterTitle} (end)`;
    return `${first.chapterTitle} (cont.)`;
  }

  return `${first.chapterTitle} – ${last.chapterTitle}`;
}

/**
 * Pack paragraphs into `targetDays` buckets by word budget.
 * Prefers ending a day on a chapter boundary when the day is already
 * ~70% full, so readings feel like natural stopping points.
 */
export function buildBookPlan(book = PASTOR_BOOK, targetDays = DEFAULT_BOOK_PLAN_DAYS) {
  const units = flattenParagraphs(book);
  if (units.length === 0 || targetDays < 1) return [];

  const totalWords = units.reduce((n, u) => n + u.words, 0);
  const daysWanted = Math.min(targetDays, Math.max(1, units.length));
  const budget = Math.max(1, Math.round(totalWords / daysWanted));

  const days = [];
  let cursor = 0;
  let dayNum = 1;

  while (cursor < units.length && dayNum <= daysWanted) {
    const remainingDays = daysWanted - dayNum + 1;
    const remainingUnits = units.length - cursor;
    // Last day (or last unit) takes everything left.
    if (remainingDays === 1 || remainingUnits === 1) {
      const slice = units.slice(cursor);
      days.push(makeReading(book, dayNum, slice));
      cursor = units.length;
      dayNum++;
      break;
    }

    // Leave at least one unit for each remaining day.
    const maxTake = remainingUnits - (remainingDays - 1);
    let take = 0;
    let words = 0;

    while (take < maxTake) {
      const next = units[cursor + take];
      const nextWords = words + next.words;
      const wouldExceed = take > 0 && nextWords > budget;

      if (wouldExceed) {
        // If we're mostly full and the previous unit closed a chapter, stop.
        const prev = units[cursor + take - 1];
        if (prev?.isChapterEnd && words >= budget * 0.55) break;
        // If adding this one paragraph still keeps us sane, take it and stop.
        if (nextWords <= budget * 1.35) {
          take++;
          words = nextWords;
        }
        break;
      }

      take++;
      words = nextWords;

      // Soft chapter-boundary stop once the day has enough content.
      if (next.isChapterEnd && words >= budget * 0.7 && take < maxTake) {
        break;
      }
    }

    if (take === 0) take = 1;
    const slice = units.slice(cursor, cursor + take);
    days.push(makeReading(book, dayNum, slice));
    cursor += take;
    dayNum++;
  }

  return days;
}

function makeReading(book, dayNum, units) {
  return {
    id: `book-d${dayNum}`,
    kind: 'book',
    trackName: book.title,
    label: labelForUnits(units),
    chapters: [], // Bible PassageText expects this; book readings leave it empty
    bookId: book.id,
    bookTitle: book.title,
    author: book.author,
    placeholder: Boolean(book.placeholder),
    paragraphs: units.map((u) => ({
      text: u.text,
      chapterNumber: u.chapterNumber,
      chapterTitle: u.chapterTitle,
      isChapterStart: u.isChapterStart,
    })),
  };
}

/**
 * Merge companion book readings into the Bible year plan.
 * Book day N lands on Bible day N; leftover Bible days have no book row.
 */
export function mergeBookIntoPlan(biblePlan, bookReadings) {
  if (!bookReadings?.length) return biblePlan;
  return biblePlan.map((day) => {
    const bookReading = bookReadings[day.day - 1];
    if (!bookReading) return day;
    return {
      ...day,
      readings: [...day.readings, bookReading],
    };
  });
}

/** Cap book plan length so it never exceeds the Bible year. */
export function clampBookDays(days) {
  const n = Number(days);
  if (!Number.isFinite(n)) return DEFAULT_BOOK_PLAN_DAYS;
  return Math.min(BIBLE_DAYS, Math.max(1, Math.round(n)));
}
