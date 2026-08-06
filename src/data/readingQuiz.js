/**
 * Build a short multiple-choice quiz from the verses the reader just finished.
 * Questions are deterministic per reading id so retakes stay consistent.
 */

const QUESTIONS_PER_QUIZ = 4;

const STOP_WORDS = new Set(
  `
  a an the and or but if as of to in on at by for from with without into onto
  is are was were be been being am do does did done have has had having
  he she it they them their his her its we us our you your ye thou thee thy
  this that these those there here then than so not no nor yet also even
  which who whom whose what when where why how
  shall will would should could may might must can
  said saith say saying answered spoke speak speaking
  all any every some many much more most other another
  one two three four five first second
  unto upon over under after before among against through
  now come came goes went go going come coming
  lord god jesus christ holy spirit
  `.split(/\s+/).filter(Boolean)
);

/** Stable string → uint32 seed. */
export function hashSeed(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

/** Mulberry32 PRNG. */
export function rngFrom(seed) {
  let a = seed >>> 0 || 1;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffle(list, rand) {
  const out = [...list];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

function pick(list, rand) {
  if (!list.length) return null;
  return list[Math.floor(rand() * list.length)];
}

function refLabel(v) {
  return `${v.book} ${v.chapter}:${v.number}`;
}

function explainFor(verse) {
  const text = verse.text.length > 160 ? `${verse.text.slice(0, 157)}…` : verse.text;
  return `${refLabel(verse)} — “${text}”`;
}

function contentWords(text) {
  return text
    .split(/\s+/)
    .map((w) => ({
      raw: w,
      clean: w.replace(/^[“"'([]+|[”"'.,;:!?)\]]+$/g, '').toLowerCase(),
    }))
    .filter((w) => w.clean.length >= 4 && !STOP_WORDS.has(w.clean) && /[a-z]/i.test(w.clean));
}

function blankVerse(verse, rand) {
  const tokens = verse.text.trim().split(/(\s+)/);
  const candidates = [];
  tokens.forEach((tok, i) => {
    if (/^\s+$/.test(tok)) return;
    const clean = tok.replace(/^[“"'([]+|[”"'.,;:!?)\]]+$/g, '').toLowerCase();
    if (clean.length >= 4 && !STOP_WORDS.has(clean) && /[a-z]/i.test(clean)) {
      candidates.push({ i, clean, display: tok.replace(/^[“"'([]+|[”"'.,;:!?)\]]+$/g, '') });
    }
  });
  if (candidates.length < 2) return null;

  const chosen = pick(candidates, rand);
  const prompt = tokens
    .map((tok, i) => (i === chosen.i ? tok.replace(chosen.display, '______') : tok))
    .join('');

  return { prompt, answer: chosen.display, clean: chosen.clean };
}

/**
 * Flatten loaded chapter parts into quizable verses.
 * @param {{ book: string, chapter: number, verses: { number: number, text: string }[] }[]} parts
 */
export function flattenVerses(parts) {
  const verses = [];
  for (const part of parts || []) {
    for (const v of part.verses || []) {
      const text = (v.text || '').replace(/\s+/g, ' ').trim();
      if (text.split(/\s+/).length < 8) continue;
      verses.push({
        book: part.book,
        chapter: part.chapter,
        number: v.number,
        text,
      });
    }
  }
  return verses;
}

function makeBlankQuestion(verses, rand, used) {
  const pool = verses.filter((v) => !used.has(refLabel(v)));
  for (let attempt = 0; attempt < 12; attempt++) {
    const verse = pick(pool, rand);
    if (!verse) return null;
    const blanked = blankVerse(verse, rand);
    if (!blanked) continue;

    const distractorPool = new Set();
    for (const v of verses) {
      for (const w of contentWords(v.text)) {
        if (w.clean !== blanked.clean) distractorPool.add(w.raw.replace(/^[“"'([]+|[”"'.,;:!?)\]]+$/g, ''));
      }
    }
    const distractors = shuffle([...distractorPool], rand)
      .filter((w) => w.toLowerCase() !== blanked.clean && w.length >= 3)
      .slice(0, 3);
    if (distractors.length < 3) continue;

    used.add(refLabel(verse));
    const options = shuffle([blanked.answer, ...distractors], rand);
    return {
      id: `blank-${refLabel(verse)}`,
      type: 'blank',
      prompt: `Fill in the blank from ${refLabel(verse)}:`,
      passage: blanked.prompt,
      options,
      answer: blanked.answer,
      explain: explainFor(verse),
    };
  }
  return null;
}

function makeReferenceQuestion(verses, rand, used) {
  const pool = verses.filter((v) => !used.has(`ref-${refLabel(v)}`));
  if (pool.length < 4) return null;
  const verse = pick(pool, rand);
  if (!verse) return null;

  const others = shuffle(
    verses.filter((v) => refLabel(v) !== refLabel(verse)),
    rand
  ).slice(0, 3);
  if (others.length < 3) return null;

  used.add(`ref-${refLabel(verse)}`);
  const snippet =
    verse.text.length > 140 ? `${verse.text.slice(0, 137).replace(/\s+\S*$/, '')}…` : verse.text;

  return {
    id: `ref-${refLabel(verse)}`,
    type: 'reference',
    prompt: 'Where does this verse appear in today’s reading?',
    passage: `“${snippet}”`,
    options: shuffle([refLabel(verse), ...others.map(refLabel)], rand),
    answer: refLabel(verse),
    explain: explainFor(verse),
  };
}

function makeContinuationQuestion(verses, rand, used) {
  const pool = verses.filter((v) => !used.has(`cont-${refLabel(v)}`) && v.text.split(/\s+/).length >= 12);
  const verse = pick(pool, rand);
  if (!verse) return null;

  const words = verse.text.split(/\s+/);
  const cut = Math.max(4, Math.floor(words.length * 0.45));
  const start = words.slice(0, cut).join(' ');
  const end = words.slice(cut).join(' ');
  if (end.split(/\s+/).length < 4) return null;

  const distractors = [];
  for (const v of shuffle(
    verses.filter((x) => refLabel(x) !== refLabel(verse)),
    rand
  )) {
    const w = v.text.split(/\s+/);
    if (w.length < 8) continue;
    const dCut = Math.max(3, Math.floor(w.length * 0.4));
    const dEnd = w.slice(dCut).join(' ');
    if (dEnd.toLowerCase() === end.toLowerCase()) continue;
    distractors.push(dEnd.length > 110 ? `${dEnd.slice(0, 107)}…` : dEnd);
    if (distractors.length === 3) break;
  }
  if (distractors.length < 3) return null;

  used.add(`cont-${refLabel(verse)}`);
  const answerDisplay = end.length > 110 ? `${end.slice(0, 107)}…` : end;
  return {
    id: `cont-${refLabel(verse)}`,
    type: 'continuation',
    prompt: `How does ${refLabel(verse)} continue?`,
    passage: `“${start}…”`,
    options: shuffle([answerDisplay, ...distractors], rand),
    answer: answerDisplay,
    explain: explainFor(verse),
  };
}

function makeOrderQuestion(verses, rand, used) {
  if (verses.length < 4) return null;
  // Prefer pairs from the same chapter that are a few verses apart.
  const pairs = [];
  for (let i = 0; i < verses.length; i++) {
    for (let j = i + 1; j < verses.length; j++) {
      const a = verses[i];
      const b = verses[j];
      if (a.book !== b.book || a.chapter !== b.chapter) continue;
      if (b.number - a.number < 2 || b.number - a.number > 12) continue;
      pairs.push([a, b]);
    }
  }
  if (!pairs.length) return null;

  const [first, second] = pick(pairs, rand);
  const key = `order-${refLabel(first)}-${refLabel(second)}`;
  if (used.has(key)) return null;
  used.add(key);

  const aSnip = first.text.length > 90 ? `${first.text.slice(0, 87)}…` : first.text;
  const bSnip = second.text.length > 90 ? `${second.text.slice(0, 87)}…` : second.text;
  const correct = `${refLabel(first)} comes before ${refLabel(second)}`;
  const wrong = `${refLabel(second)} comes before ${refLabel(first)}`;

  return {
    id: key,
    type: 'order',
    prompt: 'Which verse comes first in the reading?',
    passage: `A: “${aSnip}”\nB: “${bSnip}”`,
    options: shuffle([correct, wrong], rand),
    answer: correct,
    explain: `${refLabel(first)} comes before ${refLabel(second)}.`,
  };
}

/**
 * Generate up to QUESTIONS_PER_QUIZ questions from loaded chapter parts.
 * @param {string} readingId
 * @param {{ book: string, chapter: number, verses: { number: number, text: string }[] }[]} parts
 */
export function buildQuiz(readingId, parts) {
  const verses = flattenVerses(parts);
  if (verses.length < 2) {
    return { questions: [], verseCount: verses.length };
  }

  const rand = rngFrom(hashSeed(readingId));
  const used = new Set();
  const makers = [makeBlankQuestion, makeReferenceQuestion, makeContinuationQuestion, makeOrderQuestion];
  // Rotate starting maker by seed so different readings lead with different types.
  const start = Math.floor(rand() * makers.length);
  const ordered = [...makers.slice(start), ...makers.slice(0, start)];

  const questions = [];
  let guard = 0;
  while (questions.length < QUESTIONS_PER_QUIZ && guard < 20) {
    guard += 1;
    const maker = ordered[questions.length % ordered.length];
    const q = maker(verses, rand, used);
    if (q) questions.push(q);
    else {
      // Try the other makers once each before giving up on this slot.
      let added = false;
      for (const alt of ordered) {
        if (alt === maker) continue;
        const q2 = alt(verses, rand, used);
        if (q2) {
          questions.push(q2);
          added = true;
          break;
        }
      }
      if (!added) break;
    }
  }

  return { questions, verseCount: verses.length };
}

export { QUESTIONS_PER_QUIZ };
