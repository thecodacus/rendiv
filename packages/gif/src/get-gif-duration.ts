import { getOrLoadGif } from './preload-gif';

/**
 * Returns the total duration of a GIF in seconds.
 * Fetches and parses the GIF if not already cached.
 */
export async function getGifDurationInSeconds(src: string): Promise<number> {
  const gif = await getOrLoadGif(src);
  return gif.totalDurationMs / 1000;
}
