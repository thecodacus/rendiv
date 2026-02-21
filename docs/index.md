---
layout: home

hero:
  name: Rendiv
  text: The Video Editor Built for AI
  tagline: Create videos programmatically with React and TypeScript — designed for AI agents, LLM pipelines, and automated video production. Fully open source.
  actions:
    - theme: brand
      text: Get Started
      link: /guide/getting-started
    - theme: alt
      text: View on GitHub
      link: https://github.com/rendiv-dev/rendiv

features:
  - icon: 🤖
    title: AI-First
    details: Videos are plain React + TypeScript — the languages LLMs understand best. AI agents can generate, modify, and iterate on compositions without any special tooling.
  - icon: ⚛️
    title: React-First
    details: Write videos as React components. Use CSS, SVG, Canvas, WebGL — any web technology that renders in a browser renders in Rendiv.
  - icon: 🎞️
    title: Animation Engine
    details: Physics-based springs, frame interpolation, easing curves, and color blending — all driven by frame number.
  - icon: 🎵
    title: Media Components
    details: Video, Audio, Images, GIFs, and IFrames with automatic render-hold — resources load before frames are captured.
  - icon: 🖥️
    title: Studio Preview
    details: Live preview with playback controls, frame scrubbing, timeline, and one-click rendering — all in your browser.
  - icon: 🔷
    title: SVG Shapes & Paths
    details: Generate circles, stars, polygons, and pies. Animate stroke-reveal, morph between shapes, and measure paths.
---

<style>
.vp-doc h2 {
  margin-top: 48px;
  padding-top: 24px;
  border-top: 1px solid var(--vp-c-divider);
}
</style>

## A Video is Code

Rendiv treats every video as a pure function of the current frame number. No GUI, no binary project files — just React components that any developer or AI agent can read, write, and iterate on.

```tsx
import { useFrame, Fill, interpolate, spring } from '@rendiv/core';

export const MyVideo = () => {
  const frame = useFrame();
  const opacity = interpolate(frame, [0, 30], [0, 1]);

  return (
    <Fill style={{ background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: 'white', fontSize: 80, opacity }}>
        Hello, Rendiv!
      </h1>
    </Fill>
  );
};
```

## Packages

| Package | Description |
|---------|-------------|
| `@rendiv/core` | Core runtime — hooks, components, animation utilities |
| `@rendiv/cli` | CLI for studio, render, still, and compositions commands |
| `@rendiv/player` | Embeddable React player component |
| `@rendiv/studio` | Studio dev server — preview, timeline, render queue |
| `@rendiv/renderer` | Node.js server-side rendering API |
| `@rendiv/bundler` | Vite-based bundler for compositions |
| `@rendiv/transitions` | Transition primitives (fade, slide, wipe, flip, clockWipe) |
| `@rendiv/shapes` | SVG shape generators |
| `@rendiv/paths` | SVG path manipulation and animation |
| `@rendiv/noise` | Simplex noise for organic animations |
| `@rendiv/motion-blur` | Trail and camera motion blur effects |
| `@rendiv/fonts` | Custom font loading with holdRender |
| `@rendiv/google-fonts` | Google Fonts integration |

## Quick Start

```bash
npx create-rendiv my-video
cd my-video
npx rendiv studio src/index.tsx
```

## License

Apache License 2.0 — free for personal projects, commercial products, open-source libraries, and SaaS applications. See the [LICENSE](https://github.com/rendiv-dev/rendiv/blob/main/LICENSE) for the full text.
