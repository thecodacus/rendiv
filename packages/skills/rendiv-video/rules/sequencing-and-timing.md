---
name: sequencing-and-timing
description: >
  Time-shifting with Sequence, back-to-back playback with Series, looping with
  Loop, and freezing frames with Freeze.
---

# Sequencing and Timing

## `useFrame()`

Returns the current frame number relative to the nearest enclosing `<Sequence>`.
At the top level (no Sequence), it returns the absolute composition frame.

```tsx
import { useFrame } from '@rendiv/core';

export const Counter: React.FC = () => {
  const frame = useFrame();
  return <div>{frame}</div>;
};
```

## `useCompositionConfig()`

Returns the composition's configuration:

```tsx
import { useCompositionConfig } from '@rendiv/core';

const { id, width, height, fps, durationInFrames } = useCompositionConfig();
```

## `<Sequence>`

Time-shifts its children to start at a specific frame. Children see frame 0 when
the parent's frame reaches `from`.

```tsx
import { Sequence } from '@rendiv/core';

<Sequence from={30} durationInFrames={60}>
  <FadeIn />  {/* useFrame() returns 0 when parent is at frame 30 */}
</Sequence>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `from` | `number` | `0` | Parent frame at which this sequence begins |
| `durationInFrames` | `number` | `Infinity` | How many frames this sequence is visible |
| `name` | `string` | — | Display name in Studio timeline |
| `layout` | `'absolute-fill' \| 'none'` | `'absolute-fill'` | Wrapper layout |
| `style` | `CSSProperties` | — | Additional styles |

### Layout modes

- `'absolute-fill'` (default): Wraps children in a `<Fill>` component (absolute positioning, fills parent).
- `'none'`: Renders children without any wrapper element.

### Visibility

A Sequence renders `null` (hides its children) when the current frame is before
`from` or after `from + durationInFrames`.

## `<Series>`

Plays `<Series.Sequence>` children back-to-back with automatically calculated start times.

```tsx
import { Series } from '@rendiv/core';

<Series>
  <Series.Sequence durationInFrames={60}>
    <TitleCard />
  </Series.Sequence>
  <Series.Sequence durationInFrames={90}>
    <MainContent />
  </Series.Sequence>
  <Series.Sequence durationInFrames={45}>
    <Outro />
  </Series.Sequence>
</Series>
```

### `<Series.Sequence>` props

| Prop | Type | Default | Description |
|---|---|---|---|
| `durationInFrames` | `number` | — | Duration of this segment (required) |
| `offset` | `number` | `0` | Shift start time: positive = gap, negative = overlap |
| `name` | `string` | — | Display name |
| `layout` | `'absolute-fill' \| 'none'` | `'absolute-fill'` | Wrapper layout |
| `style` | `CSSProperties` | — | Additional styles |

### Constraints

- Only `<Series.Sequence>` elements are allowed as direct children of `<Series>`.
  Any other element will throw an error.
- `<Series.Sequence>` MUST NOT be rendered outside a `<Series>` — it throws.

### Offset example

```tsx
<Series>
  <Series.Sequence durationInFrames={60}>
    <SceneA />
  </Series.Sequence>
  {/* 10-frame gap before SceneB */}
  <Series.Sequence durationInFrames={60} offset={10}>
    <SceneB />
  </Series.Sequence>
  {/* SceneC overlaps with SceneB's last 5 frames */}
  <Series.Sequence durationInFrames={60} offset={-5}>
    <SceneC />
  </Series.Sequence>
</Series>
```

## `<Loop>`

Repeats children on a cycle using modulo arithmetic.

```tsx
import { Loop } from '@rendiv/core';

<Loop durationInFrames={30} times={4}>
  <PulsingDot />  {/* Sees frames 0-29, repeated 4 times */}
</Loop>
```

### Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `durationInFrames` | `number` | — | Duration of one iteration (required) |
| `times` | `number` | `Infinity` | Number of iterations |
| `layout` | `'absolute-fill' \| 'none'` | `'absolute-fill'` | Wrapper layout |
| `style` | `CSSProperties` | — | Additional styles |

Children always see a frame in `[0, durationInFrames)` via modulo. After all iterations
complete (when `times` is finite), the Loop renders `null`.

## `<Freeze>`

Locks children to a specific frame number, regardless of the actual playback position.

```tsx
import { Freeze } from '@rendiv/core';

<Freeze frame={20}>
  <AnimatedScene />  {/* Always sees frame 20 */}
</Freeze>
```

### How it works

`<Freeze>` overrides `TimelineContext.frame` for all children. `useFrame()` inside
the frozen subtree always returns the frozen frame (adjusted for Sequence offset).

### Common patterns

```tsx
{/* Freeze at the end of an animation */}
<Sequence from={0} durationInFrames={30}>
  <AnimatedTitle />
</Sequence>
<Sequence from={30} durationInFrames={60}>
  <Freeze frame={29}>
    <AnimatedTitle />  {/* Frozen at last frame of animation */}
  </Freeze>
</Sequence>
```

## Context Override Architecture

`<Sequence>`, `<Loop>`, and `<Freeze>` all work by providing new `TimelineContext`
and/or `SequenceContext` values to their children. This is why `useFrame()` returns
a local frame — it subtracts the accumulated sequence offset from the timeline frame.

Nesting is composable: a `<Loop>` inside a `<Sequence>` inside another `<Sequence>`
applies all offsets correctly.
