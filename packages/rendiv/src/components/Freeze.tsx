import React, { useContext, useMemo, type ReactNode } from 'react';
import { TimelineContext, type TimelineContextValue } from '../context/TimelineContext';

export interface FreezeProps {
  frame: number;
  children: ReactNode;
}

export function Freeze({ frame: frozenFrame, children }: FreezeProps): React.ReactElement {
  const parentTimeline = useContext(TimelineContext);

  const frozenValue = useMemo<TimelineContextValue>(
    () => ({
      frame: frozenFrame,
      playing: parentTimeline.playing,
      playingRef: parentTimeline.playingRef,
    }),
    [frozenFrame, parentTimeline.playing, parentTimeline.playingRef],
  );

  return (
    <TimelineContext.Provider value={frozenValue}>
      {children}
    </TimelineContext.Provider>
  );
}

Freeze.displayName = 'Freeze';
