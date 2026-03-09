import type { AnimatableValue, FilterConfig } from '../types';

export function invert(amount: AnimatableValue<number>): FilterConfig {
  return {
    resolve: (frame) => {
      const value = typeof amount === 'function' ? amount(frame) : amount;
      return `invert(${value})`;
    },
  };
}
