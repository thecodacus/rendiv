import type { AnimatableValue, FilterConfig } from '../types';

export function saturate(amount: AnimatableValue<number>): FilterConfig {
  return {
    resolve: (frame) => {
      const value = typeof amount === 'function' ? amount(frame) : amount;
      return `saturate(${value})`;
    },
  };
}
