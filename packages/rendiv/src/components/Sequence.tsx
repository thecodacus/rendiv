import React, { useContext, useMemo, type CSSProperties, type ReactNode } from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext, type SequenceContextValue } from '../context/SequenceContext';
import { Fill } from './Fill';

export interface SequenceProps {
  from?: number;
  durationInFrames?: number;
  name?: string;
  layout?: 'none' | 'absolute-fill';
  style?: CSSProperties;
  children: ReactNode;
}

export const Sequence: React.FC<SequenceProps> = ({
  from = 0,
  durationInFrames = Infinity,
  layout = 'absolute-fill',
  style,
  children,
}) => {
  const parentSequence = useContext(SequenceContext);
  const timeline = useContext(TimelineContext);

  const absoluteFrom = parentSequence.accumulatedOffset + from;
  const currentFrame = timeline.frame;

  const contextValue = useMemo<SequenceContextValue>(
    () => ({
      from: absoluteFrom,
      durationInFrames,
      parentOffset: parentSequence.accumulatedOffset,
      accumulatedOffset: absoluteFrom,
      localOffset: from,
    }),
    [absoluteFrom, durationInFrames, parentSequence.accumulatedOffset, from]
  );

  // Not visible yet or already past
  if (currentFrame < absoluteFrom) return null;
  if (currentFrame >= absoluteFrom + durationInFrames) return null;

  const content = (
    <SequenceContext.Provider value={contextValue}>
      {children}
    </SequenceContext.Provider>
  );

  if (layout === 'none') return content;
  return <Fill style={style}>{content}</Fill>;
};

Sequence.displayName = 'Sequence';
