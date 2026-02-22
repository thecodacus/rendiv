import { parseGifFromBuffer } from './parse-gif';
import type { ParsedGif } from './types';

const cache = new Map<string, Promise<ParsedGif>>();

async function fetchAndParse(src: string): Promise<ParsedGif> {
  const response = await fetch(src);
  if (!response.ok) {
    throw new Error(`Failed to fetch GIF: ${response.status} ${response.statusText}`);
  }
  const buffer = await response.arrayBuffer();
  return parseGifFromBuffer(buffer);
}

/**
 * Preload a GIF into the in-memory cache so `<Gif>` renders instantly.
 */
export function preloadGif(src: string): Promise<void> {
  if (!cache.has(src)) {
    cache.set(src, fetchAndParse(src));
  }
  return cache.get(src)!.then(() => undefined);
}

/**
 * Get a parsed GIF from cache, or fetch and parse it.
 */
export function getOrLoadGif(src: string): Promise<ParsedGif> {
  if (!cache.has(src)) {
    cache.set(src, fetchAndParse(src));
  }
  return cache.get(src)!;
}
