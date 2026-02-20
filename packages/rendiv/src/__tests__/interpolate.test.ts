import { describe, it, expect } from 'vitest';
import { interpolate } from '../animation/interpolate';
import { Easing } from '../animation/easing';

describe('interpolate', () => {
  it('linearly maps a value between ranges', () => {
    expect(interpolate(15, [0, 30], [0, 1])).toBeCloseTo(0.5);
    expect(interpolate(0, [0, 30], [0, 1])).toBeCloseTo(0);
    expect(interpolate(30, [0, 30], [0, 1])).toBeCloseTo(1);
  });

  it('handles multi-segment ranges', () => {
    expect(interpolate(5, [0, 10, 20], [0, 100, 200])).toBeCloseTo(50);
    expect(interpolate(15, [0, 10, 20], [0, 100, 200])).toBeCloseTo(150);
  });

  it('extrapolates by default (extend)', () => {
    const result = interpolate(40, [0, 30], [0, 1]);
    expect(result).toBeGreaterThan(1);
  });

  it('clamps when extrapolateLeft is clamp', () => {
    const result = interpolate(-10, [0, 30], [0, 1], {
      extrapolateLeft: 'clamp',
    });
    expect(result).toBe(0);
  });

  it('clamps when extrapolateRight is clamp', () => {
    const result = interpolate(40, [0, 30], [0, 1], {
      extrapolateRight: 'clamp',
    });
    expect(result).toBe(1);
  });

  it('returns identity when extrapolation is identity', () => {
    expect(
      interpolate(-5, [0, 30], [0, 1], { extrapolateLeft: 'identity' })
    ).toBe(-5);
    expect(
      interpolate(50, [0, 30], [0, 1], { extrapolateRight: 'identity' })
    ).toBe(50);
  });

  it('applies easing function', () => {
    const linear = interpolate(15, [0, 30], [0, 1]);
    const eased = interpolate(15, [0, 30], [0, 1], {
      easing: Easing.easeInOut,
    });
    // easeInOut at midpoint should be ~0.5, same as linear
    expect(eased).toBeCloseTo(0.5, 1);
    // But at other points they should differ
    const linearQ = interpolate(8, [0, 30], [0, 1]);
    const easedQ = interpolate(8, [0, 30], [0, 1], {
      easing: Easing.easeInOut,
    });
    expect(easedQ).not.toBeCloseTo(linearQ, 2);
  });

  it('throws on mismatched range lengths', () => {
    expect(() => interpolate(5, [0, 10], [0, 50, 100])).toThrow();
  });

  it('throws on non-monotonic input range', () => {
    expect(() => interpolate(5, [10, 0], [0, 1])).toThrow();
  });

  it('throws on ranges with fewer than 2 elements', () => {
    expect(() => interpolate(5, [0], [0])).toThrow();
  });
});
