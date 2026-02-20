import { useContext, useEffect, type ComponentType, type LazyExoticComponent } from 'react';
import { CompositionManagerContext } from '../context/CompositionManagerContext';

export interface StillProps<Props extends Record<string, unknown> = Record<string, unknown>> {
  id: string;
  component: LazyExoticComponent<ComponentType<Props>> | ComponentType<Props>;
  width: number;
  height: number;
  defaultProps?: Props;
}

export function Still<Props extends Record<string, unknown> = Record<string, unknown>>(
  props: StillProps<Props>
): null {
  const { registerComposition, unregisterComposition } = useContext(CompositionManagerContext);

  useEffect(() => {
    registerComposition({
      id: props.id,
      component: props.component as ComponentType<Record<string, unknown>>,
      durationInFrames: 1,
      fps: 30,
      width: props.width,
      height: props.height,
      defaultProps: (props.defaultProps ?? {}) as Record<string, unknown>,
      group: null,
      type: 'still',
    });
    return () => unregisterComposition(props.id);
  }, [props.id]);

  return null;
}
