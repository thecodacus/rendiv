import { createContext } from 'react';

export interface SequenceContextValue {
  id: string | null;
  namePath: string;
  from: number;
  durationInFrames: number;
  parentOffset: number;
  accumulatedOffset: number;
  localOffset: number;
  /** Accumulated playback rate from nested Sequences. Media components
   *  multiply their own playbackRate by this so native playback keeps
   *  up with time-stretched frames. Default: 1 */
  accumulatedPlaybackRate: number;
  /** Stack of enclosing Loop layers. Media components use this to register
   *  one audio entry per iteration during rendering. */
  loopStack?: Array<{ durationInFrames: number; iterations: number }>;
}

export const SequenceContext = createContext<SequenceContextValue>({
  id: null,
  namePath: '',
  from: 0,
  durationInFrames: Infinity,
  parentOffset: 0,
  accumulatedOffset: 0,
  localOffset: 0,
  accumulatedPlaybackRate: 1,
});
