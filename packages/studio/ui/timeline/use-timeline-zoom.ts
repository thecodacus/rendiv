import { useState, useCallback, useRef, useEffect, useLayoutEffect } from 'react';

interface UseTimelineZoomOptions {
  totalFrames: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseTimelineZoomReturn {
  pixelsPerFrame: number;
  setPixelsPerFrame: (v: number) => void;
  handleWheel: (e: WheelEvent) => void;
}

const MIN_PX_PER_FRAME = 0.5;
const MAX_PX_PER_FRAME = 20;

/**
 * Zoom state for the timeline track area.
 *
 * The horizontal scroll position lives only in the DOM (`el.scrollLeft`). It is
 * not mirrored into React state: a state copy that is written back to the
 * element from an effect and fed again from `onScroll` has two writers, and
 * whenever the element scrolls between a state update and its effect (scrollbar
 * drag, trackpad momentum, browser clamping, long frames during playback) the
 * effect writes the older value back and the scrollbar bounces between them.
 */
export function useTimelineZoom({ totalFrames, containerRef }: UseTimelineZoomOptions): UseTimelineZoomReturn {
  const [pixelsPerFrame, setPixelsPerFrame] = useState(() => {
    // Start at a reasonable default — will be adjusted on mount
    return 3;
  });
  const ppfRef = useRef(pixelsPerFrame);
  ppfRef.current = pixelsPerFrame;

  // Scroll offset to apply once a zoom has re-rendered the track area at its
  // new width. Setting it earlier would be clamped to the old content width.
  const pendingScrollRef = useRef<number | null>(null);

  useLayoutEffect(() => {
    const el = containerRef.current;
    if (!el || pendingScrollRef.current === null) return;
    el.scrollLeft = pendingScrollRef.current;
    pendingScrollRef.current = null;
  }, [pixelsPerFrame, containerRef]);

  // Fit to width on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el || totalFrames <= 0) return;
    const fitPpf = Math.max(MIN_PX_PER_FRAME, el.clientWidth / totalFrames);
    pendingScrollRef.current = null;
    el.scrollLeft = 0;
    setPixelsPerFrame(Math.min(fitPpf, MAX_PX_PER_FRAME));
  }, [totalFrames, containerRef]);

  const handleWheel = useCallback((e: WheelEvent) => {
    const el = containerRef.current;
    if (!el) return;

    if (e.ctrlKey || e.metaKey) {
      // Zoom: Ctrl/Cmd + wheel
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const cursorX = e.clientX - rect.left;
      const oldPpf = ppfRef.current;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      const newPpf = Math.min(MAX_PX_PER_FRAME, Math.max(MIN_PX_PER_FRAME, oldPpf * zoomFactor));
      if (newPpf === oldPpf) return;

      // Keep the frame under the cursor in place. Several wheel events can
      // arrive before React re-renders, so continue from the not-yet-applied
      // zoom rather than the stale DOM offset.
      const oldScrollLeft = pendingScrollRef.current ?? el.scrollLeft;
      const frameAtCursor = (cursorX + oldScrollLeft) / oldPpf;
      pendingScrollRef.current = Math.max(0, frameAtCursor * newPpf - cursorX);
      ppfRef.current = newPpf;
      setPixelsPerFrame(newPpf);
    } else {
      // Horizontal scroll: move the element directly; the browser clamps it.
      e.preventDefault();
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      el.scrollLeft += delta;
    }
  }, [containerRef]);

  return { pixelsPerFrame, setPixelsPerFrame, handleWheel };
}
