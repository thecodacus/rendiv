# Core Concepts

## Frame-Driven Rendering

A Rendiv video is a **pure function of the current frame number**. Every frame, your React component re-renders with a new frame value. By varying your output based on this number, you create animation.

```tsx
import { useFrame } from '@rendiv/core';

export const MyScene = () => {
  const frame = useFrame(); // 0, 1, 2, 3, ...
  return <div style={{ opacity: frame / 30 }}>Fading in</div>;
};
```

There is no imperative animation API. No timelines to manage. Just React re-rendering at each frame.

## Compositions

A `<Composition>` registers a video with its metadata. It renders nothing to the DOM — it's purely a registration mechanism.

```tsx
import { setRootComponent, Composition } from '@rendiv/core';

setRootComponent(() => (
  <Composition
    id="MyVideo"
    component={MyScene}
    durationInFrames={150}  // 5 seconds at 30fps
    fps={30}
    width={1920}
    height={1080}
  />
));
```

You can register multiple compositions in a single entry point. The Studio, Player, and Renderer each read this registry.

## CanvasElement

**Always wrap your composition's content with `<CanvasElement id="...">`**. This makes the composition self-contained — timeline overrides (position, scale, timing edits from Studio) work correctly whether the composition is rendered standalone or nested inside another "master" composition.

```tsx
import { CanvasElement, Series } from '@rendiv/core';

export const MyVideo = () => (
  <CanvasElement id="MyVideo">
    <Series>
      <Series.Sequence durationInFrames={60}>
        <TitleCard />
      </Series.Sequence>
      <Series.Sequence durationInFrames={90}>
        <MainContent />
      </Series.Sequence>
    </Series>
  </CanvasElement>
);
```

Without `<CanvasElement>`, overrides saved under `MyVideo/...` keys won't apply when the component is used inside a different composition, because the namePath prefix changes to the parent's ID.

## Sequences

`<Sequence>` controls **when** a component appears in the timeline.

```tsx
import { Sequence } from '@rendiv/core';

export const MyVideo = () => (
  <>
    <Sequence from={0} durationInFrames={60}>
      <TitleCard />  {/* Frames 0-59 */}
    </Sequence>
    <Sequence from={60} durationInFrames={90}>
      <MainContent />  {/* Frames 60-149 */}
    </Sequence>
  </>
);
```

Children of a `<Sequence>` see their own local frame starting at 0. Inside `<MainContent>`, `useFrame()` returns 0 at the global frame 60.

## Series

`<Series>` chains sequences automatically without manual offset math.

```tsx
import { Series } from '@rendiv/core';

export const MyVideo = () => (
  <Series>
    <Series.Sequence durationInFrames={60}>
      <Intro />
    </Series.Sequence>
    <Series.Sequence durationInFrames={90}>
      <MainContent />
    </Series.Sequence>
    <Series.Sequence durationInFrames={60}>
      <Outro />
    </Series.Sequence>
  </Series>
);
```

### Premounting

Use `premountFor` to mount children early so media elements can preload before the sequence becomes visible. This is especially useful with `<OffthreadVideo>`:

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <TitleCard />
  </Series.Sequence>
  {/* Video starts loading 60 frames before it appears */}
  <Series.Sequence durationInFrames={90} premountFor={60}>
    <OffthreadVideo src={staticFile('intro.mp4')} style={{ width: '100%' }} />
  </Series.Sequence>
</Series>
```

During premount, children render invisibly with a frozen timeline at the sequence's start frame.

## Loop

`<Loop>` repeats its children using modulo arithmetic.

```tsx
import { Loop } from '@rendiv/core';

<Loop durationInFrames={30}>
  <PulsingDot />  {/* Sees frames 0-29, repeating forever */}
</Loop>
```

## Freeze

`<Freeze>` locks children at a specific frame.

```tsx
import { Freeze } from '@rendiv/core';

<Freeze frame={0}>
  <MyScene />  {/* Always sees frame 0 */}
</Freeze>
```

## Fill

`<Fill>` is a full-size container matching the composition dimensions.

```tsx
import { Fill } from '@rendiv/core';

<Fill style={{ background: '#000', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
  <h1>Centered content</h1>
</Fill>
```

## Folders

`<Folder>` groups compositions in the Studio sidebar.

```tsx
import { Folder, Composition } from '@rendiv/core';

<Folder name="Demos">
  <Composition id="Demo1" ... />
  <Composition id="Demo2" ... />
</Folder>
```

## holdRender / releaseRender

The renderer captures screenshots frame-by-frame. If an async resource (font, image, data) hasn't loaded yet, the frame would be wrong. The hold/release pattern blocks frame capture until resources are ready.

```ts
import { holdRender, releaseRender } from '@rendiv/core';

const handle = holdRender('Loading data...', { timeoutInMilliseconds: 10000 });
const data = await fetchMyData();
// update state
releaseRender(handle);
```

Media components (`<Img>`, `<Video>`, `<IFrame>`, `<AnimatedImage>`) and font hooks (`useLocalFont`, `useFont`) call holdRender/releaseRender automatically.
