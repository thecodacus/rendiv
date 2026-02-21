import type { TimelineEntry, TimelineOverride } from '@rendiv/core';

export interface TrackEntry {
  entry: TimelineEntry;
  trackIndex: number;
  hasOverride: boolean;
}

export interface Track {
  id: number;
  entries: TrackEntry[];
}

export type DragEdge = 'body' | 'left' | 'right';

export interface DragOperation {
  namePath: string;
  edge: DragEdge;
  startClientX: number;
  originalFrom: number;
  originalDuration: number;
}

export interface TimelineEditorProps {
  entries: TimelineEntry[];
  currentFrame: number;
  totalFrames: number;
  fps: number;
  compositionName: string;
  onSeek: (frame: number) => void;
  overrides: Map<string, TimelineOverride>;
  onOverrideChange: (namePath: string, override: TimelineOverride) => void;
  onOverrideRemove: (namePath: string) => void;
  onOverridesClear: () => void;
  view: 'editor' | 'tree';
  onViewChange: (view: 'editor' | 'tree') => void;
}
