import type { AnimatableValue, FilterConfig } from '../types';

export interface DropShadowConfig {
  x: AnimatableValue<number>;
  y: AnimatableValue<number>;
  blur: AnimatableValue<number>;
  color: AnimatableValue<string>;
}

export function dropShadow(config: DropShadowConfig): FilterConfig {
  return {
    resolve: (frame) => {
      const x = typeof config.x === 'function' ? config.x(frame) : config.x;
      const y = typeof config.y === 'function' ? config.y(frame) : config.y;
      const b = typeof config.blur === 'function' ? config.blur(frame) : config.blur;
      const c = typeof config.color === 'function' ? config.color(frame) : config.color;
      return `drop-shadow(${x}px ${y}px ${b}px ${c})`;
    },
  };
}
