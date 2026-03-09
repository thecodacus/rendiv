import type { FilterConfig } from '../types';
import { brightness } from '../filters/brightness';
import { contrast } from '../filters/contrast';
import { hueRotate } from '../filters/hue-rotate';
import { saturate } from '../filters/saturate';

export interface NightVisionEffectOptions {
  intensity?: number;
}

export function nightVisionEffect({
  intensity = 1,
}: NightVisionEffectOptions = {}): FilterConfig[] {
  return [
    brightness(1 + 0.5 * intensity),
    contrast(1 + 0.3 * intensity),
    hueRotate(120 * intensity),
    saturate(0.5 + 0.5 * intensity),
  ];
}
