import { describe, it, expect } from 'vitest';
import { spring } from '../animation/spring';
import { getSpringDuration } from '../animation/measure-spring';

describe('spring', () => {
  it('starts at the from value at frame 0', () => {
    const value = spring({ frame: 0, fps: 30, from: 0, to: 1 });
    expect(value).toBe(0);
  });

  it('converges to the target value', () => {
    const value = spring({ frame: 100, fps: 30, from: 0, to: 1 });
    expect(value).toBeCloseTo(1, 2);
  });

  it('respects the from and to parameters', () => {
    const value = spring({ frame: 100, fps: 30, from: 10, to: 20 });
    expect(value).toBeCloseTo(20, 1);
  });

  it('returns from value for negative frames', () => {
    const value = spring({ frame: -5, fps: 30, from: 5, to: 10 });
    expect(value).toBe(5);
  });

  it('returns to value when durationInFrames exceeded', () => {
    const value = spring({
      frame: 50,
      fps: 30,
      from: 0,
      to: 1,
      durationInFrames: 30,
    });
    expect(value).toBe(1);
  });

  it('clamps overshoot when clampOvershoot is true', () => {
    // High stiffness + low damping causes overshoot
    const config = { stiffness: 500, damping: 5, mass: 1, clampOvershoot: true };
    for (let frame = 0; frame <= 60; frame++) {
      const value = spring({ frame, fps: 30, from: 0, to: 1, config });
      expect(value).toBeLessThanOrEqual(1.001);
    }
  });

  it('underdamped spring oscillates', () => {
    const config = { stiffness: 200, damping: 3, mass: 1 };
    const values: number[] = [];
    for (let f = 0; f < 60; f++) {
      values.push(spring({ frame: f, fps: 30, from: 0, to: 1, config }));
    }
    // Should have values above 1 (overshoot) at some point
    expect(values.some((v) => v > 1)).toBe(true);
  });
});

describe('getSpringDuration', () => {
  it('returns frame count for spring to settle', () => {
    const frames = getSpringDuration({ fps: 30 });
    expect(frames).toBeGreaterThan(0);
    expect(frames).toBeLessThan(300);
  });

  it('stiffer springs settle faster', () => {
    const stiff = getSpringDuration({ fps: 30, config: { stiffness: 300, damping: 20 } });
    const soft = getSpringDuration({ fps: 30, config: { stiffness: 50, damping: 20 } });
    expect(stiff).toBeLessThan(soft);
  });
});
