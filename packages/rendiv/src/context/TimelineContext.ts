import { createContext, type MutableRefObject } from 'react';

export interface TimelineContextValue {
  frame: number;
  playing: boolean;
  playingRef: MutableRefObject<boolean>;
}

export const TimelineContext = createContext<TimelineContextValue>({
  frame: 0,
  playing: false,
  playingRef: { current: false },
});
