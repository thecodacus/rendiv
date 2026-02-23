import { useRef, useState, useCallback, useEffect } from 'react';
import type { TimelineEntry, TimelineOverride } from '@rendiv/core';

export type HandleType = 'move' | 'scale-tl' | 'scale-tr' | 'scale-bl' | 'scale-br' | null;

export interface VisibleEntry {
  entry: TimelineEntry;
  namePath: string;
  name: string;
  trackIndex: number;
  /** Box in composition pixels */
  x: number;
  y: number;
  w: number;
  h: number;
}

interface DragState {
  namePath: string;
  handleType: Exclude<HandleType, null>;
  startClientX: number;
  startClientY: number;
  /** Anchor corner (stays fixed during scale) in composition pixels */
  anchorX: number;
  anchorY: number;
  /** Dragged corner start position in composition pixels */
  dragStartX: number;
  dragStartY: number;
  /** Per-axis: true if the anchor is at the transform origin, false if at the end */
  xAnchorIsOrigin: boolean;
  yAnchorIsOrigin: boolean;
  /** Starting override values to preserve */
  startX: number;
  startY: number;
  startScaleX: number;
  startScaleY: number;
  startFrom: number;
  startDuration: number;
  startTrackIndex: number | undefined;
}

interface UsePreviewDragOptions {
  timelineEntries: TimelineEntry[];
  overrides: Map<string, TimelineOverride>;
  currentFrame: number;
  compositionWidth: number;
  compositionHeight: number;
  playerScale: number;
  enabled: boolean;
  onOverrideChange: (namePath: string, override: TimelineOverride) => void;
}

const HANDLE_RADIUS = 8;

