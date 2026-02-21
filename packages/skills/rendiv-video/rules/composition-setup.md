---
name: composition-setup
description: >
  Setting up a rendiv project entry point, registering compositions and stills,
  organizing with folders, and configuring default props.
---

# Composition Setup

## Entry Point

Every rendiv project has a single entry file that calls `setRootComponent` with a
React component that declares all compositions:

```tsx
import { setRootComponent, Composition, Folder } from '@rendiv/core';
import { MyScene } from './MyScene';
import { Thumbnail } from './Thumbnail';

const Root: React.FC = () => (
  <>
    <Folder name="Scenes">
      <Composition
        id="MyScene"
        component={MyScene}
        durationInFrames={150}
        fps={30}
        width={1920}
        height={1080}
      />
    </Folder>
    <Folder name="Thumbnails">
      <Still
        id="Thumbnail"
        component={Thumbnail}
        width={1280}
        height={720}
      />
    </Folder>
  </>
);

setRootComponent(Root);
```

### Rules

- `setRootComponent` MUST be called exactly once. A second call throws an error.
- The root component renders `<Composition>`, `<Still>`, and `<Folder>` elements.
  These are metadata-only — they render `null` and register into the composition manager.

## `<Composition>`

Registers a video composition with the framework.

```tsx
<Composition
  id="MyScene"                    // unique identifier (required)
  component={MyScene}             // React component or React.lazy() (required)
  durationInFrames={150}          // total frame count (required)
  fps={30}                        // frames per second (required)
  width={1920}                    // pixel width (required)
  height={1080}                   // pixel height (required)
  defaultProps={{ title: 'Hi' }}  // optional default props
  resolveConfig={async (params) => ({ ... })}  // optional dynamic config
/>
```

### Props

| Prop | Type | Required | Description |
|---|---|---|---|
| `id` | `string` | Yes | Unique composition identifier |
| `component` | `ComponentType` or `LazyExoticComponent` | Yes | The scene component |
| `durationInFrames` | `number` | Yes | Total frames |
| `fps` | `number` | Yes | Frames per second |
| `width` | `number` | Yes | Video width in pixels |
| `height` | `number` | Yes | Video height in pixels |
| `defaultProps` | `Props` | No | Default props passed to the component |
| `resolveConfig` | `ResolveConfigFunction` | No | Async function to resolve config dynamically |

The `component` receives `defaultProps` (merged with any input props) as its React props.

## `<Still>`

Registers a single-frame image composition. Equivalent to a `<Composition>` with
`durationInFrames={1}` and `fps={30}`.

```tsx
import { Still } from '@rendiv/core';

<Still
  id="Poster"
  component={PosterDesign}
  width={1080}
  height={1080}
  defaultProps={{ text: 'Coming Soon' }}
/>
```

Render a still: `rendiv still src/index.tsx Poster out/poster.png`

## `<Folder>`

Groups compositions into folders for organization in Studio and CLI output:

```tsx
import { Folder } from '@rendiv/core';

<Folder name="Social">
  <Composition id="InstagramReel" ... />
  <Composition id="TikTokClip" ... />
</Folder>
```

Folders can be nested:

```tsx
<Folder name="Marketing">
  <Folder name="Social">
    <Composition id="Tweet" ... />
  </Folder>
</Folder>
```

The composition's folder path is built from the nesting: `Marketing/Social`.

## Common Resolutions

| Format | Width | Height | Aspect |
|---|---|---|---|
| 1080p landscape | 1920 | 1080 | 16:9 |
| 4K landscape | 3840 | 2160 | 16:9 |
| 1080p portrait | 1080 | 1920 | 9:16 |
| Instagram square | 1080 | 1080 | 1:1 |
| YouTube Shorts | 1080 | 1920 | 9:16 |

## Common Frame Rates

| FPS | Use case |
|---|---|
| 24 | Cinematic |
| 25 | PAL broadcast |
| 30 | Standard web video |
| 60 | Smooth motion / gaming |
