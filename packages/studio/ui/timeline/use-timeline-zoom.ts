import { useState, useCallback, useRef, useEffect } from 'react';

interface UseTimelineZoomOptions {
  totalFrames: number;
  containerRef: React.RefObject<HTMLDivElement | null>;
}

interface UseTimelineZoomReturn {
  pixelsPerFrame: number;
  scrollLeft: number;
  setScrollLeft: (v: number) => void;
  setPixelsPerFrame: (v: number) => void;
  handleWheel: (e: WheelEvent) => void;
}

const MIN_PX_PER_FRAME = 0.5;
const MAX_PX_PER_FRAME = 20;

export function useTimelineZoom({ totalFrames, containerRef }: UseTimelineZoomOptions): UseTimelineZoomReturn {
  const [pixelsPerFrame, setPixelsPerFrame] = useState(() => {
    // Start at a reasonable default — will be adjusted on mount
    return 3;
  });
  const [scrollLeft, setScrollLeft] = useState(0);
  const ppfRef = useRef(pixelsPerFrame);
  ppfRef.current = pixelsPerFrame;

  // Fit to width on mount
  useEffect(() => {
    const el = containerRef.current;
    if (!el || totalFrames <= 0) return;
    const fitPpf = Math.max(MIN_PX_PER_FRAME, el.clientWidth / totalFrames);
    setPixelsPerFrame(Math.min(fitPpf, MAX_PX_PER_FRAME));
    setScrollLeft(0);
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

      // Keep the frame under the cursor in place
      const frameAtCursor = (cursorX + el.scrollLeft) / oldPpf;
      const newScrollLeft = Math.max(0, frameAtCursor * newPpf - cursorX);

      setPixelsPerFrame(newPpf);
      setScrollLeft(newScrollLeft);
    } else {
      // Horizontal scroll
      e.preventDefault();
      const delta = e.deltaX !== 0 ? e.deltaX : e.deltaY;
      setScrollLeft((prev) => Math.max(0, prev + delta));
    }
  }, [containerRef]);

  return { pixelsPerFrame, scrollLeft, setScrollLeft, setPixelsPerFrame, handleWheel };
}
