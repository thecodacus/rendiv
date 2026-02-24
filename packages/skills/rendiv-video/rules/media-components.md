---
name: media-components
description: >
  Embedding images, video, audio, animated images (GIF/APNG/WebP), and iframes
  in rendiv compositions using the built-in media components.
---

# Media Components

Rendiv provides drop-in replacements for native HTML media elements. These
components integrate with the render lifecycle via `holdRender` — they block
frame capture until the media is loaded, ensuring no blank frames in output.

**You MUST use these components instead of native HTML elements** (`<img>`,
`<video>`, `<audio>`, `<iframe>`).

## `<Img>`

Renders an image with automatic render-hold until loaded.

```tsx
import { Img } from '@rendiv/core';

<Img src={staticFile('photo.jpg')} style={{ width: '100%' }} />
```

### Props

Accepts all standard `<img>` HTML attributes, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `holdRenderTimeout` | `number` | `30000` | Timeout in ms before throwing |

### Behavior

- Calls `holdRender()` on mount
- Calls `releaseRender()` on `load`, `error`, or unmount
- Forwards your `onLoad` and `onError` handlers (they run alongside the internal ones)

## `<Video>`

Embeds a video that syncs with rendiv's frame-based timeline.

```tsx
import { Video } from '@rendiv/core';

<Video
  src={staticFile('clip.mp4')}
  startFrom={30}
  endAt={120}
  volume={0.8}
  playbackRate={1}
  style={{ width: '100%' }}
/>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | — | Video URL (required) |
| `startFrom` | `number` | `0` | Frame offset into the video |
| `endAt` | `number` | — | Frame at which to stop (relative to video) |
| `volume` | `number` | `1` | Volume (0 to 1) |
| `playbackRate` | `number` | `1` | Playback speed multiplier |
| `muted` | `boolean` | `false` | Mute audio |
| `holdRenderTimeout` | `number` | `30000` | Timeout in ms |
| `style` | `CSSProperties` | — | CSS styles |
| `className` | `string` | — | CSS class name |

Also accepts all standard `<video>` HTML attributes (except `autoPlay`).

### Environment-aware behavior

- **Rendering mode**: Pauses the video and seeks precisely to `(localFrame + startFrom) / fps`
  for each frame. Uses `holdRender` to wait for seek completion.
- **Player/Studio mode**: Plays naturally with drift correction (re-syncs if > 0.1s off).
  Auto-plays/pauses with the timeline.

## `<OffthreadVideo>` (Recommended)

**Best practice: Use `<OffthreadVideo>` instead of `<Video>` for all video embeds.**
It provides better rendering performance by extracting frames via FFmpeg rather than
relying on browser seeking, and handles audio extraction automatically.

```tsx
import { OffthreadVideo } from '@rendiv/core';

<OffthreadVideo src={staticFile('clip.mp4')} startFrom={0} style={{ width: '100%' }} />
```

### Props

Same as `<Video>`: `src`, `startFrom`, `endAt`, `volume`, `playbackRate`, `muted`,
`style`, `className`, `holdRenderTimeout`.

### Behavior

- **Player/Studio mode**: Delegates entirely to `<Video>` (full playback with sync).
- **Rendering mode**: Fetches each frame as an image from an HTTP endpoint
  (`/__offthread_video__?src=...&time=...`) and displays it as an `<img>`.
  Audio track metadata is registered separately so FFmpeg can mux it into the output.
  Uses `holdRender` for each frame fetch and image load.

### Preloading with `premountFor`

Combine `<OffthreadVideo>` with `premountFor` on the parent Sequence to eliminate
buffering when a video scene appears:

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <TitleCard />
  </Series.Sequence>
  {/* Start loading the video 60 frames before it appears */}
  <Series.Sequence durationInFrames={90} premountFor={60}>
    <OffthreadVideo src={staticFile('intro.mp4')} style={{ width: '100%' }} />
  </Series.Sequence>
</Series>
```

During premount the video component mounts invisibly (opacity 0) and starts
buffering, so when the sequence becomes visible playback begins immediately.

## `<Audio>`

Adds audio to a composition.

```tsx
import { Audio } from '@rendiv/core';

<Audio src={staticFile('music.mp3')} volume={0.5} startFrom={0} />
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | — | Audio URL (required) |
| `startFrom` | `number` | `0` | Frame offset into the audio |
| `endAt` | `number` | — | Frame at which to stop |
| `volume` | `number` | `1` | Volume (0 to 1) |
| `playbackRate` | `number` | `1` | Playback speed |
| `muted` | `boolean` | `false` | Mute |

### Behavior

- **Rendering mode**: Returns `null` (not visible in screenshots). Audio metadata is
  registered to a global Map, which the renderer collects after frame capture. FFmpeg
  then trims, delays, adjusts tempo, and mixes all audio tracks into the final output.
- **Player/Studio mode**: Plays and syncs with drift correction, auto-play/pause.

## `<AnimatedImage>`

Renders animated images (GIF, APNG, WebP) with frame-accurate playback on a canvas.

```tsx
import { AnimatedImage } from '@rendiv/core';

<AnimatedImage
  src={staticFile('animation.gif')}
  width={400}
  height={300}
/>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `src` | `string` | — | URL of animated image (required) |
| `width` | `number` | — | Canvas width |
| `height` | `number` | — | Canvas height |
| `style` | `CSSProperties` | — | CSS styles |
| `className` | `string` | — | CSS class |
| `holdRenderTimeout` | `number` | `30000` | Timeout in ms |

### How it works

Uses the `ImageDecoder` API (Chromium) to extract individual frames with their
durations. Maps the rendiv frame to the correct animation frame, accounting for
per-frame timing and looping. Falls back to a static image in non-Chromium browsers.

## `<IFrame>`

Embeds an iframe with render-hold until loaded.

```tsx
import { IFrame } from '@rendiv/core';

<IFrame src="https://example.com" style={{ width: '100%', height: '100%' }} />
```

### Props

Accepts all standard `<iframe>` HTML attributes, plus:

| Prop | Type | Default | Description |
|---|---|---|---|
| `holdRenderTimeout` | `number` | `30000` | Timeout in ms |

Uses the same `holdRender`/`releaseRender` pattern as `<Img>`.
