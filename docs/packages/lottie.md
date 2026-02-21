# @rendiv/lottie

Embed frame-accurate [Lottie](https://airbnb.io/lottie/) animations inside rendiv compositions. Uses [lottie-web](https://github.com/airbnb/lottie-web) under the hood.

## Installation

```bash
npm install @rendiv/lottie lottie-web
```

Peer dependencies: `react`, `react-dom`, `@rendiv/core`.

## Basic Usage

```tsx
import { Fill } from '@rendiv/core';
import { Lottie } from '@rendiv/lottie';
import animData from './my-animation.json';

export function MyScene() {
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

## `<Lottie>` Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `animationData` | `object` | required | Parsed Lottie JSON. **Memoize** with `useMemo` if constructed inline. |
| `renderer` | `'svg' \| 'canvas' \| 'html'` | `'svg'` | lottie-web renderer engine. SVG has the best feature coverage. |
| `loop` | `boolean` | `false` | Wrap the animation when rendiv frames exceed the Lottie duration. |
| `direction` | `'forward' \| 'backward'` | `'forward'` | Playback direction. |
| `playbackRate` | `number` | `1` | Speed multiplier mapping rendiv frames to Lottie frames. |
| `style` | `CSSProperties` | — | Container style. |
| `className` | `string` | — | Container class name. |

## How It Works

1. On mount, `<Lottie>` loads the animation with `lottie.loadAnimation({ autoplay: false })`.
2. It calls `holdRender()` until the `DOMLoaded` event fires — the renderer waits before capturing the frame.
3. On every rendiv frame change, it calculates the target Lottie frame:
   - `targetFrame = localFrame * playbackRate`
   - If `loop` is true: wraps with modulo
   - If `direction === 'backward'`: reverses
4. Calls `anim.goToAndStop(targetFrame, true)` for frame-accurate seeking.
5. On unmount, destroys the animation and releases any pending holds.

## Frame Mapping

A Lottie file at 30 fps inside a rendiv composition at 30 fps maps 1:1. If the frame rates differ, adjust `playbackRate` accordingly:

```tsx
// Lottie file is 24 fps, composition is 30 fps
<Lottie animationData={anim} playbackRate={24 / 30} />
```

## Using With Sequences

```tsx
import { Sequence } from '@rendiv/core';
import { Lottie } from '@rendiv/lottie';
import introAnim from './intro.json';
import outroAnim from './outro.json';

export function AnimatedIntro() {
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

The `<Lottie>` component reads `SequenceContext` internally, so it automatically adjusts to the local frame offset of its parent `<Sequence>`.

## Tips

- **Memoize `animationData`** — if you construct the data inline, wrap it in `useMemo` to prevent re-initialization on every render.
- **No CSS animations** — the Lottie component is fully frame-driven. Do not rely on lottie-web's built-in playback — it uses wall-clock time.
- **SVG renderer** is recommended for the best feature coverage and rendering quality.
