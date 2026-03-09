// Components
export { AnimatedText, type AnimatedTextProps } from './animated-text';

// Types
export type {
  TextAnimationConfig,
  TextAnimationFunction,
  SplitMode,
  SplitUnit,
} from './types';

// Utilities
export { splitText } from './split-text';
export { stagger } from './stagger';

// Presets
export { fadeIn, type FadeInOptions } from './presets/fade-in';
export { slideUp, type SlideUpOptions } from './presets/slide-up';
export { slideDown, type SlideDownOptions } from './presets/slide-down';
export { slideLeft, type SlideLeftOptions } from './presets/slide-left';
export { slideRight, type SlideRightOptions } from './presets/slide-right';
export { scaleIn, type ScaleInOptions } from './presets/scale-in';
export { bounce, type BounceOptions } from './presets/bounce';
export { typewriter, type TypewriterOptions } from './presets/typewriter';
export { scramble, type ScrambleOptions } from './presets/scramble';
export { blurIn, type BlurInOptions } from './presets/blur-in';
export { rotateIn, type RotateInOptions } from './presets/rotate-in';
