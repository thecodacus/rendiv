// Types
export type { TransitionPresentation, TransitionStyles, TransitionTiming } from './types';

// Component
export {
  TransitionSeries,
  type TransitionSeriesProps,
  type TransitionSeriesSequenceProps,
  type TransitionSeriesTransitionProps,
} from './TransitionSeries';

// Timings
export { linearTiming, type LinearTimingOptions } from './timings/linear-timing';
export { springTiming, type SpringTimingOptions } from './timings/spring-timing';

// Presentations
export { fade } from './presentations/fade';
export { slide, type SlideDirection, type SlideOptions } from './presentations/slide';
export { wipe, type WipeDirection, type WipeOptions } from './presentations/wipe';
export { flip, type FlipDirection, type FlipOptions } from './presentations/flip';
export { clockWipe, type ClockWipeOptions } from './presentations/clock-wipe';
