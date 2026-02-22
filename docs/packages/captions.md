# @rendiv/captions

Parse subtitle files, create highlighted word-by-word captions (TikTok/Reels style), and render caption overlays in rendiv compositions.

## Installation

```bash
npm install @rendiv/captions
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

export function SubtitledVideo() {
  return (
    <Fill>
      {/* Your video/scene content here */}
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

For TikTok/Reels-style captions where individual words light up as they're spoken:

```tsx
import { createHighlightedCaptions, CaptionRenderer } from '@rendiv/captions';
import type { Caption } from '@rendiv/captions';

const captions: Caption[] = [
  {
    text: 'Build stunning videos with code',
    startMs: 500,
    endMs: 2500,
    words: [
      { text: 'Build', startMs: 500, endMs: 900 },
      { text: 'stunning', startMs: 900, endMs: 1400 },
      { text: 'videos', startMs: 1400, endMs: 1800 },
      { text: 'with', startMs: 1800, endMs: 2100 },
      { text: 'code', startMs: 2100, endMs: 2500 },
    ],
  },
];

const highlighted = createHighlightedCaptions(captions, { maxWordsPerChunk: 3 });

export function HighlightedSubs() {
  return (
    <Fill>
      <CaptionRenderer
        captions={highlighted}
        align="center"
        activeStyle={{ fontSize: 48, color: 'rgba(255,255,255,0.5)' }}
        highlightedWordStyle={{ color: '#ff0', fontWeight: 800 }}
      />
    </Fill>
  );
}
```

## Parsing Functions

### `parseSrt(srt: string): Caption[]`

Parses an SRT subtitle file string into an array of captions.

```
1
00:00:00,500 --> 00:00:02,000
Caption text here

2
00:00:02,500 --> 00:00:04,000
Another caption
```

Supports both `,` and `.` as millisecond separators in timestamps.

### `serializeSrt(captions: Caption[]): string`

Converts a `Caption[]` array back to SRT format.

```tsx
import { parseSrt, serializeSrt } from '@rendiv/captions';

const captions = parseSrt(srtString);
// ... modify captions ...
const newSrt = serializeSrt(captions);
```

### `parseWhisperTranscript(json: WhisperVerboseJson): Caption[]`

Parses OpenAI Whisper verbose JSON output. Converts timestamps from seconds to milliseconds. Preserves word-level timing when available.

```tsx
import { parseWhisperTranscript } from '@rendiv/captions';

const whisperOutput = {
  segments: [
    {
      text: 'Hello world',
      start: 0.5,
      end: 2.0,
      words: [
        { word: 'Hello', start: 0.5, end: 1.0 },
        { word: 'world', start: 1.0, end: 2.0 },
      ],
    },
  ],
};

const captions = parseWhisperTranscript(whisperOutput);
```

## `createHighlightedCaptions(captions, options?)`

Transforms word-timed captions into highlighted chunks for word-by-word display.

| Option | Type | Default | Description |
|------|------|---------|-------------|
| `maxWordsPerChunk` | `number` | `3` | Maximum words visible at once per chunk. |

Each word in a chunk produces a separate `HighlightedCaption` entry covering that word's time span, with `highlightedWordIndex` indicating which word is active.

## `<CaptionRenderer>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `captions` | `Caption[] \| HighlightedCaption[]` | required | The captions to display. |
| `style` | `CSSProperties` | — | Container style. |
| `activeStyle` | `CSSProperties` | — | Style applied to the active caption text. |
| `highlightedWordStyle` | `CSSProperties` | — | Style for the currently highlighted word. |
| `align` | `'top' \| 'center' \| 'bottom'` | `'bottom'` | Vertical alignment. |
| `padding` | `number` | `40` | Padding from edge in pixels. |

### How It Works

1. Reads the current frame via `useFrame()` and fps via `useCompositionConfig()`.
2. Converts frame to milliseconds: `currentMs = (frame / fps) * 1000`.
3. Finds the active caption where `startMs <= currentMs < endMs`.
4. Returns `null` if no caption is active at the current time.
5. If the caption is a `HighlightedCaption` with words, renders each word as a `<span>` with the `highlightedWordStyle` on the active word index.

## Utility Functions

### `msToFrame(ms, fps): number`

Convert a millisecond timestamp to a frame number.

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

interface WhisperSegment {
  text: string;
  start: number;
  end: number;
  words?: WhisperWord[];
}
```

## Tips

- **Absolute positioning**: `<CaptionRenderer>` positions itself absolutely. Make sure its parent has `position: relative` or use `<Fill>`.
- **No word timing needed for plain captions**: `parseSrt()` returns `Caption[]` without word-level timing. Word-by-word highlighting requires `words` with individual timing on each word.
- **Whisper integration**: Use Whisper's `verbose_json` output format to get word-level timing, then pipe through `parseWhisperTranscript()` → `createHighlightedCaptions()` → `<CaptionRenderer>`.
- **Custom rendering**: If you need more control than `<CaptionRenderer>` provides, use the parsing functions directly and build your own renderer with `useFrame()`.
