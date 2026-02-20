import { createContext, type ComponentType, type LazyExoticComponent } from 'react';

export type ResolveConfigFunction<Props> = (options: {
  defaultProps: Props;
  props: Props;
  abortSignal: AbortSignal;
}) => Promise<{
  durationInFrames?: number;
  fps?: number;
  width?: number;
  height?: number;
  props?: Props;
}>;

export interface CompositionEntry<Props = Record<string, unknown>> {
  id: string;
  component: LazyExoticComponent<ComponentType<Props>> | ComponentType<Props>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Props;
  group: string | null;
  resolveConfig?: ResolveConfigFunction<Props>;
  type: 'composition' | 'still';
}

export interface CompositionManagerContextValue {
  compositions: CompositionEntry[];
  registerComposition: (comp: CompositionEntry) => void;
  unregisterComposition: (id: string) => void;
  currentCompositionId: string | null;
  setCurrentCompositionId: (id: string | null) => void;
  inputProps: Record<string, unknown>;
}

const noop = () => {};

export const CompositionManagerContext = createContext<CompositionManagerContextValue>({
  compositions: [],
  registerComposition: noop,
  unregisterComposition: noop,
  currentCompositionId: null,
  setCurrentCompositionId: noop,
  inputProps: {},
});
