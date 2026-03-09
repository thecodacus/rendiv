import type { FilterConfig } from '../types';
import { brightness } from '../filters/brightness';
import { dropShadow } from '../filters/drop-shadow';

export interface GlowEffectOptions {
  color?: string;
  intensity?: number;
  blur?: number;
}

export function glowEffect({
  color = '#ffffff',
  intensity = 1.2,
  blur: blurRadius = 10,
}: GlowEffectOptions = {}): FilterConfig[] {
  return [
    brightness(intensity),
    dropShadow({ x: 0, y: 0, blur: blurRadius, color }),
    dropShadow({ x: 0, y: 0, blur: blurRadius * 2, color }),
  ];
}
