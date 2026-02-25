# @rendiv/core

The core runtime package. Provides hooks, components, animation utilities, and the composition registration system.

## Installation

```bash
npm install @rendiv/core react react-dom
```

## Hooks

### `useFrame()`

Returns the current frame number. Inside a `<Sequence>`, returns the local frame (offset from the sequence start).

```ts
const frame = useFrame(); // 0, 1, 2, ...
```

### `useCompositionConfig()`

Returns the active composition's configuration.

```ts
const { fps, durationInFrames, width, height } = useCompositionConfig();
```

## Components

### `<Composition>`

Registers a video composition. Renders nothing — purely declarative registration.

```tsx
<Composition
  id="MyVideo"
  component={MyComponent}
  durationInFrames={150}
  fps={30}
  width={1920}
  height={1080}
/>
```

### `<Still>`

Like `<Composition>` but for single-frame images (duration is always 1 frame).

```tsx
<Still id="Thumbnail" component={MyThumbnail} width={1280} height={720} />
```

### `<Sequence>`

Shows children only during a specific frame window. Children see local frame starting at 0.

```tsx
<Sequence from={30} durationInFrames={60} playbackRate={1.5} premountFor={30}>
  <MyScene />
</Sequence>
```

Props: `from`, `durationInFrames`, `name`, `layout`, `style`, `trackIndex`, `playbackRate`, `premountFor`.

- `playbackRate` — speed multiplier (2 = double speed, 0.5 = half). Nested rates compound.
- `premountFor` — mount children N frames before visible for media preloading.

### `<Series>`

Chains sequences back-to-back automatically.

```tsx
<Series>
  <Series.Sequence durationInFrames={60}><Intro /></Series.Sequence>
  <Series.Sequence durationInFrames={90} premountFor={60}><Main /></Series.Sequence>
</Series>
```

`<Series.Sequence>` accepts `premountFor` and `playbackRate` in addition to `durationInFrames`, `offset`, `name`, `layout`, `style`, and `trackIndex`.

### `<Loop>`

Repeats children using modulo arithmetic.

```tsx
<Loop durationInFrames={30}><Pulse /></Loop>
```

### `<Freeze>`

Locks children at a specific frame number.

```tsx
<Freeze frame={0}><Snapshot /></Freeze>
```

### `<Fill>`

Full-size container matching composition dimensions. Supports `ref` via `forwardRef`.

```tsx
<Fill style={{ background: '#000' }}>...</Fill>
```

### `<Folder>`

Groups compositions in the Studio sidebar.

```tsx
<Folder name="Demos">...</Folder>
```

### `<CanvasElement>`

Scopes timeline override identity so a composition's overrides work when nested inside other compositions. **Always wrap your composition content with this.**

```tsx
import { CanvasElement, Series } from '@rendiv/core';

export const MyScene = () => (
  <CanvasElement id="MyScene">
    <Series>
      <Series.Sequence durationInFrames={60}><Intro /></Series.Sequence>
      <Series.Sequence durationInFrames={90}><Main /></Series.Sequence>
    </Series>
  </CanvasElement>
);
```

Props: `id` (required — must match the `<Composition>` id), `children`.

Without `<CanvasElement>`, overrides saved under `MyScene/...` keys won't apply when the component is rendered inside another composition.

## Media Components

### `<Img>`

Image with holdRender. Blocks capture until loaded.

```tsx
<Img src="/photo.jpg" style={{ width: '100%' }} />
```

### `<Video>`

Video synced to frame clock. Seeks precisely during rendering.

```tsx
<Video src="/clip.mp4" volume={0.5} startFrom={30} />
```

### `<Audio>`

Audio with per-frame volume. Renders null during frame capture; audio metadata is collected and muxed into the final output by FFmpeg.

```tsx
<Audio src="/music.mp3" volume={0.8} />
```

### `<OffthreadVideo>` (Recommended)

Pixel-perfect video via FFmpeg extraction during rendering. **Preferred over `<Video>`** for better rendering performance. Audio tracks are automatically muxed into the output.

```tsx
<OffthreadVideo src="/intro.mp4" />
```

### `<AnimatedImage>`

GIF, AVIF, animated WebP support via canvas.

```tsx
<AnimatedImage src="/sticker.gif" />
```

### `<IFrame>`

Iframe with holdRender integration.

```tsx
<IFrame src="https://example.com" />
```

## Animation

### `interpolate(value, inputRange, outputRange, options?)`

Maps a value from one range to another.

```ts
interpolate(frame, [0, 30], [0, 1], { extrapolateRight: 'clamp' });
```

### `spring(options)`

Physics-based spring animation (0 → 1).

```ts
spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 1 } });
```

### `getSpringDuration(options)`

Calculate how many frames a spring takes to settle.

### `Easing`

Easing functions: `linear`, `ease`, `easeIn`, `easeOut`, `easeInOut`, `bezier(x1, y1, x2, y2)`, `bounce`, `elastic`.

### `blendColors(value, inputRange, colorRange)`

Interpolate between CSS colors.

```ts
blendColors(frame, [0, 60], ['#ff0000', '#0000ff']);
```

## Render Control

### `holdRender(label, options?)`

Block frame capture. Returns a handle number.

### `releaseRender(handle)`

Unblock frame capture for the given handle.

### `abortRender(error)`

Abort the entire render with an error message.

## Utilities

### `staticFile(path)`

Resolve a path relative to the project's `public/` directory.

### `getInputProps()`

Get input props passed to the composition at render time.
