import { BOOKS, TRACKS } from './books';

export const DAYS = 364; // 52 clean weeks
export const WEEKS = 52;
export const DAYS_PER_WEEK = 7;

const TRACK_ORDER = [
  TRACKS.LAW_HISTORY,
  TRACKS.WISDOM,
  TRACKS.PROPHETS,
  TRACKS.NEW_TESTAMENT,
];

function flattenTrack(trackName) {
  const entries = [];
  for (const book of BOOKS) {
    if (book.track !== trackName) continue;
    for (let ch = 1; ch <= book.chapters; ch++) {
      entries.push({ book: book.name, chapter: ch });
    }
  }
  return entries;
}

function labelForChapters(chapters) {
  // Group consecutive chapters within the same book into "Book a-b" segments.
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
 * Each track is sliced into 364 proportional buckets. Law & History has more
 * chapters than days so it appears every day; the other three tracks have
 * fewer, so their empty buckets simply mean that section rests that day. Every
 * chapter is still read exactly once, and every week touches all four tracks.
 */
export function buildPlan() {
  const trackLists = TRACK_ORDER.map(flattenTrack);
  const days = [];

  for (let d = 0; d < DAYS; d++) {
    const readings = [];

    TRACK_ORDER.forEach((trackName, trackIdx) => {
      const list = trackLists[trackIdx];
      // Rounding (rather than flooring) spreads each track's rest days evenly
      // across the year instead of clumping them at the start. Boundaries still
      // line up exactly, so no chapter is dropped or repeated.
      const from = Math.round((d * list.length) / DAYS);
      const to = Math.round(((d + 1) * list.length) / DAYS);
      const chapters = list.slice(from, to);
      if (chapters.length === 0) return;

      readings.push({
        id: `d${d + 1}-t${trackIdx}`,
        trackName,
        label: labelForChapters(chapters),
        chapters,
      });
    });

    days.push({ day: d + 1, week: Math.floor(d / DAYS_PER_WEEK) + 1, readings });
  }

  return days;
}

export function groupIntoWeeks(days) {
  const weeks = [];
  for (let w = 0; w < WEEKS; w++) {
    weeks.push({
      week: w + 1,
      days: days.slice(w * DAYS_PER_WEEK, (w + 1) * DAYS_PER_WEEK),
    });
  }
  return weeks;
}

export const TOTAL_CHAPTERS = BOOKS.reduce((sum, b) => sum + b.chapters, 0);
