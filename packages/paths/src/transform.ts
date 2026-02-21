import { readPath, writePath } from './read-path';

/**
 * Scale a path by the given factors.
 */
export function resizePath(d: string, scaleX: number, scaleY?: number): string {
  const sy = scaleY ?? scaleX;
  const segments = readPath(d);

  const scaled = segments.map((seg) => {
    const values = [...seg.values];

    switch (seg.command) {
      case 'M':
      case 'L':
        values[0] *= scaleX;
        values[1] *= sy;
        break;
      case 'C':
        values[0] *= scaleX; values[1] *= sy;
        values[2] *= scaleX; values[3] *= sy;
        values[4] *= scaleX; values[5] *= sy;
        break;
      case 'Q':
        values[0] *= scaleX; values[1] *= sy;
        values[2] *= scaleX; values[3] *= sy;
        break;
      case 'A':
        values[0] *= scaleX;  // rx
        values[1] *= sy;      // ry
        values[5] *= scaleX;  // end x
        values[6] *= sy;      // end y
        break;
    }

    return { command: seg.command, values };
  });

  return writePath(scaled);
}

/**
 * Translate a path by the given offsets.
 */
export function movePath(d: string, dx: number, dy: number): string {
  const segments = readPath(d);

  const moved = segments.map((seg) => {
    const values = [...seg.values];

    switch (seg.command) {
      case 'M':
      case 'L':
        values[0] += dx;
        values[1] += dy;
        break;
      case 'C':
        values[0] += dx; values[1] += dy;
        values[2] += dx; values[3] += dy;
        values[4] += dx; values[5] += dy;
        break;
      case 'Q':
        values[0] += dx; values[1] += dy;
        values[2] += dx; values[3] += dy;
        break;
      case 'A':
        values[5] += dx;  // end x
        values[6] += dy;  // end y
        break;
    }

    return { command: seg.command, values };
  });

  return writePath(moved);
}

/**
 * Reverse the direction of a path.
 */
export function flipPath(d: string): string {
  const segments = readPath(d);
  if (segments.length === 0) return d;

  // Collect all endpoints in order
  const points: { x: number; y: number }[] = [];
  let cx = 0;
  let cy = 0;

  for (const seg of segments) {
    switch (seg.command) {
      case 'M':
      case 'L':
        cx = seg.values[0];
        cy = seg.values[1];
        break;
      case 'C':
        cx = seg.values[4];
        cy = seg.values[5];
        break;
      case 'Q':
        cx = seg.values[2];
        cy = seg.values[3];
        break;
      case 'A':
        cx = seg.values[5];
        cy = seg.values[6];
        break;
    }
    points.push({ x: cx, y: cy });
  }

  // Build reversed path using line segments
  const reversed = points.reverse();
  const parts = [`M ${r(reversed[0].x)} ${r(reversed[0].y)}`];
  for (let i = 1; i < reversed.length; i++) {
    parts.push(`L ${r(reversed[i].x)} ${r(reversed[i].y)}`);
  }

  // If original ended with Z, close the reversed path too
  if (segments[segments.length - 1].command === 'Z') {
    parts.push('Z');
  }

  return parts.join(' ');
}

function r(n: number): string {
  return String(Math.round(n * 1000) / 1000);
}
