import type { AnimatableValue, FilterConfig } from '../types';

export function blur(radiusPx: AnimatableValue<number>): FilterConfig {
  return {
    resolve: (frame) => {
      const value = typeof radiusPx === 'function' ? radiusPx(frame) : radiusPx;
      return `blur(${value}px)`;
    },
  };
}
