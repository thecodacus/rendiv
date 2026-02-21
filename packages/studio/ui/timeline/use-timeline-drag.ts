import { useRef, useCallback, useEffect } from 'react';
import type { DragOperation, DragEdge } from './types';

interface UseTimelineDragOptions {
  pixelsPerFrame: number;
  onOverrideChange: (namePath: string, override: { from: number; durationInFrames: number }) => void;
}

interface UseTimelineDragReturn {
  isDragging: boolean;
  dragNamePath: string | null;
  startDrag: (namePath: string, edge: DragEdge, clientX: number, originalFrom: number, originalDuration: number) => void;
}

export function useTimelineDrag({ pixelsPerFrame, onOverrideChange }: UseTimelineDragOptions): UseTimelineDragReturn {
  const dragRef = useRef<DragOperation | null>(null);
  const isDraggingRef = useRef(false);
  const dragNamePathRef = useRef<string | null>(null);
  // Force re-renders when drag state changes
  const forceUpdateRef = useRef(0);

  const startDrag = useCallback((namePath: string, edge: DragEdge, clientX: number, originalFrom: number, originalDuration: number) => {
    dragRef.current = { namePath, edge, startClientX: clientX, originalFrom, originalDuration };
    isDraggingRef.current = true;
    dragNamePathRef.current = namePath;
    forceUpdateRef.current++;
  }, []);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag) return;

      const deltaPixels = e.clientX - drag.startClientX;
      const deltaFrames = Math.round(deltaPixels / pixelsPerFrame);

      let newFrom = drag.originalFrom;
      let newDuration = drag.originalDuration;

      switch (drag.edge) {
        case 'body':
          newFrom = Math.max(0, drag.originalFrom + deltaFrames);
          break;
        case 'left':
          newFrom = Math.max(0, drag.originalFrom + deltaFrames);
          newDuration = Math.max(1, drag.originalDuration - deltaFrames);
          break;
        case 'right':
          newDuration = Math.max(1, drag.originalDuration + deltaFrames);
          break;
      }

      onOverrideChange(drag.namePath, { from: newFrom, durationInFrames: newDuration });
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
  }, [pixelsPerFrame, onOverrideChange]);

  return {
    isDragging: isDraggingRef.current,
    dragNamePath: dragNamePathRef.current,
    startDrag,
  };
}
