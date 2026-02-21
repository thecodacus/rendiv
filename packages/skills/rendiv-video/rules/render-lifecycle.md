---
name: render-lifecycle
description: >
  The holdRender/releaseRender pattern for async resource loading, environment
  awareness, static file serving, input props, and the rendering pipeline.
---

# Render Lifecycle

## `holdRender` / `releaseRender`

The renderer captures each frame as a screenshot. If a component needs to load
async resources (fonts, images, data), it must signal the renderer to wait.

```ts
import { holdRender, releaseRender } from '@rendiv/core';

const handle = holdRender('Loading my data', { timeoutInMilliseconds: 15000 });

// ... async work ...

releaseRender(handle);
```

### API

```ts
holdRender(label?: string, options?: { timeoutInMilliseconds?: number }): number
releaseRender(handle: number): void
abortRender(message: string): void
getPendingHoldCount(): number
getPendingHoldLabels(): string[]
```

### Rules

- `holdRender` returns a numeric handle. The renderer waits until
  `getPendingHoldCount() === 0` before capturing each frame.
- `releaseRender(handle)` removes the hold. Throws if the handle does not exist.
- If `timeoutInMilliseconds` is set and the hold is not released in time, a
  descriptive error is thrown (includes the label).
- `abortRender(message)` throws immediately and aborts the render.
- Built-in media components (`<Img>`, `<Video>`, `<AnimatedImage>`, `<IFrame>`)
  already use this pattern internally — you only need it for custom async loading.

### Custom async loading pattern

```tsx
import { useEffect, useState } from 'react';
import { holdRender, releaseRender } from '@rendiv/core';

export const DataDriven: React.FC<{ apiUrl: string }> = ({ apiUrl }) => {
  const [data, setData] = useState<Data | null>(null);

  useEffect(() => {
    const handle = holdRender('Fetching API data', { timeoutInMilliseconds: 10000 });
    fetch(apiUrl)
      .then((r) => r.json())
      .then(setData)
      .finally(() => releaseRender(handle));
  }, [apiUrl]);

  if (!data) return null;
  return <Chart data={data} />;
};
```

## Environment Awareness

Components can detect the current environment to adapt behavior:

```ts
import { getRendivEnvironment, useRendivEnvironment } from '@rendiv/core';

const env = getRendivEnvironment();
// or inside a component:
const env = useRendivEnvironment();
// env is 'rendering' | 'player' | 'studio'
```

### Environment differences

| Behavior | Rendering | Player | Studio |
|---|---|---|---|
| `<Video>` | Seeks per frame | Plays naturally | Plays naturally |
| `<Audio>` | Returns `null` | Plays with sync | Plays with sync |
| Frame advance | Controlled by renderer | Real-time | Scrubber or play |

## `staticFile`

Returns a URL path for files in the project's `public/` directory:

```ts
import { staticFile } from '@rendiv/core';

const videoUrl = staticFile('background.mp4');  // returns '/background.mp4'
const imageUrl = staticFile('images/hero.png'); // returns '/images/hero.png'
```

Place media files in `public/` at the project root. `staticFile` prepends `/` and
strips any leading slash from the input.

## `getInputProps`

Receives data passed from the CLI or renderer to a composition at render time:

```ts
import { getInputProps } from '@rendiv/core';

interface MyProps {
  title: string;
  color: string;
}

const props = getInputProps<MyProps>();
// In the browser: reads window.__RENDIV_INPUT_PROPS__
// Returns {} if not set
```

Useful for parameterized renders where data is injected externally.

## Rendering Pipeline

The end-to-end rendering process:

1. **Bundle**: Vite builds the entry file into a static bundle.
   Temp files (`__rendiv_entry__.jsx` + `__rendiv_entry__.html`) are written to
   the project root (not `/tmp/` — Vite needs them in the project directory for
   module resolution). Cleaned up in a `finally` block.

2. **Serve**: The bundled output is served as static files via a local HTTP server.

3. **Capture**: Playwright launches headless Chromium, navigates to the page, and
   calls `__RENDIV_SET_FRAME__(n)` for each frame, then takes a PNG screenshot.

4. **Stitch**: FFmpeg combines all PNG frames into an MP4 or WebM video file.

The renderer waits for `getPendingHoldCount() === 0` before capturing each frame,
which is why the `holdRender` pattern is critical for async resources.
