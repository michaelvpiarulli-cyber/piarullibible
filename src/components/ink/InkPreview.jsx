import { useCallback, useEffect, useRef } from 'react';
import { paintStroke } from './strokes';

/** Read-only rendering of saved handwriting, sized to fit its container. */
export default function InkPreview({ strokes, ratio = 1.15 }) {
  const canvasRef = useRef(null);
  const wrapRef = useRef(null);

  const redraw = useCallback(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    const w = c.width / dpr;
    const h = c.height / dpr;
    ctx.clearRect(0, 0, w, h);
    for (const s of strokes) paintStroke(ctx, s, w, h);
  }, [strokes]);

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
  }, [redraw]);

  if (!strokes || !strokes.length) return null;

  // Only show as much page as the ink actually uses.
  const lowest = strokes.reduce((max, s) => Math.max(max, ...s.points.map((p) => p[1])), 0);
  const pages = Math.max(1, Math.ceil((lowest + 0.04) / 1));

  return (
    <div
      ref={wrapRef}
      className="sketch-page preview"
      style={{ paddingBottom: `${ratio * 100 * pages}%` }}
    >
      <canvas ref={canvasRef} className="sketch-canvas" />
    </div>
  );
}
