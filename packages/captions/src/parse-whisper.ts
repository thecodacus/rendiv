import type { Caption, CaptionWord, WhisperVerboseJson } from './types';

/**
 * Parse Whisper verbose_json output into an array of Captions.
 * Whisper timestamps are in seconds (float) — we convert to milliseconds.
 */
export function parseWhisperTranscript(whisperJson: WhisperVerboseJson): Caption[] {
  return whisperJson.segments.map((segment) => {
    const caption: Caption = {
      text: segment.text.trim(),
      startMs: Math.round(segment.start * 1000),
      endMs: Math.round(segment.end * 1000),
    };

    if (segment.words && segment.words.length > 0) {
      caption.words = segment.words.map((w): CaptionWord => ({
        text: w.word.trim(),
        startMs: Math.round(w.start * 1000),
        endMs: Math.round(w.end * 1000),
      }));
    }

    return caption;
  });
}
