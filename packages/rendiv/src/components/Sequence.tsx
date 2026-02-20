import React, { useContext, useId, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
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
  name,
  layout = 'absolute-fill',
  style,
  children,
}) => {
  const parentSequence = useContext(SequenceContext);
  const timeline = useContext(TimelineContext);
  const id = useId();

  const absoluteFrom = parentSequence.accumulatedOffset + from;
  const currentFrame = timeline.frame;

  // Register with timeline registry (Studio mode only).
  // Uses a shared global Map + DOM events to avoid module identity issues in Vite dev server.
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const w = window as unknown as Record<string, unknown>;
    if (!w.__RENDIV_TIMELINE_ENTRIES__) {
      w.__RENDIV_TIMELINE_ENTRIES__ = new Map<string, unknown>();
    }
    const entries = w.__RENDIV_TIMELINE_ENTRIES__ as Map<string, unknown>;
    const entry = { id, name: name ?? 'Sequence', from: absoluteFrom, durationInFrames };
    entries.set(id, entry);
    document.dispatchEvent(new CustomEvent('rendiv:timeline-sync'));
    return () => {
      entries.delete(id);
      document.dispatchEvent(new CustomEvent('rendiv:timeline-sync'));
    };
  }, [id, name, absoluteFrom, durationInFrames]);

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
