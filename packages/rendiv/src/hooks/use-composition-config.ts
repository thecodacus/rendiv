import { useContext } from 'react';
import { CompositionContext, type CompositionConfig } from '../context/CompositionContext';

export function useCompositionConfig(): CompositionConfig {
  const config = useContext(CompositionContext);
  if (!config) {
    throw new Error(
      'useCompositionConfig() must be called inside a <Composition>, <Player>, or during rendering.'
    );
  }
  return config;
}
