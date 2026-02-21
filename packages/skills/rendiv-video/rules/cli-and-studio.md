---
name: cli-and-studio
description: >
  Using the rendiv CLI for rendering, the Studio dev server for previewing and
  debugging, and the Player component for browser embedding.
---

# CLI, Studio, and Player

## CLI (`@rendiv/cli`)

The `rendiv` command-line tool handles rendering, still image capture, composition
listing, and launching Studio.

### Commands

#### `rendiv render`

Renders a composition to a video file.

```bash
rendiv render <entry> <compositionId> <output>
```

```bash
# Render to MP4
rendiv render src/index.tsx MyScene out/video.mp4

# Render to WebM
rendiv render src/index.tsx MyScene out/video.webm
```

The output format is determined by the file extension (`.mp4` or `.webm`).

#### `rendiv still`

Captures a single frame as an image.

```bash
rendiv still <entry> <compositionId> <output> [--frame <n>]
```

```bash
# Capture frame 0 (default)
rendiv still src/index.tsx Thumbnail out/thumb.png

# Capture a specific frame
rendiv still src/index.tsx MyScene out/frame90.png --frame 90
```

#### `rendiv compositions`

Lists all registered compositions in a project.

```bash
rendiv compositions <entry>
```

```bash
rendiv compositions src/index.tsx
# Outputs: id, dimensions, fps, duration for each composition
```

#### `rendiv studio`

Launches the Studio dev server for interactive preview and rendering.

```bash
rendiv studio <entry>
```

```bash
rendiv studio src/index.tsx
```

## Studio

Studio is a Vite-powered dev server with a full preview UI.

### Features

- **Composition navigator**: Browse compositions organized by folder
- **Live preview**: Player-based preview with play/pause controls
- **Timeline scrubber**: Drag to seek through frames
- **Render queue**: Queue render jobs that run server-side
  - Jobs persist across page refreshes (stored in server memory)
  - Jobs continue even if the browser tab is closed
  - REST API at `/__rendiv_api__/render/queue`

### Architecture

Studio writes temp files (`entry.tsx`, `studio.html`, `favicon.svg`) to `.studio/`
in the project root. These are needed for Vite module resolution. The directory is
cleaned up when the server closes.

Studio UI components ship as uncompiled `.tsx` source — Vite processes them at
dev time.

### Package.json script pattern

```json
{
  "scripts": {
    "studio": "rendiv studio src/index.tsx",
    "render": "rendiv render src/index.tsx MyScene out/video.mp4",
    "still": "rendiv still src/index.tsx MyScene out/still.png"
  }
}
```

## Player (`@rendiv/player`)

Embeds a composition in any React application for browser playback.

```tsx
import { Player } from '@rendiv/player';
import { Root } from './Root';

<Player
  compositionId="MyScene"
  component={Root}
  durationInFrames={150}
  fps={30}
  compositionWidth={1920}
  compositionHeight={1080}
  style={{ width: 800 }}
  controls
  autoPlay
  loop
/>
```

### Key Props

| Prop | Type | Description |
|---|---|---|
| `compositionId` | `string` | ID of the composition to render |
| `component` | `ComponentType` | Root component that defines compositions |
| `durationInFrames` | `number` | Total frames |
| `fps` | `number` | Frames per second |
| `compositionWidth` | `number` | Native video width |
| `compositionHeight` | `number` | Native video height |
| `controls` | `boolean` | Show playback controls |
| `autoPlay` | `boolean` | Start playing immediately |
| `loop` | `boolean` | Loop playback |
| `style` | `CSSProperties` | Container styles |
| `inputProps` | `object` | Props to pass to the composition |

### Aspect ratio

The Player maintains the composition's aspect ratio. Set a `width` or `height` on
the `style` prop and the Player scales proportionally.

### Difference from Studio

- **Player**: Lightweight, embeddable in any React app. No server required.
- **Studio**: Full dev environment with timeline, render queue, composition browser.
  Requires `rendiv studio` to run.
