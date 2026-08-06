import { useCallback, useEffect, useRef } from 'react';
import { useChapterDrawing } from '../hooks/useDrawings';
import { paintStroke, pressureOf, r3, strokeNear } from './ink/strokes';

/** True stylus / Apple Pencil. Fingers are `touch`; desktop testing keeps `mouse`. */
function isInkPointer(e) {
  return e.pointerType === 'pen' || e.pointerType === 'mouse';
}

/** Walk up for the element that actually scrolls (study overlay, app main, etc.). */
function findScroller(from) {
  let el = from?.parentElement || null;
  while (el && el !== document.documentElement) {
    if (
      el.classList?.contains('study-overlay-body') ||
      el.classList?.contains('notes-overlay-body') ||
      el.classList?.contains('app-main')
    ) {
      return el;
    }
    const style = window.getComputedStyle(el);
    const oy = style.overflowY;
    if (
      (oy === 'auto' || oy === 'scroll' || oy === 'overlay') &&
      el.scrollHeight > el.clientHeight + 1
    ) {
      return el;
    }
    el = el.parentElement;
  }
  return document.scrollingElement;
}

/**
 * Ink is stored relative to the scripture text box (.reader-body), not the
 * outer page. That way expand ↔ collapse keeps underlines on the same words
 * even when study mode adds side margins or a tall sheet.
 */
function bodyEl(canvas) {
  return canvas?.parentElement?.querySelector('.reader-body') || null;
}

function clientToBodyNorm(clientX, clientY, body) {
  const br = body.getBoundingClientRect();
  if (!br.width || !br.height) return { x: 0, y: 0 };
  return {
    x: (clientX - br.left) / br.width,
    y: (clientY - br.top) / br.height,
  };
}

function mapStrokeToCanvas(stroke, body, canvas) {
  const br = body.getBoundingClientRect();
  const cr = canvas.getBoundingClientRect();
  if (!br.width || !br.height || !cr.width || !cr.height) return stroke;

  const points = stroke.points.map((pt) => {
    const [x, y, press] = pt;
    const absX = br.left + x * br.width;
    const absY = br.top + y * br.height;
    const nx = (absX - cr.left) / cr.width;
    const ny = (absY - cr.top) / cr.height;
    return press === undefined ? [nx, ny] : [nx, ny, press];
  });

  // Width is stored as a fraction of the text box; paintStroke multiplies by canvas width.
  const width = stroke.width * (br.width / cr.width);
  return { ...stroke, points, width };
}

export default function DrawCanvas({ chapterKey, active, tool, registerApi }) {
  const canvasRef = useRef(null);
  const [strokes, saveStrokes] = useChapterDrawing(chapterKey);

  const strokesRef = useRef(strokes);
  strokesRef.current = strokes;
  const draftRef = useRef(null); // stroke in progress (body-normalized)
  const activePointerRef = useRef(null);
  const fingerScrollRef = useRef(null);
  const toolRef = useRef(tool);
  toolRef.current = tool;

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const body = bodyEl(c);
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = c.width / dpr;
    const h = c.height / dpr;
    ctx.clearRect(0, 0, w, h);

    const paint = (stroke) => {
      if (!stroke) return;
      const mapped = body ? mapStrokeToCanvas(stroke, body, c) : stroke;
      paintStroke(ctx, mapped, w, h);
    };

    for (const s of strokesRef.current) paint(s);
    if (draftRef.current) paint(draftRef.current);
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
    const body = bodyEl(c);
    if (body) ro.observe(body);
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

  /*
   * touch-action:none kills native scroll on the canvas (needed so Pencil
   * doesn’t drag the page). Block residual touchmove while inking, and drive
   * finger pans ourselves against the scroll parent.
   */
  useEffect(() => {
    const c = canvasRef.current;
    if (!c || !active) return;
    const blockWhileInking = (e) => {
      if (activePointerRef.current != null) e.preventDefault();
    };
    c.addEventListener('touchstart', blockWhileInking, { passive: false });
    c.addEventListener('touchmove', blockWhileInking, { passive: false });
    return () => {
      c.removeEventListener('touchstart', blockWhileInking);
      c.removeEventListener('touchmove', blockWhileInking);
    };
  }, [active]);

  const toNorm = (e) => {
    const c = canvasRef.current;
    const body = bodyEl(c);
    if (body) return clientToBodyNorm(e.clientX, e.clientY, body);
    const rect = c.getBoundingClientRect();
    return {
      x: (e.clientX - rect.left) / rect.width,
      y: (e.clientY - rect.top) / rect.height,
    };
  };

  const eraseAt = (x, y) => {
    const near = strokesRef.current.filter((s) => strokeNear(s, x, y));
    if (near.length) saveStrokes(strokesRef.current.filter((s) => !near.includes(s)));
  };

  const releasePointer = (target, pointerId) => {
    try {
      target.releasePointerCapture?.(pointerId);
    } catch {
      /* already released */
    }
  };

  const endStroke = (e) => {
    if (fingerScrollRef.current?.pointerId === e.pointerId) {
      fingerScrollRef.current = null;
      releasePointer(e.currentTarget, e.pointerId);
      return;
    }
    // Palm / finger up must not finish (or wipe) an Apple Pencil stroke.
    if (activePointerRef.current !== e.pointerId) return;
    activePointerRef.current = null;
    e.currentTarget.classList.remove('is-inking');
    releasePointer(e.currentTarget, e.pointerId);

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
    if (!active) return;

    // Finger → pan the real scroll parent (canvas has touch-action: none).
    if (e.pointerType === 'touch') {
      if (activePointerRef.current != null) {
        // Palm while Pencil is down — swallow so it can’t scroll.
        e.preventDefault();
        return;
      }
      const scroller = findScroller(e.currentTarget);
      if (!scroller) return;
      fingerScrollRef.current = { pointerId: e.pointerId, y: e.clientY, scroller };
      try {
        e.currentTarget.setPointerCapture(e.pointerId);
      } catch {
        /* ignore */
      }
      return;
    }

    if (!isInkPointer(e)) return;
    if (activePointerRef.current != null) return;
    // Stop iPad from treating the Pencil stroke as a scroll/zoom gesture.
    e.preventDefault();
    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      /* pointer already released, or a synthetic event — drawing still works */
    }
    activePointerRef.current = e.pointerId;
    e.currentTarget.classList.add('is-inking');
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
    if (!active) return;

    const finger = fingerScrollRef.current;
    if (finger?.pointerId === e.pointerId) {
      e.preventDefault();
      const dy = finger.y - e.clientY;
      finger.y = e.clientY;
      finger.scroller.scrollTop += dy;
      return;
    }

    if (activePointerRef.current !== e.pointerId) return;
    e.preventDefault();
    if (e.buttons === 0 && e.pointerType === 'mouse') return;
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
