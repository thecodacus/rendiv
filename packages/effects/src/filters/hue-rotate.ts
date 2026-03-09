import type { AnimatableValue, FilterConfig } from '../types';

export function hueRotate(degrees: AnimatableValue<number>): FilterConfig {
  return {
    resolve: (frame) => {
      const value = typeof degrees === 'function' ? degrees(frame) : degrees;
      return `hue-rotate(${value}deg)`;
    },
  };
}
