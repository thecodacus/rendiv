/**
 * Convert a millisecond timestamp to a frame number.
 */
export function msToFrame(ms: number, fps: number): number {
  return Math.round((ms / 1000) * fps);
}

/**
 * Convert a frame number to milliseconds.
 */
export function frameToMs(frame: number, fps: number): number {
  return (frame / fps) * 1000;
}
