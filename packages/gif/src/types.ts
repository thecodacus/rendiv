export interface ParsedGifFrame {
  /** Raw pixel data for this frame's patch region */
  patch: Uint8ClampedArray;
  /** Dimensions and position of the patch */
  dims: { width: number; height: number; left: number; top: number };
  /** Frame delay in milliseconds */
  delay: number;
  /** GIF disposal method (0=none, 1=keep, 2=restore bg, 3=restore previous) */
  disposalType: number;
}

export interface ParsedGif {
  frames: ParsedGifFrame[];
  width: number;
  height: number;
  /** Total animation duration in milliseconds */
  totalDurationMs: number;
}
