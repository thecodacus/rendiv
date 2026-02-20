import { useContext } from 'react';
import { RendivEnvironmentContext } from './context/RendivEnvironmentContext';

export function useRendivEnvironment() {
  const { environment } = useContext(RendivEnvironmentContext);
  return {
    isStudio: environment === 'studio',
    isRendering: environment === 'rendering',
    isPlayer: environment === 'player',
  };
}

export function getRendivEnvironment(): {
  isStudio: boolean;
  isRendering: boolean;
  isPlayer: boolean;
} {
  // Fallback for non-hook contexts — reads from window globals
  if (typeof window !== 'undefined') {
    const env = (window as unknown as Record<string, unknown>).__RENDIV_ENVIRONMENT__ as string | undefined;
    return {
      isStudio: env === 'studio',
      isRendering: env === 'rendering',
      isPlayer: env === 'player',
    };
  }
  return { isStudio: false, isRendering: false, isPlayer: false };
}
