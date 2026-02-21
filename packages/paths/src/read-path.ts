import type { PathSegment } from './types';

const COMMAND_RE = /([MmLlHhVvCcSsQqTtAaZz])/;
const NUMBER_RE = /[+-]?(?:\d+\.?\d*|\.\d+)(?:[eE][+-]?\d+)?/g;

/**
 * Parse an SVG path `d` string into an array of absolute path segments.
 */
export function readPath(d: string): PathSegment[] {
  const tokens = d.split(COMMAND_RE).filter((s) => s.trim().length > 0);
  const segments: PathSegment[] = [];

  let currentX = 0;
  let currentY = 0;
  let startX = 0;
  let startY = 0;

  for (let i = 0; i < tokens.length; i++) {
    const cmd = tokens[i];
    if (!COMMAND_RE.test(cmd)) continue;

    const paramStr = tokens[i + 1] || '';
    i++;
    const nums = parseNumbers(paramStr);

    const isRelative = cmd === cmd.toLowerCase();
    const absCmd = cmd.toUpperCase();

    switch (absCmd) {
      case 'M': {
        const paramCount = 2;
        for (let j = 0; j < nums.length; j += paramCount) {
          let x = nums[j];
          let y = nums[j + 1];
          if (isRelative) { x += currentX; y += currentY; }
          // First pair is moveTo, subsequent pairs are implicit lineTo
          segments.push({ command: j === 0 ? 'M' : 'L', values: [x, y] });
          currentX = x;
          currentY = y;
          if (j === 0) { startX = x; startY = y; }
        }
        break;
      }
      case 'L': {
        for (let j = 0; j < nums.length; j += 2) {
          let x = nums[j];
          let y = nums[j + 1];
          if (isRelative) { x += currentX; y += currentY; }
          segments.push({ command: 'L', values: [x, y] });
          currentX = x;
          currentY = y;
        }
        break;
      }
      case 'H': {
        for (let j = 0; j < nums.length; j++) {
          let x = nums[j];
          if (isRelative) { x += currentX; }
          segments.push({ command: 'L', values: [x, currentY] });
          currentX = x;
        }
        break;
      }
      case 'V': {
        for (let j = 0; j < nums.length; j++) {
          let y = nums[j];
          if (isRelative) { y += currentY; }
          segments.push({ command: 'L', values: [currentX, y] });
          currentY = y;
        }
        break;
      }
      case 'C': {
        for (let j = 0; j < nums.length; j += 6) {
          const vals = nums.slice(j, j + 6);
          if (isRelative) {
            vals[0] += currentX; vals[1] += currentY;
            vals[2] += currentX; vals[3] += currentY;
            vals[4] += currentX; vals[5] += currentY;
          }
          segments.push({ command: 'C', values: vals });
          currentX = vals[4];
          currentY = vals[5];
        }
        break;
      }
      case 'S': {
        for (let j = 0; j < nums.length; j += 4) {
          const vals = nums.slice(j, j + 4);
          if (isRelative) {
            vals[0] += currentX; vals[1] += currentY;
            vals[2] += currentX; vals[3] += currentY;
          }
          // Reflect previous control point for smooth cubic
          const prev = segments[segments.length - 1];
          let cx1: number, cy1: number;
          if (prev && prev.command === 'C') {
            cx1 = 2 * currentX - prev.values[2];
            cy1 = 2 * currentY - prev.values[3];
          } else {
            cx1 = currentX;
            cy1 = currentY;
          }
          segments.push({ command: 'C', values: [cx1, cy1, vals[0], vals[1], vals[2], vals[3]] });
          currentX = vals[2];
          currentY = vals[3];
        }
        break;
      }
      case 'Q': {
        for (let j = 0; j < nums.length; j += 4) {
          const vals = nums.slice(j, j + 4);
          if (isRelative) {
            vals[0] += currentX; vals[1] += currentY;
            vals[2] += currentX; vals[3] += currentY;
          }
          segments.push({ command: 'Q', values: vals });
          currentX = vals[2];
          currentY = vals[3];
        }
        break;
      }
      case 'T': {
        for (let j = 0; j < nums.length; j += 2) {
          let x = nums[j];
          let y = nums[j + 1];
          if (isRelative) { x += currentX; y += currentY; }
          // Reflect previous control point for smooth quadratic
          const prev = segments[segments.length - 1];
          let cx: number, cy: number;
          if (prev && prev.command === 'Q') {
            cx = 2 * currentX - prev.values[0];
            cy = 2 * currentY - prev.values[1];
          } else {
            cx = currentX;
            cy = currentY;
          }
          segments.push({ command: 'Q', values: [cx, cy, x, y] });
          currentX = x;
          currentY = y;
        }
        break;
      }
      case 'A': {
        for (let j = 0; j < nums.length; j += 7) {
          const rx = Math.abs(nums[j]);
          const ry = Math.abs(nums[j + 1]);
          const rotation = nums[j + 2];
          const largeArc = nums[j + 3] ? 1 : 0;
          const sweep = nums[j + 4] ? 1 : 0;
          let x = nums[j + 5];
          let y = nums[j + 6];
          if (isRelative) { x += currentX; y += currentY; }
          segments.push({ command: 'A', values: [rx, ry, rotation, largeArc, sweep, x, y] });
          currentX = x;
          currentY = y;
        }
        break;
      }
      case 'Z': {
        segments.push({ command: 'Z', values: [] });
        currentX = startX;
        currentY = startY;
        break;
      }
    }
  }

  return segments;
}

/**
 * Serialize an array of path segments back into an SVG path `d` string.
 */
export function writePath(segments: PathSegment[]): string {
  return segments
    .map((seg) => {
      if (seg.values.length === 0) return seg.command;
      return `${seg.command} ${seg.values.map(round).join(' ')}`;
    })
    .join(' ');
}

function parseNumbers(str: string): number[] {
  const matches = str.match(NUMBER_RE);
  return matches ? matches.map(Number) : [];
}

function round(n: number): string {
  const r = Math.round(n * 1000) / 1000;
  return String(r);
}