export function usePreviewDrag({
  timelineEntries,
  overrides,
  currentFrame,
  compositionWidth,
  compositionHeight,
  playerScale,
  enabled,
  onOverrideChange,
}: UsePreviewDragOptions) {
  const [hoveredNamePath, setHoveredNamePath] = useState<string | null>(null);
  const [draggingNamePath, setDraggingNamePath] = useState<string | null>(null);
  const [handleType, setHandleType] = useState<HandleType>(null);
  const dragRef = useRef<DragState | null>(null);

  // Keep refs for values used in window-level event listeners
  const playerScaleRef = useRef(playerScale);
  playerScaleRef.current = playerScale;
  const onOverrideChangeRef = useRef(onOverrideChange);
  onOverrideChangeRef.current = onOverrideChange;

  // Compute visible entries (top-level sequences visible at current frame)
  const visibleEntries: VisibleEntry[] = [];
  if (enabled) {
    for (const entry of timelineEntries) {
      // Only show top-level sequences (parentId === null means direct child of composition)
      if (entry.parentId !== null) continue;
      // Check if visible at current frame
      if (currentFrame < entry.from || currentFrame >= entry.from + entry.durationInFrames) continue;

      const override = overrides.get(entry.namePath);
      const x = override?.x ?? 0;
      const y = override?.y ?? 0;
      const scaleX = override?.scaleX ?? 1;
      const scaleY = override?.scaleY ?? 1;

      visibleEntries.push({
        entry,
        namePath: entry.namePath,
        name: entry.name,
        trackIndex: entry.trackIndex ?? 0,
        x: x + Math.min(0, compositionWidth * scaleX),
        y: y + Math.min(0, compositionHeight * scaleY),
        w: Math.abs(compositionWidth * scaleX),
        h: Math.abs(compositionHeight * scaleY),
      });
    }
    // Sort ascending by trackIndex for rendering (later = visually on top in overlay)
    visibleEntries.sort((a, b) => a.trackIndex - b.trackIndex);
  }

  const visibleEntriesRef = useRef(visibleEntries);
  visibleEntriesRef.current = visibleEntries;

  // Hit test: find entry and handle at a point (in player-pixel coordinates relative to overlay)
  // Iterates in reverse (highest trackIndex first) so the visually topmost entry wins.
  const hitTest = useCallback(
    (clientX: number, clientY: number, overlayRect: DOMRect): { namePath: string; handle: HandleType } | null => {
      const px = clientX - overlayRect.left;
      const py = clientY - overlayRect.top;
      const scale = playerScaleRef.current;
      const entries = visibleEntriesRef.current;

      for (let i = entries.length - 1; i >= 0; i--) {
        const ve = entries[i];
        const bx = ve.x * scale;
        const by = ve.y * scale;
        const bw = ve.w * scale;
        const bh = ve.h * scale;

        // Check corner handles first (small hit zones)
        const corners: Array<{ type: HandleType; cx: number; cy: number }> = [
          { type: 'scale-tl', cx: bx, cy: by },
          { type: 'scale-tr', cx: bx + bw, cy: by },
          { type: 'scale-bl', cx: bx, cy: by + bh },
          { type: 'scale-br', cx: bx + bw, cy: by + bh },
        ];

        for (const corner of corners) {
          const dx = px - corner.cx;
          const dy = py - corner.cy;
          if (dx * dx + dy * dy <= HANDLE_RADIUS * HANDLE_RADIUS) {
            return { namePath: ve.namePath, handle: corner.type };
          }
        }

        // Check body
        if (px >= bx && px <= bx + bw && py >= by && py <= by + bh) {
          return { namePath: ve.namePath, handle: 'move' };
        }
      }

      return null;
    },
    [],
  );

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || e.button !== 0) return;
      const overlayEl = e.currentTarget as HTMLElement;
      const rect = overlayEl.getBoundingClientRect();

      const hit = hitTest(e.clientX, e.clientY, rect);
      if (!hit || !hit.handle) return;

      e.preventDefault();
      e.stopPropagation();

      const entry = timelineEntries.find((te) => te.namePath === hit.namePath);
      const override = overrides.get(hit.namePath);

      const x = override?.x ?? 0;
      const y = override?.y ?? 0;
      const scaleX = override?.scaleX ?? 1;
      const scaleY = override?.scaleY ?? 1;
      const endX = x + compositionWidth * scaleX;
      const endY = y + compositionHeight * scaleY;

      // Per-axis: determine whether the anchor (fixed point) is at the transform origin or end.
      // Visual left handles (tl, bl): anchor is on the visual right
      // Visual right handles (tr, br): anchor is on the visual left
      const isLeftHandle = hit.handle === 'scale-tl' || hit.handle === 'scale-bl';
      const isTopHandle = hit.handle === 'scale-tl' || hit.handle === 'scale-tr';
      const xAnchorIsOrigin = isLeftHandle ? (scaleX < 0) : (scaleX >= 0);
      const yAnchorIsOrigin = isTopHandle ? (scaleY < 0) : (scaleY >= 0);

      let anchorX: number, anchorY: number, dragStartX: number, dragStartY: number;
      if (hit.handle === 'move') {
        anchorX = 0; anchorY = 0; dragStartX = x; dragStartY = y;
      } else {
        anchorX = xAnchorIsOrigin ? x : endX;
        anchorY = yAnchorIsOrigin ? y : endY;
        dragStartX = xAnchorIsOrigin ? endX : x;
        dragStartY = yAnchorIsOrigin ? endY : y;
      }

      dragRef.current = {
        namePath: hit.namePath,
        handleType: hit.handle as Exclude<HandleType, null>,
        startClientX: e.clientX,
        startClientY: e.clientY,
        anchorX,
        anchorY,
        dragStartX,
        dragStartY,
        xAnchorIsOrigin,
        yAnchorIsOrigin,
        startX: x,
        startY: y,
        startScaleX: scaleX,
        startScaleY: scaleY,
        startFrom: override?.from ?? entry?.from ?? 0,
        startDuration: override?.durationInFrames ?? entry?.durationInFrames ?? 1,
        startTrackIndex: override?.trackIndex ?? entry?.trackIndex,
      };

      setDraggingNamePath(hit.namePath);
      setHandleType(hit.handle);
    },
    [enabled, hitTest, overrides, timelineEntries, compositionWidth, compositionHeight],
  );

  // Window-level mouse listeners for drag
  useEffect(() => {
    if (!enabled) return;

    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const scale = playerScaleRef.current;
      const deltaCompX = (e.clientX - drag.startClientX) / scale;
      const deltaCompY = (e.clientY - drag.startClientY) / scale;

      if (drag.handleType === 'move') {
        const newX = Math.round(drag.startX + deltaCompX);
        const newY = Math.round(drag.startY + deltaCompY);

        onOverrideChangeRef.current(drag.namePath, {
          from: drag.startFrom,
          durationInFrames: drag.startDuration,
          trackIndex: drag.startTrackIndex,
          x: newX,
          y: newY,
          scaleX: drag.startScaleX,
          scaleY: drag.startScaleY,
        });
      } else {
        // Scale mode: move the dragged corner, anchor stays fixed
        // Signed scale allows flipping when dragging past the anchor
        const newDragX = drag.dragStartX + deltaCompX;
        const newDragY = drag.dragStartY + deltaCompY;

        // Compute signed scale per axis
        let newScaleX: number, newScaleY: number;
        if (drag.xAnchorIsOrigin) {
          newScaleX = (newDragX - drag.anchorX) / compositionWidth;
        } else {
          newScaleX = (drag.anchorX - newDragX) / compositionWidth;
        }
        if (drag.yAnchorIsOrigin) {
          newScaleY = (newDragY - drag.anchorY) / compositionHeight;
        } else {
          newScaleY = (drag.anchorY - newDragY) / compositionHeight;
        }

        // Shift for proportional scaling (preserve aspect ratio of absolute scales)
        if (e.shiftKey) {
          const absStartSX = Math.abs(drag.startScaleX);
          const absStartSY = Math.abs(drag.startScaleY);
          const origRatio = absStartSX / absStartSY;
          const absNewSX = Math.abs(newScaleX);
          const absNewSY = Math.abs(newScaleY);
          if (absNewSX / absStartSX > absNewSY / absStartSY) {
            newScaleY = (newScaleY >= 0 ? 1 : -1) * (absNewSX / origRatio);
          } else {
            newScaleX = (newScaleX >= 0 ? 1 : -1) * (absNewSY * origRatio);
          }
        }

        // Enforce minimum absolute scale
        const MIN_SCALE = 0.01;
        if (Math.abs(newScaleX) < MIN_SCALE) newScaleX = (newScaleX >= 0 ? 1 : -1) * MIN_SCALE;
        if (Math.abs(newScaleY) < MIN_SCALE) newScaleY = (newScaleY >= 0 ? 1 : -1) * MIN_SCALE;

        // Derive transform origin (x) from anchor + scale
        let newX: number, newY: number;
        if (drag.xAnchorIsOrigin) {
          newX = drag.anchorX;
        } else {
          newX = drag.anchorX - compositionWidth * newScaleX;
        }
        if (drag.yAnchorIsOrigin) {
          newY = drag.anchorY;
        } else {
          newY = drag.anchorY - compositionHeight * newScaleY;
        }

        onOverrideChangeRef.current(drag.namePath, {
          from: drag.startFrom,
          durationInFrames: drag.startDuration,
          trackIndex: drag.startTrackIndex,
          x: Math.round(newX),
          y: Math.round(newY),
          scaleX: Math.round(newScaleX * 100) / 100,
          scaleY: Math.round(newScaleY * 100) / 100,
        });
      }
    };

    const handleMouseUp = () => {
      if (dragRef.current) {
        dragRef.current = null;
        setDraggingNamePath(null);
        setHandleType(null);
      }
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [enabled, compositionWidth, compositionHeight]);

  // Hover handler for the overlay element
  const handleOverlayMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!enabled || dragRef.current) return;
      const overlayEl = e.currentTarget as HTMLElement;
      const rect = overlayEl.getBoundingClientRect();
      const hit = hitTest(e.clientX, e.clientY, rect);
      setHoveredNamePath(hit?.namePath ?? null);
      setHandleType(hit?.handle ?? null);
    },
    [enabled, hitTest],
  );

  const handleOverlayMouseLeave = useCallback(() => {
    if (!dragRef.current) {
      setHoveredNamePath(null);
      setHandleType(null);
    }
  }, []);

  return {
    handleMouseDown,
    handleOverlayMouseMove,
    handleOverlayMouseLeave,
    hoveredNamePath,
    draggingNamePath,
    handleType,
    visibleEntries,
  };
}
