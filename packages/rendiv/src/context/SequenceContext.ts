import { createContext } from 'react';

export interface SequenceContextValue {
  id: string | null;
  namePath: string;
  from: number;
  durationInFrames: number;
  parentOffset: number;
  accumulatedOffset: number;
  localOffset: number;
}

export const SequenceContext = createContext<SequenceContextValue>({
  id: null,
  namePath: '',
  from: 0,
  durationInFrames: Infinity,
  parentOffset: 0,
  accumulatedOffset: 0,
  localOffset: 0,
});
