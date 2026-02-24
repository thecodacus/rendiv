import { useRef, useCallback, useEffect } from 'react';
import type { DragOperation, DragEdge } from './types';

interface UseTimelineDragOptions {
  pixelsPerFrame: number;
  trackHeight: number;
  trackGap: number;
  onOverrideChange: (namePath: string, override: { from: number; durationInFrames: number; trackIndex?: number; playbackRate?: number }) => void;
  /** Check whether the dragged block can be placed on the target track without overlapping. */
  canPlaceOnTrack: (namePath: string, from: number, duration: number, trackIndex: number) => boolean;
  /** When set, right-edge drags on this namePath adjust playbackRate instead of duration. */
  speedEditPath: string | null;
  /** Current playbackRate for the speed-edit target (needed to compute content frames). */
  speedEditRate: number;
}

interface UseTimelineDragReturn {
  isDragging: boolean;
  dragNamePath: string | null;
  startDrag: (namePath: string, edge: DragEdge, clientX: number, clientY: number, originalFrom: number, originalDuration: number, originalTrackIndex: number) => void;
}

export function useTimelineDrag({ pixelsPerFrame, trackHeight, trackGap, onOverrideChange, canPlaceOnTrack, speedEditPath, speedEditRate }: UseTimelineDragOptions): UseTimelineDragReturn {
  const dragRef = useRef<DragOperation | null>(null);
  const isDraggingRef = useRef(false);
  const dragNamePathRef = useRef<string | null>(null);
  // Force re-renders when drag state changes
  const forceUpdateRef = useRef(0);

  // Keep speed edit info in refs so the mousemove handler reads current values
  const speedEditPathRef = useRef(speedEditPath);
  speedEditPathRef.current = speedEditPath;
  const speedEditRateRef = useRef(speedEditRate);
  speedEditRateRef.current = speedEditRate;
  // Snapshot the speed at drag start so the calculation stays stable during drag
  const dragStartSpeedRef = useRef(1);

  const startDrag = useCallback((namePath: string, edge: DragEdge, clientX: number, clientY: number, originalFrom: number, originalDuration: number, originalTrackIndex: number) => {
    dragRef.current = { namePath, edge, startClientX: clientX, startClientY: clientY, originalFrom, originalDuration, originalTrackIndex };
    isDraggingRef.current = true;
    dragNamePathRef.current = namePath;
    dragStartSpeedRef.current = speedEditRateRef.current;
    forceUpdateRef.current++;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaPixelsX = e.clientX - drag.startClientX;
      const deltaFrames = Math.round(deltaPixelsX / pixelsPerFrame);

      let newFrom = drag.originalFrom;
      let newDuration = drag.originalDuration;
      let newTrackIndex: number | undefined;
      let newPlaybackRate: number | undefined;

      // Speed edit: right-edge drag adjusts playbackRate + duration,
      // keeping content frames (duration * playbackRate) constant.
      const isSpeedEdit = drag.edge === 'right'
        && speedEditPathRef.current === drag.namePath;

      switch (drag.edge) {
        case 'body': {
          newFrom = Math.max(0, drag.originalFrom + deltaFrames);
          // Vertical drag: compute new track from Y delta
          const deltaPixelsY = e.clientY - drag.startClientY;
          const rowHeight = trackHeight + trackGap;
          const trackDelta = Math.round(deltaPixelsY / rowHeight);
          const candidateTrack = Math.max(0, drag.originalTrackIndex + trackDelta);

          // Only move to the new track if the block fits without overlapping
          if (canPlaceOnTrack(drag.namePath, newFrom, newDuration, candidateTrack)) {
            newTrackIndex = candidateTrack;
          } else {
            // Stay on current track
            newTrackIndex = drag.originalTrackIndex;
          }
          break;
        }
        case 'left':
          newFrom = Math.max(0, drag.originalFrom + deltaFrames);
          newDuration = Math.max(1, drag.originalDuration - deltaFrames);
          newTrackIndex = drag.originalTrackIndex;
          break;
        case 'right':
          newDuration = Math.max(1, drag.originalDuration + deltaFrames);
          newTrackIndex = drag.originalTrackIndex;

          if (isSpeedEdit) {
            // Content frames = original duration * speed at drag start (stays constant)
            const contentFrames = drag.originalDuration * dragStartSpeedRef.current;
            // New speed = content frames / new visual duration
            const rawRate = contentFrames / newDuration;
            // Round to 2 decimal places for clean values, clamp to reasonable bounds
            newPlaybackRate = Math.max(0.1, Math.min(16, Math.round(rawRate * 100) / 100));
          }
          break;
      }

      onOverrideChange(drag.namePath, {
        from: newFrom,
        durationInFrames: newDuration,
        trackIndex: newTrackIndex,
        ...(newPlaybackRate !== undefined && { playbackRate: newPlaybackRate }),
      });
    };

    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        isDraggingRef.current = false;
        dragNamePathRef.current = null;
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [pixelsPerFrame, trackHeight, trackGap, onOverrideChange, canPlaceOnTrack]);

  return {
    isDragging: isDraggingRef.current,
    dragNamePath: dragNamePathRef.current,
    startDrag,
  };
}
