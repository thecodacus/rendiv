import { createContext } from 'react';

export type RendivEnvironment = 'studio' | 'rendering' | 'player';

export interface RendivEnvironmentContextValue {
  environment: RendivEnvironment;
}

export const RendivEnvironmentContext = createContext<RendivEnvironmentContextValue>({
  environment: 'studio',
});
