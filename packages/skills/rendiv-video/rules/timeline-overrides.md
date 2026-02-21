---
name: timeline-overrides
description: >
  Control z-ordering with trackIndex, persist timeline edits in
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

Timeline overrides persist modifications to sequence timing and track assignment.
The file lives at the **project root** (`timeline-overrides.json`) and survives
Studio server restarts.

### File format

```json
{
  "CompositionId/SequenceName[from]": {
    "from": 10,
    "durationInFrames": 60,
    "trackIndex": 1
  }
}
```

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

The same precedence applies to `from` and `durationInFrames`.

### How overrides are created

- **Studio**: Drag sequences in the timeline editor to change their position,
  duration, or track. The Studio saves changes to `timeline-overrides.json`
  automatically.
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

- **Studio**: Click "Reset All" in the timeline toolbar, or right-click a block
  and choose "Reset Position".
- **Manual**: Delete `timeline-overrides.json` or remove specific entries.

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

### Picture-in-picture

```tsx
<Sequence from={0} durationInFrames={150} trackIndex={1} name="Main">
  <MainVideo />
</Sequence>
<Sequence from={30} durationInFrames={90} trackIndex={0} name="PiP">
  <div style={{ position: 'absolute', bottom: 20, right: 20, width: 320, height: 180 }}>
    <PipVideo />
  </div>
</Sequence>
```
