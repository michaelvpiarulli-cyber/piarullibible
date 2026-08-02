import { useCallback, useEffect, useRef, useState } from 'react';
import { PAGE_RATIO, pagesNeededForInk } from './padMetrics';
import { paintStroke, pressureOf, r3, strokeNear } from './strokes';

export { PAGE_RATIO, pagesNeededForInk } from './padMetrics';

const INKS = [
  { id: 'ink', value: '#2e2e2e', label: 'Black' },
  { id: 'navy', value: '#3e5782', label: 'Navy' },
  { id: 'red', value: '#a33', label: 'Red' },
  { id: 'green', value: '#4a7c59', label: 'Green' },
];

const NIBS = [
  { id: 'fine', label: 'Fine', width: 0.0035 },
  { id: 'medium', label: 'Medium', width: 0.006 },
  { id: 'bold', label: 'Bold', width: 0.011 },
];

/** True stylus / Apple Pencil. Fingers are `touch`; desktop testing keeps `mouse`. */
function isInkPointer(e) {
  return e.pointerType === 'pen' || e.pointerType === 'mouse';
}

function scaleStrokeY(stroke, scale) {
  return {
    ...stroke,
    points: stroke.points.map(([x, y, press]) => [x, r3(y * scale), press ?? 0.5]),
  };
}

/**
 * A ruled handwriting surface for Apple Pencil (and mouse on desktop).
 * Fingers only scroll — they never ink, so a resting palm won't freak out the page.
 *
 * Controlled: `strokes` / `pages` in, `onChange` / `onPagesChange` out, so the
 * ink and extra ruled space save with the sermon.
 */
