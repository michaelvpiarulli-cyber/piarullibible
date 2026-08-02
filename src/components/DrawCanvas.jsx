import { useCallback, useEffect, useRef } from 'react';
import { useChapterDrawing } from '../hooks/useDrawings';
import { paintStroke, pressureOf, r3, strokeNear } from './ink/strokes';

/** True stylus / Apple Pencil. Fingers are `touch`; desktop testing keeps `mouse`. */
function isInkPointer(e) {
  return e.pointerType === 'pen' || e.pointerType === 'mouse';
}

export default function DrawCanvas({ chapterKey, active, tool, registerApi }) {
  const canvasRef = useRef(null);
  const [strokes, saveStrokes] = useChapterDrawing(chapterKey);

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const draftRef = useRef(null); // stroke in progress
  const activePointerRef = useRef(null);
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
    const near = strokesRef.current.filter((s) => strokeNear(s, x, y));
    if (near.length) saveStrokes(strokesRef.current.filter((s) => !near.includes(s)));
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

  const onPointerDown = (e) => {
    if (!active || !isInkPointer(e)) return;
    if (activePointerRef.current != null) return;
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released, or a synthetic event — drawing still works */
    }
    activePointerRef.current = e.pointerId;
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
    if (!active || activePointerRef.current !== e.pointerId || !e.buttons) return;
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

  return (
    <canvas
      ref={canvasRef}
      className={`draw-canvas${active ? ' active' : ''}`}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endStroke}
      onPointerCancel={endStroke}
    />
  );
}
