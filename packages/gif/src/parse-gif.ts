import { parseGIF, decompressFrames } from 'gifuct-js';
import type { ParsedGif, ParsedGifFrame } from './types';

export function parseGifFromBuffer(buffer: ArrayBuffer): ParsedGif {
  const gif = parseGIF(buffer);
  const rawFrames = decompressFrames(gif, true);

  if (rawFrames.length === 0) {
    throw new Error('GIF contains no frames');
  }

  const width = rawFrames[0].dims.width;
  const height = rawFrames[0].dims.height;

  let totalDurationMs = 0;
  const frames: ParsedGifFrame[] = [];

  for (const raw of rawFrames) {
    // GIF delays are in centiseconds; 0 typically means 100ms
    const delayMs = raw.delay <= 0 ? 100 : raw.delay * 10;
    totalDurationMs += delayMs;

    frames.push({
      patch: raw.patch,
      dims: raw.dims,
      delay: delayMs,
      disposalType: raw.disposalType ?? 0,
    });
  }

  return { frames, width, height, totalDurationMs };
}
