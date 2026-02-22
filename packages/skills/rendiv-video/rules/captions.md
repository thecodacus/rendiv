---
name: captions
description: >
  Adding subtitles and captions to rendiv compositions — parsing SRT files,
  Whisper transcripts, word-by-word highlighting, and rendering overlays.
---

# Captions — @rendiv/captions

Parse subtitle files, create highlighted word-by-word captions (TikTok/Reels
style), and render caption overlays in rendiv compositions.

## Installation

```bash
pnpm add @rendiv/captions
```

Peer dependencies: `react`, `@rendiv/core`.

## Basic Usage

### SRT Subtitles

```tsx
import { Fill } from '@rendiv/core';
import { parseSrt, CaptionRenderer } from '@rendiv/captions';

const srt = `1
00:00:00,500 --> 00:00:02,000
Hello world

2
00:00:02,500 --> 00:00:04,000
Welcome to rendiv`;

const captions = parseSrt(srt);

export function SubtitledVideo(): React.ReactElement {
  return (
    <Fill>
      {/* Your video content */}
      <CaptionRenderer
        captions={captions}
        align="bottom"
        padding={40}
        activeStyle={{
          fontSize: 32,
          color: '#fff',
          fontWeight: 600,
          textShadow: '0 2px 8px rgba(0,0,0,0.8)',
        }}
      />
    </Fill>
  );
}
```

### Word-by-Word Highlighting

```tsx
import { parseSrt, createHighlightedCaptions, CaptionRenderer } from '@rendiv/captions';
import type { Caption } from '@rendiv/captions';

// Captions with word-level timing
const captions: Caption[] = [
  {
    text: 'Build stunning videos',
    startMs: 500,
    endMs: 2000,
    words: [
      { text: 'Build', startMs: 500, endMs: 900 },
      { text: 'stunning', startMs: 900, endMs: 1400 },
      { text: 'videos', startMs: 1400, endMs: 2000 },
    ],
  },
];

const highlighted = createHighlightedCaptions(captions, { maxWordsPerChunk: 3 });

export function HighlightedSubs(): React.ReactElement {
  return (
    <Fill>
      <CaptionRenderer
        captions={highlighted}
        align="bottom"
        activeStyle={{ fontSize: 36, color: 'rgba(255,255,255,0.5)' }}
        highlightedWordStyle={{ color: '#ff0', fontWeight: 800 }}
      />
    </Fill>
  );
}
```

## Parsing Functions

### `parseSrt(srt: string): Caption[]`

Parses SRT subtitle format:

```
1
00:00:00,500 --> 00:00:02,000
Caption text here
```

Supports both `,` and `.` as millisecond separators.

### `serializeSrt(captions: Caption[]): string`

Converts `Caption[]` back to SRT format string.

### `parseWhisperTranscript(json: WhisperVerboseJson): Caption[]`

Parses OpenAI Whisper verbose JSON output. Timestamps in seconds are converted
to milliseconds. Word-level timing is preserved when present.

```tsx
import { parseWhisperTranscript } from '@rendiv/captions';

const whisperOutput = {
  segments: [
    { text: 'Hello world', start: 0.5, end: 2.0, words: [
      { word: 'Hello', start: 0.5, end: 1.0 },
      { word: 'world', start: 1.0, end: 2.0 },
    ]},
  ],
};

const captions = parseWhisperTranscript(whisperOutput);
```

## `createHighlightedCaptions(captions, options?)`

Splits word-level captions into chunks for TikTok/Reels-style highlighting.

| Option | Type | Default | Description |
|---|---|---|---|
| `maxWordsPerChunk` | `number` | `3` | Max words visible at once |

Each word in a chunk gets its own `HighlightedCaption` entry with
`highlightedWordIndex` pointing to the active word during that word's time span.

## `<CaptionRenderer>` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `captions` | `Caption[] \| HighlightedCaption[]` | (required) | Captions to display |
| `style` | `CSSProperties` | — | Container style |
| `activeStyle` | `CSSProperties` | — | Style for the active caption text |
| `highlightedWordStyle` | `CSSProperties` | — | Style for the highlighted word |
| `align` | `'top' \| 'center' \| 'bottom'` | `'bottom'` | Vertical alignment |
| `padding` | `number` | `40` | Padding from edge in pixels |

### How It Works

1. Reads the current frame via `useFrame()` and fps via `useCompositionConfig()`.
2. Converts frame to milliseconds: `currentMs = (frame / fps) * 1000`.
3. Finds the active caption where `startMs <= currentMs < endMs`.
4. Returns `null` if no caption is active at the current time.
5. If the active caption is a `HighlightedCaption` with words, renders each word
   as a `<span>` with the `highlightedWordStyle` on the active word.

## Utility Functions

### `msToFrame(ms, fps): number`

Convert milliseconds to a frame number.

### `frameToMs(frame, fps): number`

Convert a frame number to milliseconds.

## Types

```ts
interface CaptionWord {
  text: string;
  startMs: number;
  endMs: number;
}

interface Caption {
  text: string;
  startMs: number;
  endMs: number;
  words?: CaptionWord[];
}

interface HighlightedCaption extends Caption {
  highlightedWordIndex: number;
}

interface WhisperVerboseJson {
  segments: WhisperSegment[];
}
```

## Important Notes

- **Pure CSS/DOM rendering** — captions are rendered as styled divs/spans, not canvas.
  This means they're resolution-independent and work with any font.
- **Absolute positioning** — `<CaptionRenderer>` positions itself absolutely within
  its parent. Make sure the parent has `position: relative` or is a `<Fill>`.
- **No word timing required** — `parseSrt()` returns plain `Caption[]` without
  word-level timing. Word-by-word highlighting requires `words` with individual
  `startMs`/`endMs` on each word.
