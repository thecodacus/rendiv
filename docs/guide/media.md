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

In rendering mode, `<Audio>` renders nothing (audio is handled separately by FFmpeg). In player mode, it syncs with playback.

## OffthreadVideo

Pixel-perfect frame extraction via FFmpeg. Use this when you need exact frame accuracy during rendering (standard `<Video>` relies on browser seeking which can be slightly off).

```tsx
import { OffthreadVideo } from '@rendiv/core';

<OffthreadVideo src="/clips/precise.mp4" />
```

Falls back to `<Video>` behavior in player/studio mode.

## AnimatedImage

Supports GIF, animated WebP, and AVIF files. Decodes frames in JavaScript and renders to a `<canvas>`.

```tsx
import { AnimatedImage } from '@rendiv/core';

<AnimatedImage src="/stickers/wave.gif" style={{ width: 200 }} />
```

## IFrame

Embeds an iframe with holdRender integration.

```tsx
import { IFrame } from '@rendiv/core';

<IFrame src="https://example.com" style={{ width: '100%', height: '100%' }} />
```
