---
name: gif
description: >
  Rendering animated GIFs with frame-accurate playback in rendiv compositions
  using the @rendiv/gif package.
---

# Animated GIFs — @rendiv/gif

Render animated GIFs as frame-accurate video components. Decodes GIF files using
`gifuct-js`, draws frames to a `<canvas>`, and integrates with rendiv's render
lifecycle via `holdRender`.

## Installation

```bash
pnpm add @rendiv/gif
```

Peer dependencies: `react`, `@rendiv/core`.

## Basic Usage

```tsx
import { Fill } from '@rendiv/core';
import { Gif } from '@rendiv/gif';

export function MyScene(): React.ReactElement {
  return (
    <Fill style={{ backgroundColor: '#000' }}>
      <Gif
        src="https://example.com/animation.gif"
        width={400}
        height={300}
        fit="cover"
      />
    </Fill>
  );
}
```

## `<Gif>` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | (required) | URL or path to the GIF file |
| `width` | `number` | GIF native | Display width in pixels |
| `height` | `number` | GIF native | Display height in pixels |
| `fit` | `'fill' \| 'contain' \| 'cover'` | `'fill'` | How the GIF fits within dimensions |
| `playbackRate` | `number` | `1` | Speed multiplier (0.5 = half speed, 2 = double) |
| `loop` | `boolean` | `true` | Whether the animation loops |
| `style` | `CSSProperties` | — | CSS styles on the canvas element |
| `className` | `string` | — | CSS class name |
| `holdRenderTimeout` | `number` | `30000` | Timeout in ms for holdRender |

## How It Works

1. On mount, calls `holdRender()` to block frame capture.
2. Fetches and decodes the GIF via `gifuct-js` (`parseGIF` + `decompressFrames`).
3. Calls `releaseRender()` once decoded — the renderer can now capture.
4. Each rendiv frame: calculates playback position in ms from `localFrame / fps`,
   walks cumulative frame delays to find the correct GIF frame index.
5. Renders to a `<canvas>` using an offscreen compositing canvas for proper
   GIF disposal handling (methods 0–3).
6. Optimizes forward playback (renders only new frames) and handles backward
   seeks by re-compositing from frame 0.

## Preloading

Use `preloadGif()` to start decoding before the component mounts:

```tsx
import { preloadGif } from '@rendiv/gif';

// Call early — e.g., at module scope or in a parent effect
preloadGif('https://example.com/animation.gif');
```

GIFs are cached by URL in a module-level Map, so the same GIF is never decoded twice.

## Getting Duration

```tsx
import { getGifDurationInSeconds } from '@rendiv/gif';

const duration = await getGifDurationInSeconds('https://example.com/animation.gif');
// Use to calculate durationInFrames: Math.ceil(duration * fps)
```

## Playback Rate

```tsx
// Slow motion
<Gif src={url} playbackRate={0.5} />

// Double speed
<Gif src={url} playbackRate={2} />

// Reversed time mapping is not supported — use negative spring values
// in a parent to offset the frame if needed
```

## Important Notes

- **Use `<Gif>` instead of `<AnimatedImage>`** when you need playback rate control,
  fit modes, or cross-browser GIF decoding (no `ImageDecoder` dependency).
- **`<AnimatedImage>` from `@rendiv/core`** uses the browser's `ImageDecoder` API
  (Chromium-only). `<Gif>` uses `gifuct-js` which works everywhere.
- **Canvas-based rendering** — the GIF is drawn to a `<canvas>`, which works
  correctly with Playwright screenshot capture during rendering.
- **GIF disposal types** are handled: no disposal (0/1), restore to background (2),
  and restore to previous (3, treated as keep).
