import { useContext, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import {
  CompositionManagerContext,
  type ResolveConfigFunction,
} from '../context/CompositionManagerContext';

export interface CompositionProps<Props extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  component: LazyExoticComponent<ComponentType<Props>> | ComponentType<Props>;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps?: Props;
  resolveConfig?: ResolveConfigFunction<Props>;
}

export function Composition<Props extends Record<string, unknown> = Record<string, unknown>>(
  props: CompositionProps<Props>
): null {
  const { registerComposition, unregisterComposition } = useContext(CompositionManagerContext);

  useEffect(() => {
    registerComposition({
      id: props.id,
      component: props.component as ComponentType<Record<string, unknown>>,
      durationInFrames: props.durationInFrames,
      fps: props.fps,
      width: props.width,
      height: props.height,
      defaultProps: (props.defaultProps ?? {}) as Record<string, unknown>,
      group: null,
      resolveConfig: props.resolveConfig as ResolveConfigFunction<Record<string, unknown>> | undefined,
      type: 'composition',
    });
    return () => unregisterComposition(props.id);
  }, [props.id]);

  return null;
}
