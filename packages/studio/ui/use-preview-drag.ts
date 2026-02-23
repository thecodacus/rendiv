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
        x,
        y,
        w: compositionWidth * scaleX,
        h: compositionHeight * scaleY,
      });
    }
    // Sort by trackIndex ascending (lower = front, checked first in hit test)
    visibleEntries.sort((a, b) => a.trackIndex - b.trackIndex);
  }

  const visibleEntriesRef = useRef(visibleEntries);
  visibleEntriesRef.current = visibleEntries;

  // Hit test: find entry and handle at a point (in player-pixel coordinates relative to overlay)
  const hitTest = useCallback(
    (clientX: number, clientY: number, overlayRect: DOMRect): { namePath: string; handle: HandleType } | null => {
      const px = clientX - overlayRect.left;
      const py = clientY - overlayRect.top;
      const scale = playerScaleRef.current;
      const entries = visibleEntriesRef.current;

      for (const ve of entries) {
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

      // Determine anchor and drag corners based on handle type
      let anchorX: number, anchorY: number, dragStartX: number, dragStartY: number;
      switch (hit.handle) {
        case 'scale-tl':
          anchorX = endX; anchorY = endY; dragStartX = x; dragStartY = y; break;
        case 'scale-tr':
          anchorX = x; anchorY = endY; dragStartX = endX; dragStartY = y; break;
        case 'scale-bl':
          anchorX = endX; anchorY = y; dragStartX = x; dragStartY = endY; break;
        case 'scale-br':
          anchorX = x; anchorY = y; dragStartX = endX; dragStartY = endY; break;
        default: // move
          anchorX = 0; anchorY = 0; dragStartX = x; dragStartY = y; break;
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
        const newDragX = drag.dragStartX + deltaCompX;
        const newDragY = drag.dragStartY + deltaCompY;

        let newW = Math.abs(newDragX - drag.anchorX);
        let newH = Math.abs(newDragY - drag.anchorY);

        // Shift for proportional scaling
        if (e.shiftKey) {
          const origRatio = (compositionWidth * drag.startScaleX) / (compositionHeight * drag.startScaleY);
          const sFromW = newW / compositionWidth;
          const sFromH = newH / compositionHeight;
          if (sFromW / drag.startScaleX > sFromH / drag.startScaleY) {
            newH = newW / origRatio;
          } else {
            newW = newH * origRatio;
          }
        }

        const newScaleX = Math.max(0.05, newW / compositionWidth);
        const newScaleY = Math.max(0.05, newH / compositionHeight);

        // Top-left of the new box
        const newX = Math.round(Math.min(drag.anchorX, drag.anchorX + (newDragX > drag.anchorX ? 0 : -newW)));
        const newY = Math.round(Math.min(drag.anchorY, drag.anchorY + (newDragY > drag.anchorY ? 0 : -newH)));

        onOverrideChangeRef.current(drag.namePath, {
          from: drag.startFrom,
          durationInFrames: drag.startDuration,
          trackIndex: drag.startTrackIndex,
          x: newX,
          y: newY,
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
