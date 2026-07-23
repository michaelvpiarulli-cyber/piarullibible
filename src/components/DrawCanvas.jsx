import { useCallback, useEffect, useRef } from 'react';
import { useChapterDrawing } from '../hooks/useDrawings';

const r3 = (n) => Math.round(n * 1000) / 1000;

/** Mouse reports 0 or 0.5; a real stylus reports true pressure. */
const pressureOf = (e) => (e.pressure > 0 && e.pressure < 1 ? e.pressure : 0.5);

function paintStroke(ctx, s, w, h) {
  const pts = s.points;
  if (!pts || !pts.length) return;

  ctx.strokeStyle = s.color;
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';
  const base = Math.max(1, s.width * w);

  if (s.type === 'ellipse') {
    const [[x0, y0], [x1, y1]] = pts;
    const cx = ((x0 + x1) / 2) * w;
    const cy = ((y0 + y1) / 2) * h;
    const rx = (Math.abs(x1 - x0) / 2) * w;
    const ry = (Math.abs(y1 - y0) / 2) * h;
    if (rx < 1 || ry < 1) return;
    ctx.lineWidth = base;
    ctx.beginPath();
    ctx.ellipse(cx, cy, rx, ry, 0, 0, Math.PI * 2);
    ctx.stroke();
    return;
  }

  if (pts.length === 1) {
    ctx.fillStyle = s.color;
    ctx.beginPath();
    ctx.arc(pts[0][0] * w, pts[0][1] * h, base / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  for (let i = 1; i < pts.length; i++) {
    const [x0, y0, p0 = 0.5] = pts[i - 1];
    const [x1, y1, p1 = 0.5] = pts[i];
    ctx.lineWidth = base * (0.45 + (p0 + p1) / 2); // pressure-sensitive
    ctx.beginPath();
    ctx.moveTo(x0 * w, y0 * h);
    ctx.lineTo(x1 * w, y1 * h);
    ctx.stroke();
  }
}

export default function DrawCanvas({ chapterKey, active, tool, fingerDraws, registerApi }) {
  const canvasRef = useRef(null);
  const [strokes, saveStrokes] = useChapterDrawing(chapterKey);

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const draftRef = useRef(null); // stroke in progress
  const toolRef = useRef(tool);
  toolRef.current = tool;

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

  // Match the canvas to its parent box (and stay crisp on retina).
  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const parent = c.parentElement;

    const fit = () => {
      const w = parent.clientWidth;
      const h = parent.clientHeight;
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
    ro.observe(parent);
    return () => ro.disconnect();
  }, [redraw]);

  useEffect(redraw, [strokes, redraw]);

  useEffect(() => {
    if (!registerApi) return;
    registerApi({
      undo: () => saveStrokes(strokesRef.current.slice(0, -1)),
      clear: () => saveStrokes([]),
    });
  }, [registerApi, saveStrokes]);

  const toNorm = (e) => {
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const eraseAt = (x, y) => {
    const near = strokesRef.current.filter((s) => {
      if (s.type === 'ellipse') {
        const [[x0, y0], [x1, y1]] = s.points;
        return (
          x >= Math.min(x0, x1) - 0.01 &&
          x <= Math.max(x0, x1) + 0.01 &&
          y >= Math.min(y0, y1) - 0.01 &&
          y <= Math.max(y0, y1) + 0.01
        );
      }
      return s.points.some((p) => Math.hypot(p[0] - x, p[1] - y) < 0.02);
    });
    if (near.length) saveStrokes(strokesRef.current.filter((s) => !near.includes(s)));
  };

  // When finger-draw is off, touch is left alone so it scrolls the page and
  // only a stylus or mouse puts ink down.
  const ignores = (e) => !fingerDraws && e.pointerType === 'touch';

  const onPointerDown = (e) => {
    if (!active || ignores(e)) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released, or a synthetic event — drawing still works */
    }
    const { x, y } = toNorm(e);
    const t = toolRef.current;

    if (t.mode === 'erase') {
      eraseAt(x, y);
      return;
    }
    draftRef.current =
      t.mode === 'circle'
        ? { type: 'ellipse', color: t.color, width: t.width, points: [[r3(x), r3(y)], [r3(x), r3(y)]] }
        : { type: 'draw', color: t.color, width: t.width, points: [[r3(x), r3(y), pressureOf(e)]] };
    redraw();
  };

  const onPointerMove = (e) => {
    if (!active || !e.buttons || ignores(e)) return;
    const { x, y } = toNorm(e);

    if (toolRef.current.mode === 'erase') {
      eraseAt(x, y);
      return;
    }
    const d = draftRef.current;
    if (!d) return;

    if (d.type === 'ellipse') {
      d.points[1] = [r3(x), r3(y)];
    } else {
      const last = d.points[d.points.length - 1];
      if (Math.hypot(x - last[0], y - last[1]) < 0.002) return; // downsample
      d.points.push([r3(x), r3(y), pressureOf(e)]);
    }
    redraw();
  };

  const onPointerUp = () => {
    const d = draftRef.current;
    draftRef.current = null;
    if (!d) return redraw();

    // Drop accidental taps / zero-size circles.
    const meaningful =
      d.type === 'ellipse'
        ? Math.abs(d.points[1][0] - d.points[0][0]) > 0.01 &&
          Math.abs(d.points[1][1] - d.points[0][1]) > 0.005
        : true;
    if (meaningful) saveStrokes([...strokesRef.current, d]);
    else redraw();
  };

  return (
    <canvas
      ref={canvasRef}
      className={`draw-canvas${active ? ' active' : ''}${fingerDraws ? ' finger-draws' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={onPointerUp}
      onPointerCancel={onPointerUp}
      onPointerLeave={onPointerUp}
    />
  );
}
