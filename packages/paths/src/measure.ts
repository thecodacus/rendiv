import type { PathSegment, PointOnPath, Point } from './types';
import { readPath } from './read-path';

/**
 * Calculate the total length of an SVG path.
 */
export function pathLength(d: string): number {
  const segments = readPath(d);
  let total = 0;
  let cx = 0;
  let cy = 0;

  for (const seg of segments) {
    const len = segmentLength(seg, cx, cy);
    total += len;
    const end = segmentEndpoint(seg, cx, cy);
    cx = end.x;
    cy = end.y;
  }

  return total;
}

/**
 * Get the point and angle at a specific length along the path.
 */
export function pointOnPath(d: string, length: number): PointOnPath {
  const segments = readPath(d);
  let remaining = Math.max(0, length);
  let cx = 0;
  let cy = 0;

  for (const seg of segments) {
    const len = segmentLength(seg, cx, cy);

    if (remaining <= len && len > 0) {
      const t = remaining / len;
      const pt = segmentPointAt(seg, cx, cy, t);
      const tangent = segmentTangentAt(seg, cx, cy, t);
      const angle = Math.atan2(tangent.y, tangent.x) * (180 / Math.PI);
      return { x: pt.x, y: pt.y, angle };
    }

    remaining -= len;
    const end = segmentEndpoint(seg, cx, cy);
    cx = end.x;
    cy = end.y;
  }

  // Past the end — return the final point
  return { x: cx, y: cy, angle: 0 };
}

/**
 * Get the tangent vector at a specific length along the path.
 */
export function tangentOnPath(d: string, length: number): Point {
  const segments = readPath(d);
  let remaining = Math.max(0, length);
  let cx = 0;
  let cy = 0;

  for (const seg of segments) {
    const len = segmentLength(seg, cx, cy);

    if (remaining <= len && len > 0) {
      const t = remaining / len;
      return segmentTangentAt(seg, cx, cy, t);
    }

    remaining -= len;
    const end = segmentEndpoint(seg, cx, cy);
    cx = end.x;
    cy = end.y;
  }

  return { x: 1, y: 0 };
}

/**
 * Extract a subpath between two lengths.
 */
export function slicePath(d: string, start: number, end: number): string {
  const total = pathLength(d);
  const s = Math.max(0, Math.min(start, total));
  const e = Math.max(s, Math.min(end, total));

  // Sample the path and reconstruct
  const numSamples = Math.max(2, Math.ceil((e - s) * 2));
  const step = (e - s) / (numSamples - 1);
  const points: Point[] = [];

  for (let i = 0; i < numSamples; i++) {
    const len = s + i * step;
    const pt = pointOnPath(d, len);
    points.push({ x: pt.x, y: pt.y });
  }

  if (points.length < 2) return '';

  const parts = [`M ${r(points[0].x)} ${r(points[0].y)}`];
  for (let i = 1; i < points.length; i++) {
    parts.push(`L ${r(points[i].x)} ${r(points[i].y)}`);
  }

  return parts.join(' ');
}

// --- Internal helpers ---

function segmentEndpoint(seg: PathSegment, cx: number, cy: number): Point {
  switch (seg.command) {
    case 'M':
    case 'L':
      return { x: seg.values[0], y: seg.values[1] };
    case 'C':
      return { x: seg.values[4], y: seg.values[5] };
    case 'Q':
      return { x: seg.values[2], y: seg.values[3] };
    case 'A':
      return { x: seg.values[5], y: seg.values[6] };
    case 'Z':
      return { x: cx, y: cy }; // Z returns to start, handled by caller
    default:
      return { x: cx, y: cy };
  }
}

