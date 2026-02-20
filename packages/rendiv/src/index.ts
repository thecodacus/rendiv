// Hooks
export { useFrame } from './hooks/use-frame';
export { useCompositionConfig } from './hooks/use-composition-config';

// Components
export { Composition, type CompositionProps } from './components/Composition';
export { Sequence, type SequenceProps } from './components/Sequence';
export { Fill } from './components/Fill';
export { Still, type StillProps } from './components/Still';
export { Folder, type FolderProps } from './components/Folder';

// Animation
export { interpolate, type InterpolateOptions, type ExtrapolationType } from './animation/interpolate';
export { spring, type SpringConfig, type SpringOptions } from './animation/spring';
export { getSpringDuration, type GetSpringDurationOptions } from './animation/measure-spring';
export { Easing, type EasingFunction } from './animation/easing';
export { blendColors } from './animation/interpolate-colors';

// Registration
export { setRootComponent, getRootComponent } from './register-root';

// Utilities
export { staticFile } from './static-file';
export { getInputProps } from './get-input-props';
export { getRendivEnvironment, useRendivEnvironment } from './get-rendiv-environment';
export {
  holdRender,
  releaseRender,
  abortRender,
  getPendingHoldCount,
  getPendingHoldLabels,
} from './delay-render';

// Contexts (for Player, Renderer, Studio packages)
export { TimelineContext, type TimelineContextValue } from './context/TimelineContext';
export { CompositionContext, type CompositionConfig } from './context/CompositionContext';
export { SequenceContext, type SequenceContextValue } from './context/SequenceContext';
export {
  RendivEnvironmentContext,
  type RendivEnvironment,
  type RendivEnvironmentContextValue,
} from './context/RendivEnvironmentContext';
export {
  CompositionManagerContext,
  type CompositionManagerContextValue,
  type CompositionEntry,
  type ResolveConfigFunction,
} from './context/CompositionManagerContext';
