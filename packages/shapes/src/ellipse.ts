import type { ShapeResult } from './types';

export interface ShapeEllipseOptions {
  rx: number;
  ry: number;
}

export function shapeEllipse({ rx, ry }: ShapeEllipseOptions): ShapeResult {
  if (rx <= 0 || ry <= 0) {
    throw new Error('shapeEllipse: rx and ry must be positive');
  }

  const w = rx * 2;
  const h = ry * 2;
  const cx = rx;
  const cy = ry;

  const d = [
    `M ${cx} ${cy - ry}`,
    `A ${rx} ${ry} 0 1 1 ${cx} ${cy + ry}`,
    `A ${rx} ${ry} 0 1 1 ${cx} ${cy - ry}`,
    'Z',
  ].join(' ');

  return {
    d,
    width: w,
    height: h,
    viewBox: `0 0 ${w} ${h}`,
  };
}
