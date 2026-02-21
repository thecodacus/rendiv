# Lottie Animations — @rendiv/lottie

Embed frame-accurate Lottie animations inside rendiv compositions using
[lottie-web](https://github.com/airbnb/lottie-web) under the hood.

## Installation

```bash
pnpm add @rendiv/lottie lottie-web
```

Peer dependencies: `react`, `react-dom`, `@rendiv/core`.

## Basic Usage

```tsx
import { useFrame, useCompositionConfig, Fill, interpolate } from '@rendiv/core';
import { Lottie } from '@rendiv/lottie';
import animData from './my-animation.json';

export function MyScene(): React.ReactElement {
  return (
    <Fill style={{ backgroundColor: '#000' }}>
      <Lottie
        animationData={animData}
        loop
        style={{ width: 400, height: 400 }}
      />
    </Fill>
  );
}
```

## Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `animationData` | `object` | (required) | Parsed Lottie JSON. **Memoize** with `useMemo` to avoid re-initialization on re-renders. |
| `renderer` | `'svg' \| 'canvas' \| 'html'` | `'svg'` | lottie-web renderer engine. SVG has the best feature coverage. |
| `loop` | `boolean` | `false` | Wrap the animation when rendiv frames exceed the Lottie duration. |
| `direction` | `'forward' \| 'backward'` | `'forward'` | Playback direction. |
| `playbackRate` | `number` | `1` | Speed multiplier mapping rendiv frames to Lottie frames. |
| `style` | `CSSProperties` | — | Container style. |
| `className` | `string` | — | Container class name. |

## How It Works

1. On mount, `<Lottie>` loads the animation with `lottie.loadAnimation({ autoplay: false })`.
2. It calls `holdRender()` until the `DOMLoaded` event fires — the renderer waits before capturing the frame.
3. On every rendiv frame change, it calculates the target lottie frame:
   - `targetFrame = localFrame * playbackRate`
   - If `loop`: wraps with modulo
   - If `direction === 'backward'`: reverses
4. Calls `anim.goToAndStop(targetFrame, true)` for frame-accurate seeking.
5. On unmount, destroys the animation and releases any pending holds.

## Important Notes

- **Memoize `animationData`**: If you construct the data inline, wrap it in `useMemo` to prevent re-initialization on every render.
- **Frame mapping**: A Lottie file at 30 fps inside a rendiv composition at 30 fps maps 1:1. If the fps differ, adjust `playbackRate` accordingly (e.g., `playbackRate={lottie_fps / composition_fps}`).
- **No CSS animations**: The Lottie component is fully frame-driven. Do not rely on lottie-web's built-in playback — it uses wall-clock time.

## Combining With Sequences

```tsx
import { Sequence, Composition } from '@rendiv/core';
import { Lottie } from '@rendiv/lottie';
import introAnim from './intro.json';
import outroAnim from './outro.json';

export function AnimatedIntro(): React.ReactElement {
  return (
    <>
      <Sequence from={0} durationInFrames={60}>
        <Lottie animationData={introAnim} style={{ width: '100%', height: '100%' }} />
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <Lottie animationData={outroAnim} style={{ width: '100%', height: '100%' }} />
      </Sequence>
    </>
  );
}
```

The `<Lottie>` component reads `SequenceContext` internally, so it automatically
adjusts to the local frame offset of its parent `<Sequence>`.
