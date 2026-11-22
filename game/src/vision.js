// Vision: cones, line of sight and what blocks them.
// A watcher sees the thief only when the thief is inside its cone,
// inside its range, and no wall stands between them.
import { GUARD_VIEW_DIST, GUARD_VIEW_HALF_ANGLE, CAMERA_VIEW_DIST, CAMERA_VIEW_HALF_ANGLE } from './config.js';

function segmentHitsRect(x1, y1, x2, y2, r) {
  // Slab test: does the segment cross the rectangle?
  const dx = x2 - x1;
  const dy = y2 - y1;
  let tmin = 0;
  let tmax = 1;
  for (const [p, q] of [[-dx, x1 - r.x], [dx, r.x + r.w - x1], [-dy, y1 - r.y], [dy, r.y + r.h - y1]]) {
    if (p === 0) {
      if (q < 0) return false;
    } else {
      const t = q / p;
      if (p < 0) {
        if (t > tmax) return false;
        if (t > tmin) tmin = t;
      } else {
        if (t < tmin) return false;
        if (t < tmax) tmax = t;
      }
    }
  }
  return true;
}

export function hasLineOfSight(x1, y1, x2, y2, walls) {
  for (const wall of walls) {
    if (segmentHitsRect(x1, y1, x2, y2, wall)) return false;
  }
  return true;
}

function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

// Returns 0 when the thief is unseen, otherwise a 0..1 strength:
// 1 dead centre of the cone and close, fading toward the rim and range.
export function coneStrength(watcher, tx, ty, walls, isCamera) {
  const dx = tx - watcher.x;
  const dy = ty - watcher.y;
  const dist = Math.hypot(dx, dy);
  const maxDist = isCamera ? CAMERA_VIEW_DIST : GUARD_VIEW_DIST;
  if (dist > maxDist) return 0;
  const halfAngle = isCamera ? CAMERA_VIEW_HALF_ANGLE : GUARD_VIEW_HALF_ANGLE;
  const diff = Math.abs(angleDiff(Math.atan2(dy, dx), watcher.angle));
  if (diff > halfAngle) return 0;
  if (!hasLineOfSight(watcher.x, watcher.y, tx, ty, walls)) return 0;
  const centre = 1 - diff / halfAngle;
  const near = 1 - dist / maxDist;
  return 0.35 + 0.65 * (0.5 * centre + 0.5 * near);
}

export function pointInRect(x, y, r) {
  return x >= r.x && x <= r.x + r.w && y >= r.y && y <= r.y + r.h;
}
