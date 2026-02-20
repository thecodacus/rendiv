export interface CompositionInfo {
  id: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  type: 'composition' | 'still';
}
