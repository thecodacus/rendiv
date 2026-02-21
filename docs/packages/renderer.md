# @rendiv/renderer

Server-side rendering API for Node.js and Bun. Captures frames via headless Chromium (Playwright) and stitches them with FFmpeg.

## Installation

```bash
npm install @rendiv/renderer
```

## Usage

```ts
import { renderMedia, bundle } from '@rendiv/renderer';

// 1. Bundle your compositions
const bundled = await bundle({ entryPoint: 'src/index.tsx' });

// 2. Render to video
await renderMedia({
  serveUrl: bundled,
  compositionId: 'MyVideo',
  codec: 'mp4',
  outputLocation: 'out/video.mp4',
  concurrency: 4,
  onProgress: ({ progress }) => {
    console.log(`${Math.round(progress * 100)}%`);
  },
});
```

## renderMedia

Render a composition to a video file.

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `serveUrl` | `string` | required | URL or path to the bundled output |
| `compositionId` | `string` | required | ID of the composition to render |
| `codec` | `string` | `'mp4'` | Output codec (`'mp4'`, `'webm'`) |
| `outputLocation` | `string` | required | Output file path |
| `concurrency` | `number` | `4` | Number of parallel browser tabs |
| `onProgress` | `function` | — | Progress callback `({ progress: number })` |
| `crf` | `number` | `18` | Quality (lower = better, 0-51) |

## Rendering Pipeline

1. **Bundle** — Vite builds your compositions into a static site
2. **Serve** — Static files are served locally
3. **Capture** — Playwright opens headless Chromium tabs in parallel, navigates to each frame, waits for `holdRender` to clear, and takes a screenshot
4. **Stitch** — FFmpeg combines the PNG frames + audio tracks into the final video

The `concurrency` option controls how many Chromium tabs run simultaneously. Higher values render faster but use more RAM.
