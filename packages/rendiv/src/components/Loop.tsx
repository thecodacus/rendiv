import React, { useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import { TimelineContext, type TimelineContextValue } from '../context/TimelineContext';
import { SequenceContext, type SequenceContextValue } from '../context/SequenceContext';
import { Fill } from './Fill';

export interface LoopProps {
  durationInFrames: number;
  times?: number;
  layout?: 'none' | 'absolute-fill';
  style?: CSSProperties;
  children: ReactNode;
}

export function Loop({
  durationInFrames,
  times = Infinity,
  layout = 'absolute-fill',
  style,
  children,
}: LoopProps): React.ReactElement | null {
  const timeline = useContext(TimelineContext);
  const parentSequence = useContext(SequenceContext);

  const localFrame = timeline.frame - parentSequence.accumulatedOffset;

  // Don't render before the loop starts
  if (localFrame < 0) return null;

  // Don't render after all iterations when times is finite
  if (times !== Infinity && localFrame >= durationInFrames * times) return null;

  const loopedFrame = localFrame % durationInFrames;

  const loopedTimeline = useMemo<TimelineContextValue>(
    () => ({
      frame: loopedFrame + parentSequence.accumulatedOffset,
      playing: timeline.playing,
      playingRef: timeline.playingRef,
    }),
    [loopedFrame, parentSequence.accumulatedOffset, timeline.playing, timeline.playingRef],
  );

  const loopedSequence = useMemo<SequenceContextValue>(
    () => ({
      id: null,
      namePath: parentSequence.namePath,
      from: parentSequence.accumulatedOffset,
      durationInFrames,
      parentOffset: parentSequence.accumulatedOffset,
      accumulatedOffset: parentSequence.accumulatedOffset,
      localOffset: 0,
      accumulatedPlaybackRate: parentSequence.accumulatedPlaybackRate,
    }),
    [parentSequence.namePath, parentSequence.accumulatedOffset, durationInFrames, parentSequence.accumulatedPlaybackRate],
  );

  const content = (
    <TimelineContext.Provider value={loopedTimeline}>
      <SequenceContext.Provider value={loopedSequence}>
        {children}
      </SequenceContext.Provider>
    </TimelineContext.Provider>
  );

  if (layout === 'none') return content;
  return <Fill style={style}>{content}</Fill>;
}

Loop.displayName = 'Loop';
