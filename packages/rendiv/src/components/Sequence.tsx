import React, { useContext, useId, useEffect, useMemo, type CSSProperties, type ReactNode } from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext, type SequenceContextValue } from '../context/SequenceContext';
import { CompositionContext } from '../context/CompositionContext';
import { Fill } from './Fill';
import type { TimelineOverride } from '../types/timeline-override';

export interface SequenceProps {
  from?: number;
  durationInFrames?: number;
  name?: string;
  layout?: 'none' | 'absolute-fill';
  style?: CSSProperties;
  /** Track index for z-ordering. Lower values render in front (track 0 = frontmost). */
  trackIndex?: number;
  children: ReactNode;
}

export const Sequence: React.FC<SequenceProps> = ({
  from = 0,
  durationInFrames = Infinity,
  name,
  layout = 'absolute-fill',
  style,
  trackIndex = 0,
  children,
}) => {
  const parentSequence = useContext(SequenceContext);
  const timeline = useContext(TimelineContext);
  const composition = useContext(CompositionContext);
  const id = useId();

  // Build stable name path for override identification.
  // Prefixed with composition id so overrides are scoped per composition.
  // Always append `[from]` so siblings with the same name (e.g. Series
  // auto-deriving "SceneCard" for every child) get unique paths.
  // Using `from` rather than an index means structural edits cause stale
  // overrides to become harmlessly orphaned instead of applying to the
  // wrong sequence.
  const displayName = name ?? 'Sequence';
  const pathSegment = `${displayName}[${from}]`;
  const compositionPrefix = composition ? `${composition.id}/` : '';
  const namePath = parentSequence.namePath
    ? `${parentSequence.namePath}/${pathSegment}`
    : `${compositionPrefix}${pathSegment}`;

  // Compute base values from props and parent context
  const baseAbsoluteFrom = parentSequence.accumulatedOffset + from;

  // Read overrides from global Map (Studio mode only, zero-cost when Map doesn't exist)
  let absoluteFrom = baseAbsoluteFrom;
  let effectiveDuration = durationInFrames;
  let effectiveTrackIndex = trackIndex;
  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>;
    const overrides = w.__RENDIV_TIMELINE_OVERRIDES__ as Map<string, TimelineOverride> | undefined;
    const override = overrides?.get(namePath);
    if (override) {
      absoluteFrom = override.from;
      effectiveDuration = override.durationInFrames;
      if (override.trackIndex !== undefined) {
        effectiveTrackIndex = override.trackIndex;
      }
    }
  }
  const trackZIndex = effectiveTrackIndex !== undefined ? 10000 - effectiveTrackIndex : undefined;

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
    const parentId = parentSequence.id;
    const entry = { id, name: displayName, namePath, from: absoluteFrom, durationInFrames: effectiveDuration, parentId };
    entries.set(id, entry);
    document.dispatchEvent(new CustomEvent('rendiv:timeline-sync'));
    return () => {
      entries.delete(id);
      document.dispatchEvent(new CustomEvent('rendiv:timeline-sync'));
    };
  }, [id, displayName, namePath, absoluteFrom, effectiveDuration]);

  const contextValue = useMemo<SequenceContextValue>(
    () => ({
      id,
      namePath,
      from: absoluteFrom,
      durationInFrames: effectiveDuration,
      parentOffset: parentSequence.accumulatedOffset,
      accumulatedOffset: absoluteFrom,
      localOffset: from,
    }),
    [id, namePath, absoluteFrom, effectiveDuration, parentSequence.accumulatedOffset, from]
  );

  // Not visible yet or already past
  if (currentFrame < absoluteFrom) return null;
  if (currentFrame >= absoluteFrom + effectiveDuration) return null;

  const content = (
    <SequenceContext.Provider value={contextValue}>
      {children}
    </SequenceContext.Provider>
  );

  if (layout === 'none') return content;
  const fillStyle = trackZIndex !== undefined
    ? { ...style, zIndex: trackZIndex }
    : style;
  return <Fill style={fillStyle}>{content}</Fill>;
};

Sequence.displayName = 'Sequence';
