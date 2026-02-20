import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  holdRender,
  releaseRender,
  getPendingHoldCount,
  getPendingHoldLabels,
  _resetPendingHolds,
} from '../delay-render';

beforeEach(() => {
  _resetPendingHolds();
  vi.useRealTimers();
});

describe('holdRender', () => {
  it('returns incrementing handles', () => {
    const h1 = holdRender('first');
    const h2 = holdRender('second');
    expect(h2).toBeGreaterThan(h1);
  });

  it('increments pending hold count', () => {
    expect(getPendingHoldCount()).toBe(0);
    holdRender('test');
    expect(getPendingHoldCount()).toBe(1);
    holdRender('test2');
    expect(getPendingHoldCount()).toBe(2);
  });

  it('works without a label (backward compat)', () => {
    const handle = holdRender();
    expect(getPendingHoldCount()).toBe(1);
    releaseRender(handle);
    expect(getPendingHoldCount()).toBe(0);
  });
});

describe('releaseRender', () => {
  it('clears the handle', () => {
    const handle = holdRender('test');
    expect(getPendingHoldCount()).toBe(1);
    releaseRender(handle);
    expect(getPendingHoldCount()).toBe(0);
  });

  it('throws for unknown handle', () => {
    expect(() => releaseRender(99999)).toThrow(
      'releaseRender() was called with handle 99999',
    );
  });
});

describe('getPendingHoldLabels', () => {
  it('returns labels of all active holds', () => {
    holdRender('alpha');
    holdRender('beta');
    const labels = getPendingHoldLabels();
    expect(labels).toContain('alpha');
    expect(labels).toContain('beta');
    expect(labels).toHaveLength(2);
  });

  it('uses default label when none provided', () => {
    holdRender();
    const labels = getPendingHoldLabels();
    expect(labels).toHaveLength(1);
    expect(labels[0]).toMatch(/^Handle \d+$/);
  });
});

describe('holdRender with timeout', () => {
  it('fires error after timeout', () => {
    vi.useFakeTimers();

    holdRender('slow-resource', { timeoutInMilliseconds: 5000 });
    expect(getPendingHoldCount()).toBe(1);

    expect(() => {
      vi.advanceTimersByTime(5000);
    }).toThrow(/holdRender\(\) timed out after 5000ms/);

    // Handle should be removed after timeout
    expect(getPendingHoldCount()).toBe(0);
  });

  it('release before timeout prevents error', () => {
    vi.useFakeTimers();

    const handle = holdRender('fast-resource', { timeoutInMilliseconds: 5000 });
    releaseRender(handle);

    // Advancing past the timeout should not throw
    vi.advanceTimersByTime(10000);
    expect(getPendingHoldCount()).toBe(0);
  });

  it('does not set timeout when timeoutInMilliseconds is undefined', () => {
    vi.useFakeTimers();

    holdRender('no-timeout');
    expect(getPendingHoldCount()).toBe(1);

    // Advancing timers should not affect the hold
    vi.advanceTimersByTime(100000);
    expect(getPendingHoldCount()).toBe(1);
  });
});
