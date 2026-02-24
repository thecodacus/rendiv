# Media Components

All media components automatically call `holdRender()` on mount and `releaseRender()` on load, ensuring resources are ready before frame capture.

## Img

Renders an image with guaranteed load before capture.

```tsx
import { Img } from '@rendiv/core';

<Img src="/photos/hero.jpg" style={{ width: '100%' }} />
```

## Video

Embeds a video file synced to the frame clock.

```tsx
import { Video } from '@rendiv/core';

<Video src="/clips/intro.mp4" />
```

In **rendering mode**, the video pauses and seeks precisely to each frame. In **player/studio mode**, it syncs playback naturally with drift correction.

Props: `src`, `volume` (0-1), `startFrom`, `endAt`, `muted`, `playbackRate`, plus standard HTML video attributes.

## Audio

Embeds audio with per-frame volume control.

```tsx
import { Audio } from '@rendiv/core';

<Audio src="/music/background.mp3" volume={0.8} />
```

In rendering mode, `<Audio>` renders nothing visually. Audio metadata is collected by the renderer and FFmpeg mixes all audio tracks (with correct timing, volume, and playback rate) into the final output. In player/studio mode, it syncs playback naturally.

## OffthreadVideo (Recommended)

**Best practice: Use `<OffthreadVideo>` instead of `<Video>` for all video embeds.** It provides pixel-perfect frame extraction via FFmpeg during rendering (standard `<Video>` relies on browser seeking which can be slightly off), and handles audio extraction automatically.

```tsx
import { OffthreadVideo } from '@rendiv/core';

<OffthreadVideo src="/clips/intro.mp4" />
```

Falls back to `<Video>` behavior in player/studio mode. Audio tracks from both `<Video>` and `<OffthreadVideo>` are automatically muxed into the rendered output by FFmpeg.

### Preloading with premountFor

Combine with `premountFor` on the parent Sequence to eliminate buffering:

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <TitleCard />
  </Series.Sequence>
  {/* Start loading 60 frames before the sequence appears */}
  <Series.Sequence durationInFrames={90} premountFor={60}>
    <OffthreadVideo src={staticFile('intro.mp4')} style={{ width: '100%' }} />
  </Series.Sequence>
</Series>
```

During premount, the component mounts invisibly and starts buffering so playback begins immediately when visible.

## AnimatedImage

Supports GIF, animated WebP, and AVIF files. Decodes frames in JavaScript and renders to a `<canvas>`.

```tsx
import { AnimatedImage } from '@rendiv/core';

<AnimatedImage src="/stickers/wave.gif" style={{ width: 200 }} />
```

## Gif (`@rendiv/gif`)

Animated GIF component with playback rate control, fit modes, and cross-browser decoding via `gifuct-js`. Use this when you need more control than `<AnimatedImage>`.

```tsx
import { Gif } from '@rendiv/gif';

<Gif src="/stickers/wave.gif" width={400} height={300} fit="cover" playbackRate={0.5} />
```

Props: `src`, `width`, `height`, `fit` (`fill` | `contain` | `cover`), `playbackRate`, `loop`, `style`, `className`. See the [full docs](/packages/gif).

## Captions (`@rendiv/captions`)

Parse SRT files or Whisper transcripts and render caption overlays with optional word-by-word highlighting.

```tsx
import { parseSrt, CaptionRenderer } from '@rendiv/captions';

const captions = parseSrt(srtString);

<CaptionRenderer
  captions={captions}
  align="bottom"
  activeStyle={{ fontSize: 32, color: '#fff' }}
/>
```

Supports `createHighlightedCaptions()` for TikTok/Reels-style word highlighting. See the [full docs](/packages/captions).

## IFrame

Embeds an iframe with holdRender integration.

```tsx
import { IFrame } from '@rendiv/core';

<IFrame src="https://example.com" style={{ width: '100%', height: '100%' }} />
```
