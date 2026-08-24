/**
 * Romans reading plan — 16 days, one chapter a day.
 *
 * Follows Paul’s letter in five movements: the gospel we need, justification,
 * new life in the Spirit, God’s mercy toward Israel, and a life of worship.
 */

export const ROMANS_DAYS = 16;
export const ROMANS_WEEKS = 5;

/**
 * Thematic sections for Progress “By section” and Plan week grouping.
 * `chapters` is inclusive [from, to] within Romans.
 */
export const ROMANS_SECTIONS = [
  { id: 'gospel', name: 'The gospel we need', chapters: [1, 3] },
  { id: 'faith', name: 'Justified by faith', chapters: [4, 5] },
  { id: 'life', name: 'New life in Christ', chapters: [6, 8] },
  { id: 'israel', name: 'God’s mercy & Israel', chapters: [9, 11] },
  { id: 'live', name: 'Living sacrifice', chapters: [12, 16] },
];

/**
 * Each week: theme + chapter numbers in Romans (one chapter per day).
 */
const WEEKS = ROMANS_SECTIONS.map((section) => {
  const [from, to] = section.chapters;
  const days = [];
  for (let ch = from; ch <= to; ch++) days.push(ch);
  return { theme: section.name, days };
});

function labelFor(chapter) {
  return `Romans ${chapter}`;
}

/** Build the full Romans plan (16 days). */
export function buildRomansPlan() {
  const days = [];
  let dayNum = 0;

  WEEKS.forEach((week, weekIdx) => {
    week.days.forEach((chapter) => {
      dayNum += 1;
      days.push({
        day: dayNum,
        week: weekIdx + 1,
        theme: week.theme,
        readings: [
          {
            id: `rom-d${dayNum}-r0`,
            trackName: week.theme,
            label: labelFor(chapter),
            chapters: [{ book: 'Romans', chapter }],
          },
        ],
      });
    });
  });

  if (days.length !== ROMANS_DAYS) {
    throw new Error(`Romans plan expected ${ROMANS_DAYS} days, got ${days.length}`);
  }

  return days;
}

export function romansTotalChapters() {
  return ROMANS_DAYS;
}
