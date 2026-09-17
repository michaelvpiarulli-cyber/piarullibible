/**
 * Shared ink rendering for the scripture margin canvas and the sermon sketch pad.
 *
 * A stroke is { type, color, width, points }. Coordinates and width are stored
 * as proportions of the canvas box (0–1) so ink scales with the container
 * instead of being pinned to pixels.
 *
 * Points are [x, y, pressure]. Rendering uses quadratic midpoints for smooth
 * curves and pressure-scaled width. Capture helpers pull coalesced + predicted
 * samples from Pointer Events for denser, lower-latency Pencil input.
 */

export const r3 = (n) => Math.round(n * 1000) / 1000;

/** Prefer real stylus pressure; fall back for mouse / flaky 0–1 edges. */
export function pressureOf(e) {
  const p = e?.pressure;
  if (typeof p !== 'number' || Number.isNaN(p)) return 0.5;
  // Many mice report 0 or 0.5; treat exact 0 as unknown unless it's a pen.
  if (e.pointerType === 'pen') return Math.min(1, Math.max(0.05, p || 0.5));
  if (p > 0 && p < 1) return p;
  return 0.5;
}

/** Light EMA so pressure changes don’t stair-step the nib. */
export function smoothPressure(prev, next, alpha = 0.4) {
  if (typeof prev !== 'number') return next;
  return prev + (next - prev) * alpha;
}

/**
 * Dense samples from a pointermove: coalesced (real) then predicted (live only).
 * `toNorm(ev)` must return { x, y } in the surface’s normalized space.
 */
export function pointerSamples(e, toNorm) {
  const samples = [];
  let coalesced = null;
  try {
    coalesced = typeof e.getCoalescedEvents === 'function' ? e.getCoalescedEvents() : null;
  } catch {
    coalesced = null;
  }
  const real = coalesced?.length ? coalesced : [e];
  for (const ev of real) {
    const { x, y } = toNorm(ev);
    samples.push({ x, y, pressure: pressureOf(ev), predicted: false });
  }

  try {
    if (typeof e.getPredictedEvents === 'function') {
      for (const ev of e.getPredictedEvents()) {
        const { x, y } = toNorm(ev);
        samples.push({ x, y, pressure: pressureOf(ev), predicted: true });
      }
    }
  } catch {
    /* Safari versions without prediction */
  }
  return samples;
}

/**
 * Append real (non-predicted) samples onto a stroke’s points array.
 * Returns the updated pressure EMA for the next move.
 */
export function appendInkPoints(points, samples, pressureEma, minDist = 0.0007) {
  let press = typeof pressureEma === 'number' ? pressureEma : points[points.length - 1]?.[2] ?? 0.5;
  let added = 0;
  for (const s of samples) {
    if (s.predicted) continue;
    press = smoothPressure(press, s.pressure);
    const last = points[points.length - 1];
    if (last && Math.hypot(s.x - last[0], s.y - last[1]) < minDist) {
      // Refresh pressure on the last point so heavy presses still register.
      last[2] = r3(press);
      continue;
    }
    points.push([r3(s.x), r3(s.y), r3(press)]);
    added += 1;
  }
  return { pressure: press, added };
}

/** Build a temporary stroke that includes predicted tail points (not persisted). */
export function withPredictedTail(stroke, samples) {
  if (!stroke || stroke.type === 'ellipse') return stroke;
  const predicted = samples.filter((s) => s.predicted);
  if (!predicted.length) return stroke;
  const press = stroke.points[stroke.points.length - 1]?.[2] ?? 0.5;
  return {
    ...stroke,
    points: [
      ...stroke.points,
      ...predicted.map((s) => [r3(s.x), r3(s.y), r3(smoothPressure(press, s.pressure))]),
    ],
  };
}

/** Prefer a low-latency 2D context when the browser supports it. */
export function getInkContext(canvas) {
  if (!canvas) return null;
  try {
    return (
      canvas.getContext('2d', { desynchronized: true, alpha: true }) ||
      canvas.getContext('2d')
    );
  } catch {
    return canvas.getContext('2d');
  }
}

/**
 * Paint a stroke with quadratic midpoint smoothing (and pressure width).
 * Falls back to dots / ellipses for single points and circle tool.
 */
export function paintStroke(ctx, s, w, h) {
  const pts = s.points;
  if (!pts || !pts.length) return;

  ctx.strokeStyle = s.color;
  ctx.fillStyle = s.color;
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
    const p = pts[0][2] ?? 0.5;
    ctx.beginPath();
    ctx.arc(pts[0][0] * w, pts[0][1] * h, (base * (0.45 + p)) / 2, 0, Math.PI * 2);
    ctx.fill();
    return;
  }

  if (pts.length === 2) {
    const [x0, y0, p0 = 0.5] = pts[0];
    const [x1, y1, p1 = 0.5] = pts[1];
    ctx.lineWidth = base * (0.4 + (p0 + p1) / 2);
    ctx.beginPath();
    ctx.moveTo(x0 * w, y0 * h);
    ctx.lineTo(x1 * w, y1 * h);
    ctx.stroke();
    return;
  }

  // Midpoint quadratic smoothing — curves through sample midpoints with each
  // raw point as a control handle. Variable width from averaged pressure.
  let midX = ((pts[0][0] + pts[1][0]) / 2) * w;
  let midY = ((pts[0][1] + pts[1][1]) / 2) * h;
  ctx.lineWidth = base * (0.4 + ((pts[0][2] ?? 0.5) + (pts[1][2] ?? 0.5)) / 2);
  ctx.beginPath();
  ctx.moveTo(pts[0][0] * w, pts[0][1] * h);
  ctx.lineTo(midX, midY);
  ctx.stroke();

  for (let i = 1; i < pts.length - 1; i++) {
    const [x, y, p0 = 0.5] = pts[i];
    const p1 = pts[i + 1][2] ?? 0.5;
    const nextMidX = ((pts[i][0] + pts[i + 1][0]) / 2) * w;
    const nextMidY = ((pts[i][1] + pts[i + 1][1]) / 2) * h;
    ctx.lineWidth = base * (0.4 + (p0 + p1) / 2);
    ctx.beginPath();
    ctx.moveTo(midX, midY);
    ctx.quadraticCurveTo(x * w, y * h, nextMidX, nextMidY);
    ctx.stroke();
    midX = nextMidX;
    midY = nextMidY;
  }

  const last = pts[pts.length - 1];
  const prev = pts[pts.length - 2];
  ctx.lineWidth = base * (0.4 + ((prev[2] ?? 0.5) + (last[2] ?? 0.5)) / 2);
  ctx.beginPath();
  ctx.moveTo(midX, midY);
  ctx.lineTo(last[0] * w, last[1] * h);
  ctx.stroke();
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
