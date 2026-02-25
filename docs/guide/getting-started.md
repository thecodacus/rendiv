# Getting Started

## Scaffold a New Project

The fastest way to start is with `create-rendiv`:

```bash
npx create-rendiv my-video-project
cd my-video-project
```

This scaffolds a complete project with a starter composition, Vite config, and all dependencies installed.

```bash
# Open the Studio preview
npx rendiv studio src/index.tsx

# Render to MP4
npm run render

# Preview in browser (Vite dev server)
npm run preview
```

## Manual Setup

If you prefer to set things up yourself:

```bash
npm install @rendiv/core @rendiv/cli @rendiv/player react react-dom
npm install -D @types/react @types/react-dom @vitejs/plugin-react vite typescript
```

### Create Your Entry Point

```tsx
// src/index.tsx
import { setRootComponent, Composition } from '@rendiv/core';
import { MyVideo } from './MyVideo';

setRootComponent(() => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    durationInFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
));
```

### Create Your First Composition

Always wrap your composition content with `<CanvasElement id="...">` so that timeline overrides (position, scale, timing edits from Studio) work correctly, even when the composition is nested inside another one.

```tsx
// src/MyVideo.tsx
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate, spring } from '@rendiv/core';

export const MyVideo = () => {
  const frame = useFrame();
  const { fps } = useCompositionConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <CanvasElement id="MyVideo">
      <Fill style={{ background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <h1 style={{ color: 'white', fontSize: 80, opacity, transform: `scale(${scale})` }}>
          Hello, Rendiv!
        </h1>
      </Fill>
    </CanvasElement>
  );
};
```

### Launch

```bash
# Studio preview
npx rendiv studio src/index.tsx

# Render to video
npx rendiv render src/index.tsx MyVideo out/video.mp4
```

## Render API (Node.js / Bun)

For programmatic rendering:

```ts
import { renderMedia, bundle } from '@rendiv/renderer';

const bundled = await bundle({ entryPoint: 'src/index.tsx' });

await renderMedia({
  serveUrl: bundled,
  compositionId: 'MyVideo',
  codec: 'mp4',
  outputLocation: 'out/video.mp4',
  concurrency: 4,
  onProgress: ({ progress }) => console.log(`${Math.round(progress * 100)}%`),
});
```
