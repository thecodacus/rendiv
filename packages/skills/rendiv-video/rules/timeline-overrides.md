---
name: timeline-overrides
description: >
  Control z-ordering with trackIndex, position and scale sequences with
  x/y/scaleX/scaleY overrides, persist timeline edits in
  timeline-overrides.json, and use overrides in headless rendering.
---

# Timeline Overrides and Track Z-Ordering

## `trackIndex` prop

Every `<Sequence>` has a `trackIndex` prop that controls stacking order when
sequences overlap. Lower values render in front.

```tsx
import { Sequence } from '@rendiv/core';

{/* trackIndex 0 = frontmost (default) */}
<Sequence from={0} durationInFrames={90} trackIndex={0} name="Foreground">
  <ForegroundScene />
</Sequence>

{/* trackIndex 1 = behind track 0 */}
<Sequence from={30} durationInFrames={90} trackIndex={1} name="Background">
  <BackgroundScene />
</Sequence>
```

### How z-index is computed

`zIndex = 10000 - trackIndex`. Track 0 gets `zIndex: 10000`, track 1 gets
`zIndex: 9999`, and so on. The z-index is applied to the `<Fill>` wrapper
when `layout` is `'absolute-fill'` (the default).

### Default behavior

`trackIndex` defaults to `0`. All sequences render at `zIndex: 10000` unless
explicitly assigned to different tracks.

### Works in `<Series.Sequence>` too

```tsx
import { Series } from '@rendiv/core';

<Series>
  <Series.Sequence durationInFrames={60} offset={-15} trackIndex={0}>
    <SceneA />  {/* Overlaps with SceneB, renders in front */}
  </Series.Sequence>
  <Series.Sequence durationInFrames={60} trackIndex={1}>
    <SceneB />  {/* Renders behind SceneA during overlap */}
  </Series.Sequence>
</Series>
```

## `timeline-overrides.json`

Timeline overrides persist modifications to sequence timing, track assignment,
position, and scale. The file lives at the **project root**
(`timeline-overrides.json`) and survives Studio server restarts.

### File format

```json
{
  "CompositionId/SequenceName[from]": {
    "from": 10,
    "durationInFrames": 60,
    "trackIndex": 1,
    "playbackRate": 2,
    "x": 100,
    "y": 50,
    "scaleX": 0.5,
    "scaleY": 0.5
  }
}
```

All fields are optional. Only include the fields you want to override.

Each key is a **namePath** — a hierarchical identifier built from the composition
ID, sequence names, and their `from` values. For nested sequences the path segments
are joined with `/`:

```
CompositionId/OuterSequence[0]/InnerSequence[30]
```

### Override precedence

When both a prop and an override exist, the **override wins**:

1. `trackIndex` prop on `<Sequence>` provides the base value (default `0`)
2. If `timeline-overrides.json` has an entry for this sequence's namePath with a
   `trackIndex` field, it replaces the prop value
3. The final `trackIndex` is converted to `zIndex = 10000 - trackIndex`

The same precedence applies to `from`, `durationInFrames`, `playbackRate`, `x`,
`y`, `scaleX`, and `scaleY`.

### How overrides are created

- **Studio timeline**: Drag sequences in the timeline editor to change their
  start frame, duration, or track. Changes are saved to `timeline-overrides.json`
  automatically.
- **Studio position mode**: Toggle Position Mode (press `P` or click the
  "Position" button) in the preview panel. Drag a sequence body to reposition it,
  or drag corner handles to scale. Shift-drag for proportional scaling. Dragging
  past the anchor flips the content (negative scale). Click "Reset" on a
  sequence to clear its position and scale overrides.
- **Manual**: Edit `timeline-overrides.json` directly. Use the namePath format
  shown above as keys.

### Headless rendering

The bundler reads `timeline-overrides.json` at build time and embeds the data
into the render bundle. Overrides apply automatically during `rendiv render` —
no extra flags needed.

```bash
# Overrides from timeline-overrides.json are included in the render
rendiv render src/index.tsx MyComposition out/video.mp4
```

### Clearing overrides

- **Studio timeline**: Click "Reset All" in the timeline toolbar, or right-click
  a block and choose "Reset Position".
- **Studio position mode**: Hover a sequence and click "Reset" to clear its
  position and scale while keeping timing overrides.
- **Manual**: Delete `timeline-overrides.json` or remove specific entries.

## Playback rate overrides

The `playbackRate` field controls how fast a sequence's children advance through
frames. A rate of `2` means children see frames at double speed; `0.5` means
half speed. Nested playback rates compound — a 2x sequence inside a 1.5x parent
runs at 3x effective rate.

```json
{
  "MyComp/VideoScene[60]": {
    "from": 60,
    "durationInFrames": 90,
    "playbackRate": 1.5
  }
}
```

Playback rate affects both visual rendering and audio. During rendering, audio
tracks from `<Video>`, `<OffthreadVideo>`, and `<Audio>` components are
automatically tempo-adjusted by FFmpeg to match the effective playback rate.

You can also set playback rate in code via the `playbackRate` prop on
`<Sequence>`:

```tsx
<Sequence from={60} durationInFrames={90} playbackRate={1.5}>
  <VideoScene />
</Sequence>
```

## Position and scale overrides

The `x`, `y`, `scaleX`, and `scaleY` fields offset and resize a sequence
relative to the composition. They are applied as a CSS
`transform: translate(x, y) scale(sX, sY)` with `transform-origin: 0 0`
on the sequence's wrapper element.

### Override fields

| Field | Type | Default | Description |
|---|---|---|---|
| `x` | number | `0` | Horizontal offset in composition pixels |
| `y` | number | `0` | Vertical offset in composition pixels |
| `scaleX` | number | `1` | Horizontal scale factor (1 = 100%) |
| `scaleY` | number | `1` | Vertical scale factor (1 = 100%) |

### Negative scale (flipping)

Negative values flip the content. `scaleX: -1` mirrors horizontally,
`scaleY: -1` mirrors vertically. In Studio position mode, drag a corner
handle past the opposite anchor to flip.

### Manual override example

```json
{
  "MyComp/Webcam[0]": {
    "from": 0,
    "durationInFrames": 150,
    "trackIndex": 0,
    "x": 1400,
    "y": 750,
    "scaleX": 0.3,
    "scaleY": 0.3
  },
  "MyComp/Background[0]": {
    "from": 0,
    "durationInFrames": 150,
    "trackIndex": 1,
    "scaleX": -1
  }
}
```

The first entry places a webcam overlay at the bottom-right corner scaled to
30%. The second flips the background horizontally.

## Overlap patterns

### Crossfade with z-ordering

```tsx
<Sequence from={0} durationInFrames={60} trackIndex={1} name="SceneA">
  <SceneA />
</Sequence>
<Sequence from={45} durationInFrames={60} trackIndex={0} name="SceneB">
  <SceneB />  {/* Renders in front during the 15-frame overlap */}
</Sequence>
```

### Picture-in-picture (via overrides)

Define both sequences at full size in code, then use timeline overrides to
position and scale the PiP layer:

```tsx
<Sequence from={0} durationInFrames={150} trackIndex={1} name="Main">
  <MainVideo />
</Sequence>
<Sequence from={30} durationInFrames={90} trackIndex={0} name="PiP">
  <PipVideo />
</Sequence>
```

In `timeline-overrides.json`:

```json
{
  "MyComp/PiP[30]": {
    "x": 1400,
    "y": 750,
    "scaleX": 0.25,
    "scaleY": 0.25
  }
}
```

Or use Studio position mode to drag and resize the PiP layer visually.