function segmentLength(seg: PathSegment, cx: number, cy: number): number {
  switch (seg.command) {
    case 'M':
      return 0;
    case 'L':
      return dist(cx, cy, seg.values[0], seg.values[1]);
    case 'C':
      return cubicLength(
        cx, cy,
        seg.values[0], seg.values[1],
        seg.values[2], seg.values[3],
        seg.values[4], seg.values[5],
      );
    case 'Q':
      return quadLength(
        cx, cy,
        seg.values[0], seg.values[1],
        seg.values[2], seg.values[3],
      );
    case 'A':
      return arcLength(cx, cy, seg.values);
    case 'Z':
      return 0;
    default:
      return 0;
  }
}

function segmentPointAt(seg: PathSegment, cx: number, cy: number, t: number): Point {
  switch (seg.command) {
    case 'L':
      return lerp2d(cx, cy, seg.values[0], seg.values[1], t);
    case 'C':
      return cubicPoint(
        cx, cy,
        seg.values[0], seg.values[1],
        seg.values[2], seg.values[3],
        seg.values[4], seg.values[5],
        t,
      );
    case 'Q':
      return quadPoint(
        cx, cy,
        seg.values[0], seg.values[1],
        seg.values[2], seg.values[3],
        t,
      );
    case 'A':
      return arcPoint(cx, cy, seg.values, t);
    default:
      return { x: cx, y: cy };
  }
}

function segmentTangentAt(seg: PathSegment, cx: number, cy: number, t: number): Point {
  const dt = 0.001;
  const t0 = Math.max(0, t - dt);
  const t1 = Math.min(1, t + dt);
  const p0 = segmentPointAt(seg, cx, cy, t0);
  const p1 = segmentPointAt(seg, cx, cy, t1);
  const dx = p1.x - p0.x;
  const dy = p1.y - p0.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return { x: 1, y: 0 };
  return { x: dx / len, y: dy / len };
}

// --- Geometry helpers ---

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x2 - x1;
  const dy = y2 - y1;
  return Math.sqrt(dx * dx + dy * dy);
}

function lerp2d(x1: number, y1: number, x2: number, y2: number, t: number): Point {
  return { x: x1 + (x2 - x1) * t, y: y1 + (y2 - y1) * t };
}

// Cubic bezier point using de Casteljau
function cubicPoint(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
  t: number,
): Point {
  const mt = 1 - t;
  const mt2 = mt * mt;
  const t2 = t * t;
  return {
    x: mt2 * mt * x0 + 3 * mt2 * t * x1 + 3 * mt * t2 * x2 + t2 * t * x3,
    y: mt2 * mt * y0 + 3 * mt2 * t * y1 + 3 * mt * t2 * y2 + t2 * t * y3,
  };
}

// Cubic bezier length via adaptive subdivision
function cubicLength(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  x3: number, y3: number,
): number {
  const steps = 32;
  let length = 0;
  let px = x0;
  let py = y0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const pt = cubicPoint(x0, y0, x1, y1, x2, y2, x3, y3, t);
    length += dist(px, py, pt.x, pt.y);
    px = pt.x;
    py = pt.y;
  }

  return length;
}

// Quadratic bezier point
function quadPoint(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
  t: number,
): Point {
  const mt = 1 - t;
  return {
    x: mt * mt * x0 + 2 * mt * t * x1 + t * t * x2,
    y: mt * mt * y0 + 2 * mt * t * y1 + t * t * y2,
  };
}

// Quadratic bezier length
function quadLength(
  x0: number, y0: number,
  x1: number, y1: number,
  x2: number, y2: number,
): number {
  const steps = 32;
  let length = 0;
  let px = x0;
  let py = y0;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const pt = quadPoint(x0, y0, x1, y1, x2, y2, t);
    length += dist(px, py, pt.x, pt.y);
    px = pt.x;
    py = pt.y;
  }

  return length;
}

// Arc length approximation
function arcLength(cx: number, cy: number, vals: number[]): number {
  const steps = 32;
  let length = 0;
  let px = cx;
  let py = cy;

  for (let i = 1; i <= steps; i++) {
    const t = i / steps;
    const pt = arcPoint(cx, cy, vals, t);
    length += dist(px, py, pt.x, pt.y);
    px = pt.x;
    py = pt.y;
  }

  return length;
}

