# @rendiv/transitions

Transition primitives for animating between scenes. Provides `<TransitionSeries>` and built-in presentations.

## Installation

```bash
npm install @rendiv/transitions @rendiv/core react react-dom
```

## Usage

```tsx
import { TransitionSeries } from '@rendiv/transitions';
import { fade } from '@rendiv/transitions';
import { linearTiming } from '@rendiv/transitions';

export const MyVideo = () => (
  <TransitionSeries>
    <TransitionSeries.Sequence durationInFrames={60}>
      <SceneA />
    </TransitionSeries.Sequence>
    <TransitionSeries.Transition
      timing={linearTiming({ durationInFrames: 15 })}
      presentation={fade()}
    />
    <TransitionSeries.Sequence durationInFrames={60}>
      <SceneB />
    </TransitionSeries.Sequence>
  </TransitionSeries>
);
```

## Presentations

### `fade()`

Crossfade between scenes.

### `slide(options?)`

Slide one scene over another.

```ts
slide({ direction: 'from-left' })
// Directions: 'from-left', 'from-right', 'from-top', 'from-bottom'
```

### `wipe(options?)`

Wipe reveal from one direction.

```ts
wipe({ direction: 'from-left' })
```

### `flip(options?)`

3D flip transition.

```ts
flip({ direction: 'from-left' })
```

### `clockWipe(options?)`

Circular clock-sweep wipe.

```ts
clockWipe()
```

## Timings

### `linearTiming(options)`

Linear transition over a fixed number of frames.

```ts
linearTiming({ durationInFrames: 15 })
```

### `springTiming(options)`

Physics-based spring timing.

```ts
springTiming({ durationInFrames: 20, config: { damping: 12 } })
```
