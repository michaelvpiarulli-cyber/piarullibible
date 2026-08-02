/**
 * Pastor’s book content for the companion daily reading track.
 *
 * Shape (ready for OCR intake later):
 *   {
 *     id, title, author, subtitle?, placeholder?,
 *     chapters: [{ id, number, title, paragraphs: string[] }]
 *   }
 *
 * Swap this file’s PASTOR_BOOK export when page photos are transcribed —
 * the plan generator and UI read only this shape.
 */

export const PASTOR_BOOK = {
  id: 'days-with-jesus',
  title: 'Days with Jesus',
  author: 'Your Pastor',
  subtitle: 'Companion reading alongside Scripture',
  // true until real chapter text is pasted in from photos / transcription
  placeholder: true,
  chapters: [
    {
      id: 'ch-1',
      number: 1,
      title: 'Why We Read Together',
      paragraphs: [
        'This space is ready for your pastor’s book. For now these chapters are scaffolding so the daily plan, check-offs, and reader can be built and tested before any page photos arrive.',
        'Each day you will get a short section here next to your Bible readings. Mark it done when you finish — the same streak and catch-up tools cover both tracks.',
        'When the real text is ready, we will replace these paragraphs chapter by chapter. Titles, order, and daily length can all be adjusted without changing how the app works.',
      ],
    },
    {
      id: 'ch-2',
      number: 2,
      title: 'A Steady Pace',
      paragraphs: [
        'A good companion plan is short enough to keep, long enough to matter. The app slices this book into daily portions by word count so most days feel about the same length.',
        'You can change how many days the book plan runs in Progress → Plan settings. Shorter spans mean a little more each day; longer spans spread the same text thinner.',
        'Chapter boundaries are respected when possible, so you are not left hanging mid-thought just because the word budget ran out.',
      ],
    },
    {
      id: 'ch-3',
      number: 3,
      title: 'Reading With Scripture',
      paragraphs: [
        'This track is meant to sit beside the Bible year plan, not replace it. Open Today and you will see the pastor’s book as its own reading row under the four Scripture tracks.',
        'Expand the row to read the day’s portion in place. You can also browse the whole book from the Read tab whenever you want to look ahead or catch a chapter again.',
        'Highlights and verse tools stay with Scripture. The book track is for consecutive prose — chapters and paragraphs, checked off one day at a time.',
      ],
    },
    {
      id: 'ch-4',
      number: 4,
      title: 'What Comes Next',
      paragraphs: [
        'When you photograph every page, those images can be transcribed into this same chapter-and-paragraph format. Nothing about Today, Plan, or Progress needs to be reinvented.',
        'Until then, treat these pages as a dry run: practice the rhythm, try different plan lengths, and notice what feels natural for your household.',
        'The goal is simple — open the app, meet God in Scripture, and let your pastor’s words walk alongside you for a few quiet minutes each day.',
      ],
    },
    {
      id: 'ch-5',
      number: 5,
      title: 'Keeping the Habit',
      paragraphs: [
        'Missed a day? The week strip and catch-up button still work. Book readings count toward a complete day, so finishing both Scripture and the companion portion keeps your streak honest.',
        'If the book finishes before the Bible year does, later days simply omit this track. If you lengthen the plan, the same text is paced more gently across more mornings.',
        'Families can still share Bible progress in the Family tab; book check-offs stay with your personal progress for now.',
      ],
    },
    {
      id: 'ch-6',
      number: 6,
      title: 'From Placeholder to Real Pages',
      paragraphs: [
        'Real intake will look like this file: a title, an author, and an ordered list of chapters, each with clean paragraphs. No special markup is required beyond ordinary sentences.',
        'Headings become chapter titles. Page numbers can be noted in labels if you want them, but they are optional — the plan already names the chapter and part for each day.',
        'Once the placeholder flag is turned off, the “sample content” notice in the reader will disappear and these words will be the book itself.',
      ],
    },
    {
      id: 'ch-7',
      number: 7,
      title: 'Reading for Formation',
      paragraphs: [
        'Companion books form us when we return to them the way we return to a meal — regularly, without rushing, ready to be fed.',
        'Use the day’s portion as a bridge: Scripture first, then a few pages that help the Word settle into ordinary life, work, and family.',
        'Journal or examen afterward if something stands out. The Prayer tab is already there for that kind of lingering.',
      ],
    },
    {
      id: 'ch-8',
      number: 8,
      title: 'Until the Real Book Arrives',
      paragraphs: [
        'That is the whole scaffold — eight short chapters so the plan has something to slice, the reader has something to show, and you can feel the daily rhythm before any camera work.',
        'When you are ready, send page photos (or a typed manuscript). We will drop the true text into this structure and keep the plan you already practiced.',
        'Until then: open Today, expand Days with Jesus, and treat this as a rehearsal for the habit you want to keep.',
      ],
    },
  ],
};

/** Rough word count for pacing the daily plan. */
export function countWords(text) {
  return String(text || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean).length;
}

export function bookStats(book = PASTOR_BOOK) {
  let paragraphs = 0;
  let words = 0;
  for (const ch of book.chapters) {
    paragraphs += ch.paragraphs.length;
    for (const p of ch.paragraphs) words += countWords(p);
  }
  return {
    chapters: book.chapters.length,
    paragraphs,
    words,
  };
}
