import type { FilterConfig } from '../types';
import { sepia } from '../filters/sepia';
import { saturate } from '../filters/saturate';
import { contrast } from '../filters/contrast';
import { blur } from '../filters/blur';

export interface VintageEffectOptions {
  intensity?: number;
}

export function vintageEffect({
  intensity = 1,
}: VintageEffectOptions = {}): FilterConfig[] {
  return [
    sepia(0.4 * intensity),
    saturate(1 - 0.3 * intensity),
    contrast(1.1),
    blur(0.3 * intensity),
  ];
}
