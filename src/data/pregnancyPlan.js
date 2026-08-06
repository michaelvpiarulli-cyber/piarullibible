/**
 * Pregnancy reading plan — 40 weeks (280 days), one focused chapter a day.
 *
 * Weekly themes walk with an expectant parent from “formed by God” through
 * trust, Mary’s yes, peace, and readiness to welcome a child.
 */

import { pregnancyDayFromDueDate, parseISODate } from './pregnancyDates';

export const PREGNANCY_DAYS = 280;
export const PREGNANCY_WEEKS = 40;

/**
 * Each week: theme + 7 chapter refs `[book, chapter]` (Sun→Sat style order).
 * Whole chapters keep the existing reader simple and still stay on-theme.
 */
const WEEKS = [
  {
    theme: 'Formed by God',
    days: [
      ['Psalms', 139],
      ['Jeremiah', 1],
      ['Isaiah', 44],
      ['Genesis', 1],
      ['Job', 10],
      ['Ecclesiastes', 11],
      ['Isaiah', 49],
    ],
  },
  {
    theme: 'Fear not',
    days: [
      ['Isaiah', 41],
      ['Isaiah', 43],
      ['Joshua', 1],
      ['Psalms', 27],
      ['Psalms', 56],
      ['John', 14],
      ['2 Timothy', 1],
    ],
  },
  {
    theme: 'God with us',
    days: [
      ['Matthew', 1],
      ['Isaiah', 7],
      ['Psalms', 23],
      ['Psalms', 46],
      ['Zephaniah', 3],
      ['Matthew', 28],
      ['Hebrews', 13],
    ],
  },
  {
    theme: 'Trust His timing',
    days: [
      ['Ecclesiastes', 3],
      ['Habakkuk', 2],
      ['Psalms', 37],
      ['Isaiah', 40],
      ['Romans', 8],
      ['Proverbs', 3],
      ['Lamentations', 3],
    ],
  },
  {
    theme: 'Peace',
    days: [
      ['Philippians', 4],
      ['Isaiah', 26],
      ['John', 16],
      ['Colossians', 3],
      ['Psalms', 4],
      ['Psalms', 29],
      ['Isaiah', 32],
    ],
  },
  {
    theme: 'Strength for today',
    days: [
      ['Isaiah', 40],
      ['Philippians', 4],
      ['Psalms', 18],
      ['Ephesians', 3],
      ['Isaiah', 41],
      ['2 Corinthians', 12],
      ['Psalms', 73],
    ],
  },
  {
    theme: 'Prayer & waiting',
    days: [
      ['1 Samuel', 1],
      ['Luke', 1],
      ['Psalms', 5],
      ['Psalms', 130],
      ['Matthew', 6],
      ['James', 5],
      ['Psalms', 40],
    ],
  },
  {
    theme: 'Hope',
    days: [
      ['Romans', 15],
      ['Romans', 5],
      ['Hebrews', 6],
      ['Psalms', 42],
      ['Psalms', 71],
      ['Isaiah', 55],
      ['1 Peter', 1],
    ],
  },
  {
    theme: 'Mary’s yes',
    days: [
      ['Luke', 1],
      ['Luke', 2],
      ['Isaiah', 9],
      ['Micah', 5],
      ['Psalms', 113],
      ['1 Samuel', 2],
      ['Galatians', 4],
    ],
  },
  {
    theme: 'Joy & promise',
    days: [
      ['Luke', 1],
      ['Psalms', 126],
      ['Isaiah', 61],
      ['John', 15],
      ['Psalms', 16],
      ['Nehemiah', 8],
      ['Philippians', 1],
    ],
  },
  {
    theme: 'Children as a heritage',
    days: [
      ['Psalms', 127],
      ['Psalms', 128],
      ['Genesis', 17],
      ['Genesis', 21],
      ['Deuteronomy', 6],
      ['Mark', 10],
      ['Proverbs', 22],
    ],
  },
  {
    theme: 'God’s care',
    days: [
      ['Matthew', 6],
      ['1 Peter', 5],
      ['Psalms', 121],
      ['Psalms', 91],
      ['Isaiah', 46],
      ['Deuteronomy', 31],
      ['Nahum', 1],
    ],
  },
  {
    theme: 'Rest in Him',
    days: [
      ['Matthew', 11],
      ['Psalms', 62],
      ['Psalms', 131],
      ['Exodus', 33],
      ['Hebrews', 4],
      ['Isaiah', 30],
      ['Mark', 6],
    ],
  },
  {
    theme: 'New life',
    days: [
      ['John', 3],
      ['2 Corinthians', 5],
      ['Ezekiel', 36],
      ['Romans', 6],
      ['Ephesians', 2],
      ['Titus', 3],
      ['Colossians', 1],
    ],
  },
  {
    theme: 'Wisdom for the journey',
    days: [
      ['James', 1],
      ['Proverbs', 2],
      ['Proverbs', 3],
      ['Proverbs', 31],
      ['Psalms', 1],
      ['Colossians', 1],
      ['Ephesians', 5],
    ],
  },
  {
    theme: 'Compassion of God',
    days: [
      ['Isaiah', 49],
      ['Isaiah', 66],
      ['Hosea', 11],
      ['Psalms', 103],
      ['Luke', 15],
      ['Matthew', 9],
      ['Lamentations', 3],
    ],
  },
  {
    theme: 'Faithfulness',
    days: [
      ['Lamentations', 3],
      ['Deuteronomy', 7],
      ['Psalms', 89],
      ['Psalms', 100],
      ['1 Thessalonians', 5],
      ['2 Thessalonians', 3],
      ['Hebrews', 10],
    ],
  },
  {
    theme: 'Light in the dark',
    days: [
      ['John', 1],
      ['John', 8],
      ['Psalms', 27],
      ['Isaiah', 60],
      ['Ephesians', 5],
      ['1 John', 1],
      ['Matthew', 5],
    ],
  },
  {
    theme: 'Grace upon grace',
    days: [
      ['Ephesians', 2],
      ['Romans', 5],
      ['Titus', 2],
      ['John', 1],
      ['2 Corinthians', 9],
      ['Hebrews', 4],
      ['1 Peter', 5],
    ],
  },
  {
    theme: 'Body as a temple',
    days: [
      ['1 Corinthians', 6],
      ['Romans', 12],
      ['Psalms', 139],
      ['1 Timothy', 4],
      ['Proverbs', 4],
      ['3 John', 1],
      ['Isaiah', 58],
    ],
  },
  {
    theme: 'Patience',
    days: [
      ['James', 5],
      ['Romans', 8],
      ['Galatians', 5],
      ['Colossians', 1],
      ['Psalms', 37],
      ['Hebrews', 12],
      ['Luke', 8],
    ],
  },
  {
    theme: 'Comfort',
    days: [
      ['2 Corinthians', 1],
      ['Isaiah', 40],
      ['Isaiah', 51],
      ['Psalms', 34],
      ['Psalms', 119],
      ['John', 14],
      ['Revelation', 21],
    ],
  },
  {
    theme: 'Courage',
    days: [
      ['Deuteronomy', 31],
      ['Joshua', 1],
      ['Psalms', 31],
      ['Acts', 4],
      ['Ephesians', 6],
      ['1 Chronicles', 28],
      ['Isaiah', 35],
    ],
  },
  {
    theme: 'Thanksgiving',
    days: [
      ['Psalms', 100],
      ['Psalms', 103],
      ['1 Thessalonians', 5],
      ['Colossians', 3],
      ['Philippians', 4],
      ['Luke', 17],
      ['Psalms', 136],
    ],
  },
  {
    theme: 'Love that never fails',
    days: [
      ['1 Corinthians', 13],
      ['1 John', 4],
      ['Romans', 8],
      ['John', 15],
      ['Ephesians', 3],
      ['Song of Solomon', 8],
      ['Psalms', 136],
    ],
  },
  {
    theme: 'Humility & dependence',
    days: [
      ['Micah', 6],
      ['Philippians', 2],
      ['James', 4],
      ['1 Peter', 5],
      ['Matthew', 18],
      ['Psalms', 25],
      ['Proverbs', 11],
    ],
  },
  {
    theme: 'The Shepherd’s care',
    days: [
      ['Psalms', 23],
      ['John', 10],
      ['Ezekiel', 34],
      ['Isaiah', 40],
      ['1 Peter', 2],
      ['Hebrews', 13],
      ['Revelation', 7],
    ],
  },
  {
    theme: 'Blessing the family',
    days: [
      ['Genesis', 12],
      ['Numbers', 6],
      ['Ephesians', 3],
      ['Psalms', 128],
      ['Joshua', 24],
      ['Acts', 16],
      ['Proverbs', 14],
    ],
  },
  {
    theme: 'Sing to the Lord',
    days: [
      ['Psalms', 95],
      ['Psalms', 96],
      ['Psalms', 98],
      ['Exodus', 15],
      ['Luke', 1],
      ['Colossians', 3],
      ['Revelation', 15],
    ],
  },
  {
    theme: 'When you’re weary',
    days: [
      ['Matthew', 11],
      ['Isaiah', 40],
      ['Galatians', 6],
      ['Psalms', 61],
      ['Psalms', 63],
      ['2 Thessalonians', 3],
      ['Hebrews', 12],
    ],
  },
  {
    theme: 'God’s promises stand',
    days: [
      ['2 Corinthians', 1],
      ['Hebrews', 6],
      ['Hebrews', 11],
      ['Genesis', 15],
      ['Romans', 4],
      ['Psalms', 119],
      ['Isaiah', 55],
    ],
  },
  {
    theme: 'Prepare Him room',
    days: [
      ['Isaiah', 40],
      ['Malachi', 3],
      ['Luke', 3],
      ['Matthew', 3],
      ['John', 1],
      ['Philippians', 1],
      ['1 John', 3],
    ],
  },
  {
    theme: 'Wonder of birth',
    days: [
      ['Job', 38],
      ['Job', 39],
      ['Psalms', 8],
      ['Psalms', 104],
      ['Genesis', 2],
      ['Ecclesiastes', 11],
      ['Isaiah', 45],
    ],
  },
  {
    theme: 'Ready to receive',
    days: [
      ['Luke', 2],
      ['Matthew', 2],
      ['Isaiah', 9],
      ['Psalms', 127],
      ['1 Samuel', 1],
      ['Ruth', 4],
      ['Proverbs', 31],
    ],
  },
  {
    theme: 'Protection',
    days: [
      ['Psalms', 91],
      ['Psalms', 121],
      ['Psalms', 125],
      ['Isaiah', 54],
      ['2 Thessalonians', 3],
      ['Jude', 1],
      ['Exodus', 14],
    ],
  },
  {
    theme: 'Joy coming',
    days: [
      ['John', 16],
      ['Psalms', 30],
      ['Isaiah', 12],
      ['Isaiah', 35],
      ['Luke', 2],
      ['Philippians', 4],
      ['1 Peter', 1],
    ],
  },
  {
    theme: 'Labor & deliverance',
    days: [
      ['Isaiah', 66],
      ['John', 16],
      ['Psalms', 18],
      ['Exodus', 15],
      ['2 Samuel', 22],
      ['Psalms', 40],
      ['Isaiah', 43],
    ],
  },
  {
    theme: 'Welcome the child',
    days: [
      ['Luke', 2],
      ['Mark', 10],
      ['Matthew', 18],
      ['Psalms', 127],
      ['1 Samuel', 1],
      ['Genesis', 33],
      ['3 John', 1],
    ],
  },
  {
    theme: 'Dedication',
    days: [
      ['1 Samuel', 1],
      ['Luke', 2],
      ['Deuteronomy', 6],
      ['Proverbs', 22],
      ['Ephesians', 6],
      ['Colossians', 3],
      ['Psalms', 78],
    ],
  },
  {
    theme: 'Abide & give thanks',
    days: [
      ['John', 15],
      ['Psalms', 100],
      ['Psalms', 103],
      ['1 Thessalonians', 5],
      ['Colossians', 2],
      ['Romans', 12],
      ['Revelation', 21],
    ],
  },
];

