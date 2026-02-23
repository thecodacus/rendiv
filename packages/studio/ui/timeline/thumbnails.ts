// Cache: cacheKey -> string[] of data URLs
const thumbnailCache = new Map<string, string[]>();
// In-flight requests
const thumbnailPending = new Map<string, Promise<string[]>>();

/**
 * Extract thumbnail images from a video source.
 * Returns `count` data URLs (image/jpeg) at evenly-spaced timestamps.
 */
export function extractThumbnails(
  src: string,
  count: number,
  width: number,
  height: number,
): Promise<string[]> {
  const cacheKey = `${src}:${count}:${width}:${height}`;

  const cached = thumbnailCache.get(cacheKey);
  if (cached) return Promise.resolve(cached);

  const pending = thumbnailPending.get(cacheKey);
  if (pending) return pending;

  const promise = (async () => {
    try {
      const video = document.createElement('video');
      video.crossOrigin = 'anonymous';
      video.preload = 'auto';
      video.muted = true;
      video.src = src;

      await new Promise<void>((resolve, reject) => {
        video.onloadedmetadata = () => resolve();
        video.onerror = () => reject(new Error(`Failed to load video: ${src}`));
      });

      const duration = video.duration;
      if (!duration || !isFinite(duration)) {
        return [];
      }

      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;

      const thumbnails: string[] = [];

      for (let i = 0; i < count; i++) {
        const time = (duration * (i + 0.5)) / count;
        video.currentTime = time;

        await new Promise<void>((resolve) => {
          video.onseeked = () => resolve();
        });

        ctx.drawImage(video, 0, 0, width, height);
        thumbnails.push(canvas.toDataURL('image/jpeg', 0.6));
      }

      // Clean up
      video.src = '';
      video.load();

      thumbnailCache.set(cacheKey, thumbnails);
      return thumbnails;
    } finally {
      thumbnailPending.delete(cacheKey);
    }
  })();

  thumbnailPending.set(cacheKey, promise);
  return promise;
}
