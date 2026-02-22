import type { Caption, CaptionWord, HighlightedCaption } from './types';

export interface HighlightedCaptionsOptions {
  /** Maximum number of words per visible chunk. Default: 3 */
  maxWordsPerChunk?: number;
}

/**
 * Re-chunk captions with word-level timing into short segments
 * suitable for TikTok/Reels style word-by-word highlighting.
 *
 * Each returned HighlightedCaption contains a `words` array (the chunk)
 * and a `highlightedWordIndex` indicating which word is active.
 * Multiple entries may share the same chunk text but differ in the
 * highlighted word, covering the full time range of each word.
 */
export function createHighlightedCaptions(
  captions: Caption[],
  options?: HighlightedCaptionsOptions,
): HighlightedCaption[] {
  const maxWords = options?.maxWordsPerChunk ?? 3;
  const result: HighlightedCaption[] = [];

  for (const caption of captions) {
    if (!caption.words || caption.words.length === 0) {
      // No word-level timing — emit the full caption as a single entry
      result.push({
        text: caption.text,
        startMs: caption.startMs,
        endMs: caption.endMs,
        words: caption.words,
        highlightedWordIndex: 0,
      });
      continue;
    }

    // Split words into chunks of maxWords
    const words = caption.words;
    for (let chunkStart = 0; chunkStart < words.length; chunkStart += maxWords) {
      const chunkEnd = Math.min(chunkStart + maxWords, words.length);
      const chunkWords: CaptionWord[] = words.slice(chunkStart, chunkEnd);
      const chunkText = chunkWords.map((w) => w.text).join(' ');

      // For each word in the chunk, create a HighlightedCaption entry
      for (let wi = 0; wi < chunkWords.length; wi++) {
        const word = chunkWords[wi];
        result.push({
          text: chunkText,
          startMs: word.startMs,
          endMs: word.endMs,
          words: chunkWords,
          highlightedWordIndex: wi,
        });
      }
    }
  }

  return result;
}
