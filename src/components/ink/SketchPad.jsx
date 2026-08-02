import { useCallback, useEffect, useRef, useState } from 'react';
import { paintStroke, pressureOf, r3, strokeNear } from './strokes';

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

/** Aspect ratio of one page of the pad (height ÷ width). */
const PAGE_RATIO = 1.15;

/** True stylus / Apple Pencil. Fingers are `touch`; desktop testing keeps `mouse`. */
function isInkPointer(e) {
  return e.pointerType === 'pen' || e.pointerType === 'mouse';
}

/**
 * A ruled handwriting surface for Apple Pencil (and mouse on desktop).
 * Fingers only scroll — they never ink, so a resting palm won't freak out the page.
 *
 * Controlled: `strokes` in, `onChange` out, so the ink saves with whatever
 * record owns it (a sermon) rather than to its own storage.
 */
export default function SketchPad({ strokes, onChange, expanded = false }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const [tool, setTool] = useState({ mode: 'pen', color: INKS[0].value, width: NIBS[0].width });
  const [pages, setPages] = useState(1);

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const draftRef = useRef(null);
  const activePointerRef = useRef(null); // only this pointer may extend/end the stroke
  const toolRef = useRef(tool);
  toolRef.current = tool;

  // Grow the pad automatically if ink approaches the bottom.
  useEffect(() => {
    const lowest = strokes.reduce(
      (max, s) => Math.max(max, ...s.points.map((p) => p[1])),
      0
    );
    const needed = Math.ceil((lowest + 0.06) / (1 / Math.max(pages, 1)));
    if (Number.isFinite(needed) && needed > pages) setPages(needed);
  }, [strokes, pages]);

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
      const dpr = window.devicePixelRatio || 1;
      c.width = Math.round(w * dpr);
      c.height = Math.round(h * dpr);
      c.style.width = `${w}px`;
      c.style.height = `${h}px`;
      redraw();
    };

    fit();
    const ro = new ResizeObserver(fit);
    ro.observe(wrap);
    return () => ro.disconnect();
  }, [redraw, pages]);

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
    const { x, y } = toNorm(e);
    if (toolRef.current.mode === 'erase') return eraseAt(x, y);
    const d = draftRef.current;
    if (!d) return;
    const last = d.points[d.points.length - 1];
    if (Math.hypot(x - last[0], y - last[1]) < 0.0015) return; // downsample
    d.points.push([r3(x), r3(y), pressureOf(e)]);
    redraw();
  };

  return (
    <div className={`sketch${expanded ? ' expanded' : ''}`}>
      <div className="ink-bar">
        <div className="ink-group">
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

        <div className="ink-group">
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

      <div
        ref={wrapRef}
        className="sketch-page"
        style={
          expanded
            ? undefined
            : { paddingBottom: `${PAGE_RATIO * 100 * pages}%` }
        }
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

      <button type="button" className="ink-tool add-page" onClick={() => setPages(pages + 1)}>
        Add space
      </button>
    </div>
  );
}
