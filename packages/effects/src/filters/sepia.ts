import type { AnimatableValue, FilterConfig } from '../types';

export function sepia(amount: AnimatableValue<number>): FilterConfig {
  return {
    resolve: (frame) => {
      const value = typeof amount === 'function' ? amount(frame) : amount;
      return `sepia(${value})`;
    },
  };
}
