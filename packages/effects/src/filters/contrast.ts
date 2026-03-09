import type { AnimatableValue, FilterConfig } from '../types';

export function contrast(amount: AnimatableValue<number>): FilterConfig {
  return {
    resolve: (frame) => {
      const value = typeof amount === 'function' ? amount(frame) : amount;
      return `contrast(${value})`;
    },
  };
}
