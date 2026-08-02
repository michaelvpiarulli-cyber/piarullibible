/** Aspect ratio of one page of the pad (height ÷ width). */
export const PAGE_RATIO = 1.15;

/**
 * How many ruled page-units the ink needs.
 * Stroke y is 0–1 of the *current* canvas; multiply by `fallback` (current
 * page count) to get page-units used.
 */
export function pagesNeededForInk(strokes, fallback = 1) {
  const base = Math.max(1, fallback || 1);
  if (!strokes?.length) return base;
  const lowest = strokes.reduce(
    (max, s) => Math.max(max, ...(s.points || []).map((p) => p[1])),
    0
  );
  if (!Number.isFinite(lowest) || lowest <= 0) return base;
  return Math.max(base, Math.ceil(lowest * base + 0.08));
}
