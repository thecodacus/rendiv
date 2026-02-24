import { useEffect } from 'react';
import { prefetch } from '../prefetch';

export interface PrefetchProps {
  /** One or more media URLs to preload into the browser cache. */
  src: string | string[];
}

/**
 * Preloads media files so they're available instantly when `<Video>` or
 * `<Audio>` components mount later in the timeline.
 *
 * Place at the top level of your composition:
 * ```tsx
 * <>
 *   <Prefetch src={[staticFile('intro.mp4'), staticFile('bg.wav')]} />
 *   <Series>…</Series>
 * </>
 * ```
 */
export function Prefetch({ src }: PrefetchProps): null {
  useEffect(() => {
    const sources = Array.isArray(src) ? src : [src];
    const cleanups = sources.map(s => prefetch(s));
    return () => cleanups.forEach(fn => fn());
  }, [Array.isArray(src) ? src.join('\0') : src]);

  return null;
}

Prefetch.displayName = 'Prefetch';
