export interface TimelineOverride {
  from: number;
  durationInFrames: number;
  trackIndex?: number;
  /** Horizontal offset in composition pixels. */
  x?: number;
  /** Vertical offset in composition pixels. */
  y?: number;
  /** Horizontal scale factor (1 = 100%). */
  scaleX?: number;
  /** Vertical scale factor (1 = 100%). */
  scaleY?: number;
  /** Playback speed multiplier (1 = normal, 2 = double speed, 0.5 = half speed). */
  playbackRate?: number;
}