// Arc point at parameter t using center parameterization
function arcPoint(cx: number, cy: number, vals: number[], t: number): Point {
  const rx = vals[0];
  const ry = vals[1];
  const rotation = (vals[2] * Math.PI) / 180;
  const largeArc = vals[3];
  const sweep = vals[4];
  const ex = vals[5];
  const ey = vals[6];

  if (rx === 0 || ry === 0) {
    return lerp2d(cx, cy, ex, ey, t);
  }

  // Convert endpoint to center parameterization
  const center = endpointToCenter(cx, cy, ex, ey, rx, ry, rotation, largeArc, sweep);

  const angle = center.startAngle + t * center.deltaAngle;
  const cos = Math.cos(rotation);
  const sin = Math.sin(rotation);
  const x = cos * rx * Math.cos(angle) - sin * ry * Math.sin(angle) + center.cx;
  const y = sin * rx * Math.cos(angle) + cos * ry * Math.sin(angle) + center.cy;

  return { x, y };
}

function endpointToCenter(
  x1: number, y1: number,
  x2: number, y2: number,
  rx: number, ry: number,
  phi: number,
  fA: number, fS: number,
): { cx: number; cy: number; startAngle: number; deltaAngle: number } {
  const cosPhi = Math.cos(phi);
  const sinPhi = Math.sin(phi);

  const dx = (x1 - x2) / 2;
  const dy = (y1 - y2) / 2;
  const x1p = cosPhi * dx + sinPhi * dy;
  const y1p = -sinPhi * dx + cosPhi * dy;

  let rxSq = rx * rx;
  let rySq = ry * ry;
  const x1pSq = x1p * x1p;
  const y1pSq = y1p * y1p;

  // Scale radii if needed
  const lambda = x1pSq / rxSq + y1pSq / rySq;
  if (lambda > 1) {
    const sqrtLambda = Math.sqrt(lambda);
    rx = sqrtLambda * rx;
    ry = sqrtLambda * ry;
    rxSq = rx * rx;
    rySq = ry * ry;
  }

  let sq = (rxSq * rySq - rxSq * y1pSq - rySq * x1pSq) / (rxSq * y1pSq + rySq * x1pSq);
  if (sq < 0) sq = 0;
  let root = Math.sqrt(sq);
  if (fA === fS) root = -root;

  const cxp = root * (rx * y1p) / ry;
  const cyp = root * -(ry * x1p) / rx;

  const centerX = cosPhi * cxp - sinPhi * cyp + (x1 + x2) / 2;
  const centerY = sinPhi * cxp + cosPhi * cyp + (y1 + y2) / 2;

  const startAngle = vectorAngle(1, 0, (x1p - cxp) / rx, (y1p - cyp) / ry);
  let deltaAngle = vectorAngle(
    (x1p - cxp) / rx, (y1p - cyp) / ry,
    (-x1p - cxp) / rx, (-y1p - cyp) / ry,
  );

  if (fS === 0 && deltaAngle > 0) deltaAngle -= 2 * Math.PI;
  if (fS === 1 && deltaAngle < 0) deltaAngle += 2 * Math.PI;

  return { cx: centerX, cy: centerY, startAngle, deltaAngle };
}

function vectorAngle(ux: number, uy: number, vx: number, vy: number): number {
  const sign = ux * vy - uy * vx < 0 ? -1 : 1;
  const umag = Math.sqrt(ux * ux + uy * uy);
  const vmag = Math.sqrt(vx * vx + vy * vy);
  const dot = ux * vx + uy * vy;
  let ratio = dot / (umag * vmag);
  ratio = Math.max(-1, Math.min(1, ratio));
  return sign * Math.acos(ratio);
}

function r(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}
