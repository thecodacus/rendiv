// Hooks
export { useFrame } from './hooks/use-frame';
export { useCompositionConfig } from './hooks/use-composition-config';

// Components
export { Composition, type CompositionProps } from './components/Composition';
export { Sequence, type SequenceProps } from './components/Sequence';
export { Fill } from './components/Fill';
export { Still, type StillProps } from './components/Still';
export { Folder, type FolderProps } from './components/Folder';
export { Series, type SeriesProps, type SeriesSequenceProps } from './components/Series';
export { Loop, type LoopProps } from './components/Loop';
export { Freeze, type FreezeProps } from './components/Freeze';

// Media Components
export { Img, type ImgProps } from './components/Img';
export { Video, type VideoProps } from './components/Video';
export { Audio, type AudioProps } from './components/Audio';
export { AnimatedImage, type AnimatedImageProps } from './components/AnimatedImage';
export { IFrame, type IFrameProps } from './components/IFrame';

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
  type HoldRenderOptions,
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
export { FolderContext } from './context/FolderContext';
