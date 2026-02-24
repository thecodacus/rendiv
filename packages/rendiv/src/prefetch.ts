const prefetchedUrls = new Map<string, { cleanup: () => void }>();

/**
 * Preloads a media file into the browser cache so it's available instantly
 * when a `<Video>` or `<Audio>` component mounts.
 *
 * Call at the top of your composition (or anywhere before the media is needed)
 * and store the returned cleanup function to release the preload link when done.
 *
 * ```ts
 * const cleanup = prefetch(staticFile('intro.mp4'));
 * // later:
 * cleanup();
 * ```
 */
export function prefetch(src: string): () => void {
  if (typeof document === 'undefined') return () => {};
  if (prefetchedUrls.has(src)) return () => {};

  const link = document.createElement('link');
  link.rel = 'preload';
  link.as = 'fetch';
  link.crossOrigin = 'anonymous';
  link.href = src;
  document.head.appendChild(link);

  const cleanup = () => {
    link.remove();
    prefetchedUrls.delete(src);
  };

  prefetchedUrls.set(src, { cleanup });
  return cleanup;
}
