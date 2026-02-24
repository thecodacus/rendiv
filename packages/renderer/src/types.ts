export interface CompositionInfo {
  id: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  defaultProps: Record<string, unknown>;
  type: 'composition' | 'still';
}

export interface AudioSourceInfo {
  /** 'audio' for <Audio>, 'video' for <Video>/<OffthreadVideo> */
  type: 'audio' | 'video';
  /** Source URL (e.g. "/01_hook_intro.wav") */
  src: string;
  /** Absolute frame where this audio starts in the composition timeline */
  startAtFrame: number;
  /** How many frames this audio plays for */
  durationInFrames: number;
  /** Frame offset into the source file to start from */
  startFrom: number;
  /** Volume 0–1 */
  volume: number;
  /** Playback speed multiplier */
  playbackRate: number;
}
