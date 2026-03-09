import type { SplitMode, SplitUnit } from './types';

export function splitText(text: string, mode: SplitMode): SplitUnit[] {
  switch (mode) {
    case 'character':
      return [...text].map((char, i) => ({
        text: char,
        index: i,
        isWhitespace: /\s/.test(char),
      }));
    case 'word':
      return text
        .split(/(\s+)/)
        .filter(Boolean)
        .map((part, i) => ({
          text: part,
          index: i,
          isWhitespace: /^\s+$/.test(part),
        }));
    case 'line':
      return text.split('\n').map((line, i) => ({
        text: line,
        index: i,
        isWhitespace: line.trim().length === 0,
      }));
  }
}
