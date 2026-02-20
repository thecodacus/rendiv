export type EasingFunction = (t: number) => number;

function cubicBezier(
  x1: number,
  y1: number,
  x2: number,
  y2: number
): EasingFunction {
  // Newton-Raphson method to solve cubic bezier for t given x
  const cx = 3 * x1;
  const bx = 3 * (x2 - x1) - cx;
  const ax = 1 - cx - bx;

  const cy = 3 * y1;
  const by = 3 * (y2 - y1) - cy;
  const ay = 1 - cy - by;

  function sampleCurveX(t: number): number {
    return ((ax * t + bx) * t + cx) * t;
  }

  function sampleCurveY(t: number): number {
    return ((ay * t + by) * t + cy) * t;
  }

  function sampleCurveDerivativeX(t: number): number {
    return (3 * ax * t + 2 * bx) * t + cx;
  }

  function solveCurveX(x: number): number {
    let t = x;
    for (let i = 0; i < 8; i++) {
      const currentX = sampleCurveX(t) - x;
      if (Math.abs(currentX) < 1e-7) return t;
      const d = sampleCurveDerivativeX(t);
      if (Math.abs(d) < 1e-7) break;
      t -= currentX / d;
    }

    // Fallback: bisection
    let lo = 0;
    let hi = 1;
    t = x;
    while (lo < hi) {
      const midX = sampleCurveX(t);
      if (Math.abs(midX - x) < 1e-7) return t;
      if (x > midX) lo = t;
      else hi = t;
      t = (lo + hi) / 2;
    }
    return t;
  }

  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    return sampleCurveY(solveCurveX(x));
  };
}

export const Easing = {
  linear: ((t: number) => t) as EasingFunction,
  ease: cubicBezier(0.25, 0.1, 0.25, 1.0),
  easeIn: cubicBezier(0.42, 0, 1.0, 1.0),
  easeOut: cubicBezier(0.0, 0, 0.58, 1.0),
  easeInOut: cubicBezier(0.42, 0, 0.58, 1.0),

  bezier: cubicBezier,

  bounce: ((t: number): number => {
    const n1 = 7.5625;
    const d1 = 2.75;
    if (t < 1 / d1) {
      return n1 * t * t;
    } else if (t < 2 / d1) {
      return n1 * (t -= 1.5 / d1) * t + 0.75;
    } else if (t < 2.5 / d1) {
      return n1 * (t -= 2.25 / d1) * t + 0.9375;
    } else {
      return n1 * (t -= 2.625 / d1) * t + 0.984375;
    }
  }) as EasingFunction,

  elastic: (bounciness: number = 1): EasingFunction => {
    const p = 0.3 / Math.max(bounciness, 0.001);
    return (t: number): number => {
      if (t <= 0) return 0;
      if (t >= 1) return 1;
      return (
        Math.pow(2, -10 * t) *
          Math.sin(((t - p / 4) * (2 * Math.PI)) / p) +
        1
      );
    };
  },

  in: (easing: EasingFunction): EasingFunction => easing,

  out: (easing: EasingFunction): EasingFunction => {
    return (t: number) => 1 - easing(1 - t);
  },

  inOut: (easing: EasingFunction): EasingFunction => {
    return (t: number) =>
      t < 0.5
        ? easing(t * 2) / 2
        : 1 - easing((1 - t) * 2) / 2;
  },
};
