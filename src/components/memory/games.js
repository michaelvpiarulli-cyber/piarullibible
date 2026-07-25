/** Shared helpers for the memory games. */

export const GAMES = [
  { id: 'blanks', label: 'Fill Blanks', blurb: 'Recall the missing words' },
  { id: 'type', label: 'Type It', blurb: 'Type the verse from memory' },
  { id: 'scramble', label: 'Scramble', blurb: 'Put the words back in order' },
  { id: 'letters', label: 'First Letters', blurb: 'Only the first letter of each word' },
];

/** Words with their punctuation kept, for display and comparison. */
export const words = (text) => text.trim().split(/\s+/);

/** Loose comparison: case and punctuation shouldn't fail a correct answer. */
export const normalize = (w) =>
  w
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[“”]/g, '"')
    .replace(/[^a-z0-9']/g, '');

/**
 * Hide a share of the words so recall is active, not just recognition.
 *
 * Words are ranked by a stable pseudo-random score and the lowest-scoring share
 * is hidden. That guarantees the intended proportion actually gets blanked (a
 * modulo test does not — it clumps) while staying deterministic per verse, so
 * the same drill looks the same each time.
 */
export function blankOut(text, level) {
  const share = Math.min(0.2 + level * 0.15, 0.85);
  const tokens = text.split(/(\s+)/);

  const candidates = [];
  tokens.forEach((w, i) => {
    if (!/^\s+$/.test(w) && w.replace(/[^A-Za-z]/g, '').length > 2) {
      let h = i * 2654435761;
      for (let c = 0; c < w.length; c++) h = (h ^ w.charCodeAt(c)) * 16777619;
      candidates.push({ i, score: Math.abs(h % 10000) });
    }
  });

  candidates.sort((a, b) => a.score - b.score);
  const hide = new Set(candidates.slice(0, Math.round(candidates.length * share)).map((c) => c.i));

  return tokens.map((w, i) => ({ w, hidden: hide.has(i) }));
}

/** Score a typed attempt word-by-word against the original. */
export function gradeTyped(attempt, original) {
  const a = words(attempt).map(normalize).filter(Boolean);
  const o = words(original).map(normalize).filter(Boolean);
  let hits = 0;
  o.forEach((w, i) => {
    if (a[i] === w) hits++;
  });
  const accuracy = o.length ? hits / o.length : 0;
  return { hits, total: o.length, accuracy, passed: accuracy >= 0.9 };
}

/** Deterministic shuffle so a verse scrambles the same way each sitting. */
export function shuffle(list, seed = 1) {
  const out = [...list];
  let s = seed || 1;
  for (let i = out.length - 1; i > 0; i--) {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    const j = s % (i + 1);
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

/** Reduce each word to its first letter, keeping trailing punctuation. */
export function firstLetters(text) {
  return words(text).map((w) => {
    const m = w.match(/^([^A-Za-z]*)([A-Za-z])[A-Za-z]*(.*)$/);
    if (!m) return w;
    const [, pre, letter, post] = m;
    return `${pre}${letter}${post.replace(/[A-Za-z]/g, '')}`;
  });
}
