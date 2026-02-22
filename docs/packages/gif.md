# @rendiv/gif

Render animated GIFs with frame-accurate playback inside rendiv compositions. Uses [gifuct-js](https://github.com/matt-way/gifuct-js) for cross-browser GIF decoding and draws frames to a `<canvas>`.

## Installation

```bash
npm install @rendiv/gif
```

Peer dependencies: `react`, `@rendiv/core`.

## Basic Usage

```tsx
import { Fill } from '@rendiv/core';
import { Gif } from '@rendiv/gif';

export function MyScene() {
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
|------|------|---------|-------------|
| `src` | `string` | required | URL or path to the GIF file. |
| `width` | `number` | GIF native width | Display width in pixels. |
| `height` | `number` | GIF native height | Display height in pixels. |
| `fit` | `'fill' \| 'contain' \| 'cover'` | `'fill'` | How the GIF fits within the given dimensions. |
| `playbackRate` | `number` | `1` | Speed multiplier. `0.5` = half speed, `2` = double speed. |
| `loop` | `boolean` | `true` | Whether the animation loops when it reaches the end. |
| `style` | `CSSProperties` | — | CSS styles applied to the canvas element. |
| `className` | `string` | — | CSS class name. |
| `holdRenderTimeout` | `number` | `30000` | Timeout in ms before throwing during render hold. |

## How It Works

1. On mount, `<Gif>` calls `holdRender()` to block frame capture until the GIF is loaded and decoded.
2. Fetches the GIF binary and decodes it via `gifuct-js` (`parseGIF` + `decompressFrames`).
3. Calls `releaseRender()` once decoded — the renderer can now capture frames.
4. On each rendiv frame, calculates the playback position in milliseconds from `localFrame / fps`, then walks cumulative frame delays to find the correct GIF frame index.
5. Draws to a `<canvas>` using an offscreen compositing canvas that handles proper GIF disposal (methods 0–3).
6. Optimizes forward playback by only rendering new frames. For backward seeks, re-composites from frame 0.

## Preloading

Start decoding a GIF before the component mounts:

```tsx
import { preloadGif } from '@rendiv/gif';

// Call early — at module scope or in a parent effect
preloadGif('https://example.com/animation.gif');
```

GIFs are cached by URL in a module-level Map — the same GIF is never decoded twice.

## Getting Duration

Calculate the total GIF duration to set `durationInFrames`:

```tsx
import { getGifDurationInSeconds } from '@rendiv/gif';

const duration = await getGifDurationInSeconds('https://example.com/animation.gif');
const durationInFrames = Math.ceil(duration * 30); // at 30 fps
```

## Playback Rate

```tsx
// Normal speed
<Gif src={url} />

// Slow motion (half speed)
<Gif src={url} playbackRate={0.5} />

// Double speed
<Gif src={url} playbackRate={2} />
```

## Using With Sequences

```tsx
import { Sequence } from '@rendiv/core';
import { Gif } from '@rendiv/gif';

export function GifTimeline() {
  return (
    <>
      <Sequence from={0} durationInFrames={60}>
        <Gif src="https://example.com/intro.gif" width={800} height={600} />
      </Sequence>
      <Sequence from={60} durationInFrames={90}>
        <Gif src="https://example.com/main.gif" width={800} height={600} />
      </Sequence>
    </>
  );
}
```

The `<Gif>` component reads rendiv contexts internally, so it automatically adjusts to the local frame offset of its parent `<Sequence>`.

## `<Gif>` vs `<AnimatedImage>`

| Feature | `<Gif>` (`@rendiv/gif`) | `<AnimatedImage>` (`@rendiv/core`) |
|---|---|---|
| Decoding | `gifuct-js` (works everywhere) | `ImageDecoder` API (Chromium only) |
| Playback rate | Yes | No |
| Fit modes | `fill`, `contain`, `cover` | No |
| Formats | GIF only | GIF, APNG, WebP |

Use `<Gif>` when you need playback rate control, fit modes, or cross-browser support. Use `<AnimatedImage>` for multi-format support with the Chromium-based renderer.