function labelFor(book, chapter) {
  return `${book} ${chapter}`;
}

/** Full 280-day catalog (pregnancy day 1 → due date). */
export function buildFullPregnancyPlan() {
  const days = [];
  let dayNum = 0;

  WEEKS.forEach((week, weekIdx) => {
    week.days.forEach(([book, chapter]) => {
      dayNum += 1;
      days.push({
        day: dayNum,
        week: weekIdx + 1,
        pregnancyDay: dayNum,
        theme: week.theme,
        readings: [
          {
            id: `preg-d${dayNum}-r0`,
            trackName: week.theme,
            label: labelFor(book, chapter),
            chapters: [{ book, chapter }],
          },
        ],
      });
    });
  });

  if (days.length !== PREGNANCY_DAYS) {
    throw new Error(`Pregnancy plan expected ${PREGNANCY_DAYS} days, got ${days.length}`);
  }

  return days;
}

/**
 * Build the pregnancy plan for the time left until the due date.
 * Starts at the pregnancy day for `asOfDate` (usually the day they joined)
 * and runs through day 280 — remapped so their Day 1 is that join day.
 *
 * @param {{ dueDate?: string, asOfDate?: string }} [opts]
 */
export function buildPregnancyPlan(opts = {}) {
  const full = buildFullPregnancyPlan();
  const dueDate = opts.dueDate;

  if (!dueDate) {
    return full.map((d, i) => ({ ...d, day: i + 1 }));
  }

  const asOf = opts.asOfDate ? parseISODate(opts.asOfDate) : new Date();
  const fromPregDay = pregnancyDayFromDueDate(dueDate, asOf || new Date());
  const remaining = full.slice(fromPregDay - 1);

  return remaining.map((d, i) => ({
    ...d,
    day: i + 1,
  }));
}

export function pregnancyTotalChapters(opts = {}) {
  return buildPregnancyPlan(opts).reduce(
    (n, d) => n + d.readings.reduce((m, r) => m + r.chapters.length, 0),
    0
  );
}
