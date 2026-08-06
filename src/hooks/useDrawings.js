import { useCallback, useState } from 'react';

const KEY = 'bible-plan-drawings-v2';

/**
 * Freehand marginalia, keyed by chapter ("Genesis 1").
 *
 * Device-local on purpose: stroke data is far bulkier than notes/highlights, so
 * it stays out of the Supabase sync payload for now.
 *
 * A stroke is { color, width, points: [[x, y, pressure], ...] } where x/y/width
 * are proportions of the scripture text box (.reader-body), so underlines stay
 * on the same words when expanding / collapsing study mode.
 */
function loadAll() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) || {};
  } catch {
    return {};
  }
}

export function useChapterDrawing(chapterKey) {
  const [strokes, setStrokes] = useState(() => loadAll()[chapterKey] || []);

  const save = useCallback(
    (next) => {
      setStrokes(next);
      // Re-read before writing so a chapter open in another card isn't clobbered.
      const all = loadAll();
      if (next.length) all[chapterKey] = next;
      else delete all[chapterKey];
      try {
        localStorage.setItem(KEY, JSON.stringify(all));
      } catch {
        /* quota exceeded — keep the in-memory drawing rather than throwing */
      }
    },
    [chapterKey]
  );

  return [strokes, save];
}
