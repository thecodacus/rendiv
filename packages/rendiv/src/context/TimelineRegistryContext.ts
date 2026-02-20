import { createContext } from 'react';

export interface TimelineEntry {
  id: string;
  name: string;
  from: number;
  durationInFrames: number;
}

export interface TimelineRegistryContextValue {
  register: (entry: TimelineEntry) => void;
  unregister: (id: string) => void;
}

/**
 * Context for timeline entry registration. Only provided in Studio mode.
 * When null (default), Sequence components skip registration for zero overhead.
 */
export const TimelineRegistryContext = createContext<TimelineRegistryContextValue | null>(null);
