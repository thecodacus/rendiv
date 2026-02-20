import { interpolate, type InterpolateOptions } from './interpolate';

type RGBA = [number, number, number, number];

function hexToRgba(hex: string): RGBA {
  let h = hex.replace('#', '');
  if (h.length === 3) {
    h = h[0] + h[0] + h[1] + h[1] + h[2] + h[2];
  }
  if (h.length === 6) {
    h += 'ff';
  }
  const num = parseInt(h, 16);
  return [
    (num >> 24) & 0xff,
    (num >> 16) & 0xff,
    (num >> 8) & 0xff,
    (num & 0xff) / 255,
  ];
}

function parseRgba(color: string): RGBA {
  const rgbaMatch = color.match(
    /rgba?\(\s*([\d.]+)\s*,\s*([\d.]+)\s*,\s*([\d.]+)(?:\s*,\s*([\d.]+))?\s*\)/
  );
  if (rgbaMatch) {
    return [
      Number(rgbaMatch[1]),
      Number(rgbaMatch[2]),
      Number(rgbaMatch[3]),
      rgbaMatch[4] !== undefined ? Number(rgbaMatch[4]) : 1,
    ];
  }
  throw new Error(`Cannot parse color: ${color}`);
}

const namedColors: Record<string, string> = {
  black: '#000000',
  white: '#ffffff',
  red: '#ff0000',
  green: '#008000',
  blue: '#0000ff',
  yellow: '#ffff00',
  cyan: '#00ffff',
  magenta: '#ff00ff',
  orange: '#ffa500',
  purple: '#800080',
  pink: '#ffc0cb',
  gray: '#808080',
  grey: '#808080',
  transparent: 'rgba(0,0,0,0)',
};

function parseColor(color: string): RGBA {
  const trimmed = color.trim().toLowerCase();

  if (namedColors[trimmed]) {
    const named = namedColors[trimmed];
    if (named.startsWith('#')) return hexToRgba(named);
    return parseRgba(named);
  }

  if (trimmed.startsWith('#')) {
    return hexToRgba(trimmed);
  }

  if (trimmed.startsWith('rgb')) {
    return parseRgba(trimmed);
  }

  throw new Error(`Unsupported color format: ${color}`);
}

function rgbaToString(rgba: RGBA): string {
  const [r, g, b, a] = rgba;
  if (a === 1) {
    return `rgb(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)})`;
  }
  return `rgba(${Math.round(r)}, ${Math.round(g)}, ${Math.round(b)}, ${Number(a.toFixed(3))})`;
}

export function blendColors(
  value: number,
  inputRange: readonly number[],
  outputRange: readonly string[],
  options?: InterpolateOptions
): string {
  if (inputRange.length !== outputRange.length) {
    throw new Error('inputRange and outputRange must have the same length.');
  }

  const parsedColors = outputRange.map(parseColor);

  const r = interpolate(
    value,
    inputRange,
    parsedColors.map((c) => c[0]),
    options
  );
  const g = interpolate(
    value,
    inputRange,
    parsedColors.map((c) => c[1]),
    options
  );
  const b = interpolate(
    value,
    inputRange,
    parsedColors.map((c) => c[2]),
    options
  );
  const a = interpolate(
    value,
    inputRange,
    parsedColors.map((c) => c[3]),
    options
  );

  return rgbaToString([
    Math.max(0, Math.min(255, r)),
    Math.max(0, Math.min(255, g)),
    Math.max(0, Math.min(255, b)),
    Math.max(0, Math.min(1, a)),
  ]);
}
