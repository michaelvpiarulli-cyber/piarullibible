/**
 * Shared ink rendering for the scripture margin canvas and the sermon sketch pad.
 *
 * A stroke is { type, color, width, points }. Coordinates and width are stored
 * as proportions of the canvas box (0–1) so ink scales with the container
 * instead of being pinned to pixels.
 */

export const r3 = (n) => Math.round(n * 1000) / 1000;

/** Mouse reports 0 or 0.5; a real stylus reports true pressure. */
export const pressureOf = (e) => (e.pressure > 0 && e.pressure < 1 ? e.pressure : 0.5);

export function paintStroke(ctx, s, w, h) {
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

/** True when a stroke passes near a point — used by the eraser. */
export function strokeNear(s, x, y, tol = 0.02) {
  if (s.type === 'ellipse') {
    const [[x0, y0], [x1, y1]] = s.points;
    return (
      x >= Math.min(x0, x1) - tol &&
      x <= Math.max(x0, x1) + tol &&
      y >= Math.min(y0, y1) - tol &&
      y <= Math.max(y0, y1) + tol
    );
  }
  return s.points.some((p) => Math.hypot(p[0] - x, p[1] - y) < tol);
}
