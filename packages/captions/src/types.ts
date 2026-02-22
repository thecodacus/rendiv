export interface CaptionWord {
  text: string;
  startMs: number;
  endMs: number;
}

export interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  words?: CaptionWord[];
}

export interface HighlightedCaption extends Caption {
  /** Index of the currently highlighted word in the words array */
  highlightedWordIndex: number;
}

export interface WhisperWord {
  word: string;
  start: number;
  end: number;
}

export interface WhisperSegment {
  text: string;
  start: number;
  end: number;
  words?: WhisperWord[];
}

export interface WhisperVerboseJson {
  segments: WhisperSegment[];
}