export default function SketchPad({
  strokes,
  onChange,
  pages: pagesProp,
  onPagesChange,
  expanded = false,
}) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);
  const sheetRef = useRef(null);

  const [tool, setTool] = useState({ mode: 'pen', color: INKS[0].value, width: NIBS[0].width });
  const [pagesLocal, setPagesLocal] = useState(() => pagesNeededForInk(strokes, 1));

  const controlled = typeof pagesProp === 'number' && pagesProp >= 1;
  const pages = controlled ? pagesProp : pagesLocal;

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const draftRef = useRef(null);
  const activePointerRef = useRef(null); // only this pointer may extend/end the stroke
  const toolRef = useRef(tool);
  toolRef.current = tool;
  const pagesRef = useRef(pages);
  pagesRef.current = pages;

  /**
   * Grow the ruled pad. Because stroke y is normalized to the full canvas,
   * existing ink must be rescaled so it stays put when height increases.
   */
  const growPages = useCallback(
    (target) => {
      const current = pagesRef.current;
      const next = Math.max(1, target);
      if (next === current) return;

      if (next > current) {
        const scale = current / next;
        if (draftRef.current) draftRef.current = scaleStrokeY(draftRef.current, scale);
        if (strokesRef.current.length) {
          onChange(strokesRef.current.map((s) => scaleStrokeY(s, scale)));
        }
      }

      pagesRef.current = next;
      if (onPagesChange) onPagesChange(next);
      if (!controlled) setPagesLocal(next);
    },
    [controlled, onChange, onPagesChange]
  );

  // Keep local pages in sync when the parent loads a different note.
  useEffect(() => {
    if (controlled) return;
    setPagesLocal((prev) => pagesNeededForInk(strokes, prev));
  }, [strokes, controlled]);

  // Grow the pad automatically if ink approaches the bottom.
  useEffect(() => {
    const needed = pagesNeededForInk(strokes, pages);
    if (needed > pages) growPages(needed);
  }, [strokes, pages, growPages]);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = c.width / dpr;
    const h = c.height / dpr;
    ctx.clearRect(0, 0, w, h);
    for (const s of strokesRef.current) paintStroke(ctx, s, w, h);
    if (draftRef.current) paintStroke(ctx, draftRef.current, w, h);
  }, []);

  useEffect(() => {
    const c = canvasRef.current;
    const wrap = wrapRef.current;
    if (!c || !wrap) return;

    const fit = () => {
      const w = wrap.clientWidth;
      const h = wrap.clientHeight;
      if (!w || !h) return;
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const nextW = Math.round(w * dpr);
      const nextH = Math.round(h * dpr);
      // Avoid wiping the bitmap when iOS fires spurious resize with same size.
      if (c.width !== nextW || c.height !== nextH) {
        c.width = nextW;
        c.height = nextH;
      }
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      redraw();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    // iPad Safari address-bar / split-view changes often skip ResizeObserver.
    window.visualViewport?.addEventListener('resize', fit);
    window.addEventListener('orientationchange', fit);
    return () => {
      ro.disconnect();
      window.visualViewport?.removeEventListener('resize', fit);
      window.removeEventListener('orientationchange', fit);
    };
  }, [redraw, pages, expanded]);

  useEffect(redraw, [strokes, redraw]);

  const toNorm = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const eraseAt = (x, y) => {
    const hit = strokesRef.current.filter((s) => strokeNear(s, x, y));
    if (hit.length) onChange(strokesRef.current.filter((s) => !hit.includes(s)));
  };

  const endStroke = (e) => {
    // Palm / finger up must not finish (or wipe) an Apple Pencil stroke.
    if (activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    try {
      e.currentTarget.releasePointerCapture?.(e.pointerId);
    } catch {
      /* already released */
    }
    const d = draftRef.current;
    draftRef.current = null;
    if (d) onChange([...strokesRef.current, d]);
    else redraw();
  };

  const onPointerDown = (e) => {
    if (!isInkPointer(e)) return;
    // One stroke at a time — ignore a second pen/mouse while drawing.
    if (activePointerRef.current != null) return;
    // Stop iPad from treating the Pencil stroke as a scroll/zoom gesture.
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* synthetic or already-released pointer */
    }
    activePointerRef.current = e.pointerId;
    const { x, y } = toNorm(e);
    const t = toolRef.current;
    if (t.mode === 'erase') {
      eraseAt(x, y);
      return;
    }
    draftRef.current = {
      type: 'draw',
      color: t.color,
      width: t.width,
      points: [[r3(x), r3(y), pressureOf(e)]],
    };
    redraw();
  };

  const onPointerMove = (e) => {
    if (activePointerRef.current !== e.pointerId) return;
    if (!e.buttons) return;
    // Keep Pencil strokes from scrolling the page underneath.
    e.preventDefault();
    const { x, y } = toNorm(e);
    if (toolRef.current.mode === 'erase') return eraseAt(x, y);
    const d = draftRef.current;
    if (!d) return;
    const last = d.points[d.points.length - 1];
    if (Math.hypot(x - last[0], y - last[1]) < 0.0015) return; // downsample
    d.points.push([r3(x), r3(y), pressureOf(e)]);
    redraw();
  };

  const addSpace = () => {
    growPages(pagesRef.current + 1);
    // After layout, scroll so the new ruled area is visible.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const sheet = sheetRef.current;
        if (!sheet) return;
        const scroller =
          sheet.closest('.notes-overlay-body') ||
          sheet.closest('.app-main') ||
          sheet.parentElement;
        if (scroller && typeof scroller.scrollTo === 'function') {
          scroller.scrollTo({ top: scroller.scrollHeight, behavior: 'smooth' });
        } else {
          sheet.scrollIntoView({ block: 'end', behavior: 'smooth' });
        }
      });
    });
  };

  return (
    <div className={`sketch${expanded ? ' expanded' : ''}`}>
      <div className="ink-bar">
        <div className="ink-group" role="group" aria-label="Ink color">
          {INKS.map((c) => (
            <button
              key={c.id}
              type="button"
              className={`ink-swatch${tool.color === c.value && tool.mode !== 'erase' ? ' active' : ''}`}
              style={{ background: c.value }}
              aria-label={c.label}
              onClick={() =>
                setTool((t) => ({ ...t, color: c.value, mode: t.mode === 'erase' ? 'pen' : t.mode }))
              }
            />
          ))}
        </div>

        <div className="ink-group" role="group" aria-label="Pen size">
          {NIBS.map((n) => (
            <button
              key={n.id}
              type="button"
              className={`ink-tool${tool.width === n.width && tool.mode !== 'erase' ? ' active' : ''}`}
              onClick={() => setTool((t) => ({ ...t, width: n.width, mode: 'pen' }))}
            >
              {n.label}
            </button>
          ))}
          <button
            type="button"
            className={`ink-tool${tool.mode === 'erase' ? ' active' : ''}`}
            onClick={() => setTool((t) => ({ ...t, mode: t.mode === 'erase' ? 'pen' : 'erase' }))}
          >
            Erase
          </button>
        </div>

        <div className="ink-group">
          <button
            type="button"
            className="ink-tool"
            onClick={() => onChange(strokes.slice(0, -1))}
            disabled={!strokes.length}
          >
            Undo
          </button>
        </div>
      </div>

      {!expanded && (
        <p className="sketch-hint">Apple Pencil only — rest your hand; fingers just scroll.</p>
      )}

      <div className="sketch-sheet" ref={sheetRef}>
        <div
          ref={wrapRef}
          className="sketch-page"
          style={{ paddingBottom: `${PAGE_RATIO * 100 * pages}%` }}
        >
          <canvas
            ref={canvasRef}
            className="sketch-canvas"
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={endStroke}
            onPointerCancel={endStroke}
          />
        </div>

        <button type="button" className="btn-secondary add-page" onClick={addSpace}>
          Add space below
        </button>
      </div>
    </div>
  );
}
