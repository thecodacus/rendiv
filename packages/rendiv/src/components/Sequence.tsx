import React, { useContext, useId, useEffect, useMemo, useRef, type CSSProperties, type ReactNode } from 'react';
import { TimelineContext, type TimelineContextValue } from '../context/TimelineContext';
import { SequenceContext, type SequenceContextValue } from '../context/SequenceContext';
import { CompositionContext } from '../context/CompositionContext';
import { CanvasElementContext } from '../context/canvas-element-context';
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
  /** Playback speed multiplier. 2 = double speed, 0.5 = half speed. Default: 1 */
  playbackRate?: number;
  /** Mount children N frames before the sequence becomes visible.
   *  During premount, children render invisibly with a frozen frame,
   *  allowing media elements to preload in the background. Default: 0 */
  premountFor?: number;
  children: ReactNode;
}

export const Sequence: React.FC<SequenceProps> = ({
  from = 0,
  durationInFrames = Infinity,
  name,
  layout = 'absolute-fill',
  style,
  trackIndex = 0,
  playbackRate = 1,
  premountFor = 0,
  children,
}) => {
  const parentSequence = useContext(SequenceContext);
  const timeline = useContext(TimelineContext);
  const composition = useContext(CompositionContext);
  const canvasElementCtx = useContext(CanvasElementContext);
  const canvasElementScope = canvasElementCtx?.id ?? null;
  const isNestedScope = canvasElementCtx?.nested ?? false;
  const id = useId();

  // Build stable name path for override identification.
  // Prefixed with composition id (or CanvasElement scope) so overrides are
  // scoped per composition. CanvasElement takes precedence so compositions
  // keep their override identity when nested inside a master composition.
  // Always append `[from]` so siblings with the same name (e.g. Series
  // auto-deriving "SceneCard" for every child) get unique paths.
  // Using `from` rather than an index means structural edits cause stale
  // overrides to become harmlessly orphaned instead of applying to the
  // wrong sequence.
  const displayName = name ?? 'Sequence';
  const pathSegment = `${displayName}[${from}]`;
  const compositionId = canvasElementScope ?? composition?.id ?? '';
  const compositionPrefix = compositionId ? `${compositionId}/` : '';
  const namePath = parentSequence.namePath
    ? `${parentSequence.namePath}/${pathSegment}`
    : `${compositionPrefix}${pathSegment}`;

  // Compute base values from props and parent context
  const baseAbsoluteFrom = parentSequence.accumulatedOffset + from;

  // Read overrides from global Map (Studio mode only, zero-cost when Map doesn't exist)
  const scopeOffset = canvasElementCtx?.scopeOffset ?? 0;
  let absoluteFrom = baseAbsoluteFrom;
  let effectiveDuration = durationInFrames;
  let effectiveTrackIndex = trackIndex;
  let offsetX = 0;
  let offsetY = 0;
  let scaleX = 1;
  let scaleY = 1;
  let effectivePlaybackRate = playbackRate;
  if (typeof window !== 'undefined') {
    const w = window as unknown as Record<string, unknown>;
    const overrides = w.__RENDIV_TIMELINE_OVERRIDES__ as Map<string, TimelineOverride> | undefined;
    const override = overrides?.get(namePath);
    if (override) {
      absoluteFrom = scopeOffset + override.from;
      effectiveDuration = override.durationInFrames;
      if (override.trackIndex !== undefined) {
        effectiveTrackIndex = override.trackIndex;
      }
      if (override.x !== undefined) offsetX = override.x;
      if (override.y !== undefined) offsetY = override.y;
      if (override.scaleX !== undefined) scaleX = override.scaleX;
      if (override.scaleY !== undefined) scaleY = override.scaleY;
      if (override.playbackRate !== undefined) effectivePlaybackRate = override.playbackRate;
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
    const entry = { id, name: displayName, namePath, from: absoluteFrom, durationInFrames: effectiveDuration, parentId, trackIndex: effectiveTrackIndex, playbackRate: effectivePlaybackRate, nestedScope: isNestedScope };
    entries.set(id, entry);
    document.dispatchEvent(new CustomEvent('rendiv:timeline-sync'));
    return () => {
      entries.delete(id);
      document.dispatchEvent(new CustomEvent('rendiv:timeline-sync'));
    };
  }, [id, displayName, namePath, absoluteFrom, effectiveDuration, effectivePlaybackRate]);

  // Multiply with parent's accumulated rate so nested speed Sequences compound
  const accumulatedPlaybackRate = parentSequence.accumulatedPlaybackRate * effectivePlaybackRate;

  const contextValue = useMemo<SequenceContextValue>(
    () => ({
      id,
      namePath,
      from: absoluteFrom,
      durationInFrames: effectiveDuration,
      parentOffset: parentSequence.accumulatedOffset,
      accumulatedOffset: absoluteFrom,
      localOffset: from,
      accumulatedPlaybackRate,
      loopStack: parentSequence.loopStack,
    }),
    [id, namePath, absoluteFrom, effectiveDuration, parentSequence.accumulatedOffset, from, accumulatedPlaybackRate, parentSequence.loopStack]
  );

  // When playbackRate !== 1, override TimelineContext so children see
  // frames advancing at a different rate (like Loop/Freeze pattern).
  // At 2x: children see frames 0,2,4,6... At 0.5x: frames 0,0,1,1,2,2...
  const needsSpeedOverride = effectivePlaybackRate !== 1;
  const scaledTimeline = useMemo<TimelineContextValue | null>(() => {
    if (!needsSpeedOverride) return null;
    const localFrame = currentFrame - absoluteFrom;
    const scaledLocal = Math.floor(localFrame * effectivePlaybackRate);
    return {
      frame: absoluteFrom + scaledLocal,
      playing: timeline.playing,
      playingRef: timeline.playingRef,
    };
  }, [needsSpeedOverride, currentFrame, absoluteFrom, effectivePlaybackRate, timeline.playing, timeline.playingRef]);

  // During premount, freeze timeline at the sequence start so children see
  // frame 0 and media elements don't try to play (playing = false).
  const premountPlayingRef = useRef(false);
  const premountTimeline = useMemo<TimelineContextValue>(() => ({
    frame: absoluteFrom,
    playing: false,
    playingRef: premountPlayingRef,
  }), [absoluteFrom]);

  // Premount: mount children early so media elements can preload
  const premountStart = absoluteFrom - premountFor;
  const isPremounting = premountFor > 0
    && currentFrame >= premountStart
    && currentFrame < absoluteFrom;
  const isVisible = currentFrame >= absoluteFrom
    && currentFrame < absoluteFrom + effectiveDuration;

  if (!isPremounting && !isVisible) return null;

  // Choose which timeline children see: premount (frozen) > speed-scaled > parent.
  // When premountFor > 0, always wrap in a Provider (even when passing through
  // the parent timeline unchanged) to keep the React tree structure stable across
  // the premount → visible transition, preventing child remounts.
  let childTimeline: TimelineContextValue | null;
  if (isPremounting) {
    childTimeline = premountTimeline;
  } else if (needsSpeedOverride) {
    childTimeline = scaledTimeline!;
  } else if (premountFor > 0) {
    childTimeline = timeline;
  } else {
    childTimeline = null;
  }

  const innerChildren = childTimeline
    ? <TimelineContext.Provider value={childTimeline}>{children}</TimelineContext.Provider>
    : children;

  const content = (
    <SequenceContext.Provider value={contextValue}>
      {innerChildren}
    </SequenceContext.Provider>
  );

  // Build transform from position + scale overrides
  const hasTransform = offsetX !== 0 || offsetY !== 0 || scaleX !== 1 || scaleY !== 1;
  const transformParts: string[] = [];
  if (offsetX !== 0 || offsetY !== 0) transformParts.push(`translate(${offsetX}px, ${offsetY}px)`);
  if (scaleX !== 1 || scaleY !== 1) transformParts.push(`scale(${scaleX}, ${scaleY})`);

  // Premount styles: hide the content but keep it in the DOM so media can preload
  const premountModifiers: CSSProperties | undefined = isPremounting
    ? { opacity: 0, pointerEvents: 'none' }
    : undefined;

  if (layout === 'none') {
    // When layout='none' but there are position/scale overrides, wrap in a
    // positioned container so the transform applies to the entire subtree
    // (e.g. TransitionSeries scenes that manage their own Fill wrappers).
    if (hasTransform || isPremounting) {
      const wrapStyle: CSSProperties = {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        width: '100%',
        height: '100%',
        ...(hasTransform && { transform: transformParts.join(' '), transformOrigin: '0 0' }),
        ...(trackZIndex !== undefined && { zIndex: trackZIndex }),
        ...premountModifiers,
      };
      return <div style={wrapStyle} data-rendiv-namepath={namePath}>{content}</div>;
    }
    return content;
  }

  const fillStyle: CSSProperties = {
    ...style,
    ...(trackZIndex !== undefined && { zIndex: trackZIndex }),
    ...(hasTransform && { transform: transformParts.join(' '), transformOrigin: '0 0' }),
    ...premountModifiers,
  };
  return <Fill style={fillStyle} data-rendiv-namepath={namePath}>{content}</Fill>;
};

Sequence.displayName = 'Sequence';
