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
}
