import type { TextAnimationConfig } from '../types';

const DEFAULT_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';

export interface ScrambleOptions {
  characters?: string;
  durationInFrames?: number;
}

export function scramble({
  characters = DEFAULT_CHARS,
  durationInFrames = 15,
}: ScrambleOptions = {}): TextAnimationConfig {
  return {
    durationInFrames,
    style: (progress) => ({
      opacity: Math.min(progress * 2, 1),
    }),
    renderText: (original, progress, index) => {
      if (progress >= 1) return original;
      if (progress <= 0) return '';

      // Deterministic pseudo-random based on index and progress step
      const step = Math.floor(progress * durationInFrames);
      let result = '';
      for (let i = 0; i < original.length; i++) {
        if (original[i] === ' ') {
          result += ' ';
        } else {
          const hash = ((step * 31 + i * 17 + index * 7) >>> 0) % characters.length;
          result += characters[hash];
        }
      }
      return result;
    },
  };
}
