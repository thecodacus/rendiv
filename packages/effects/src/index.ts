// Components
export { Effect, type EffectProps } from './effect';

// Types
export type { FilterConfig, AnimatableValue } from './types';

// Filters
export { blur } from './filters/blur';
export { brightness } from './filters/brightness';
export { contrast } from './filters/contrast';
export { saturate } from './filters/saturate';
export { hueRotate } from './filters/hue-rotate';
export { grayscale } from './filters/grayscale';
export { sepia } from './filters/sepia';
export { invert } from './filters/invert';
export { dropShadow, type DropShadowConfig } from './filters/drop-shadow';
export { opacity } from './filters/opacity';

// Filter-only presets
export { glowEffect, type GlowEffectOptions } from './presets/glow-effect';
export { vintageEffect, type VintageEffectOptions } from './presets/vintage-effect';
export { nightVisionEffect, type NightVisionEffectOptions } from './presets/night-vision-effect';

// Component presets
export { VignetteEffect, type VignetteEffectProps } from './presets/vignette-effect';
export { GlitchEffect, type GlitchEffectProps } from './presets/glitch-effect';
export { ChromaEffect, type ChromaEffectProps } from './presets/chroma-effect';
