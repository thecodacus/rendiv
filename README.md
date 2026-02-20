<div align="center">

# Rendiv

**Programmatic video and motion graphics for the open web.**

[![License: MIT](https://img.shields.io/badge/License-MIT-green.svg)](https://opensource.org/licenses/MIT)
[![npm version](https://img.shields.io/npm/v/rendiv.svg)](https://www.npmjs.com/package/rendiv)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/rendiv-dev/rendiv/pulls)

Create videos, animations, and motion graphics using **React components and TypeScript** — rendered frame-by-frame to MP4, WebM, GIF, and more.  
Fully open source. No licensing fees. No cloud dependency. Just code.

</div>

---

## What is Rendiv?

Rendiv treats **a video as a pure function of time**. Each frame is a React component snapshot at a specific point in time. By changing what your component renders based on the current frame number, you produce animation, motion graphics, and full video productions — all in TypeScript.

```tsx
import { useFrame, useCompositionConfig, Fill } from 'rendiv';

export const MyVideo = () => {
  const frame = useFrame();
  const { totalFrames } = useCompositionConfig();

  const progress = frame / totalFrames;
  const opacity = progress;

  return (
    <Fill style={{ backgroundColor: '#0f0f0f' }}>
      <h1 style={{ opacity, color: 'white', fontSize: 80 }}>
        Hello, Rendiv 👋
      </h1>
    </Fill>
  );
};
```

---

## Features

### 🎬 React-First Video Creation
Write videos as React components. Use all of CSS, SVG, Canvas, WebGL, and Three.js to design each frame. Any web technology that renders in a browser renders in Rendiv.

### ⏱ Precise Frame Control
- `useFrame()` — get the current frame number in any component
- `useCompositionConfig()` — access `fps`, `totalFrames`, `width`, `height`
- `<Sequence>` — show components only within a time window
- `<Series>` — chain sequences automatically without manual offset math
- `<Loop>` — repeat content for N iterations
- `<Freeze>` — lock time at a specific frame for children

### 🎞 Smooth Animation Primitives
- `interpolate(frame, inputRange, outputRange)` — map frame ranges to any value with built-in clamping and easing
- `spring({ frame, fps, config })` — physics-based spring animation driven by frame number
- `blendColors(value, inputRange, outputRange)` — interpolate smoothly between CSS colors
- `getSpringDuration(config)` — calculate how long a spring takes to settle
- Full `Easing` library: `linear`, `ease`, `easeIn`, `easeOut`, `easeInOut`, `bezier`, `bounce`, `elastic`

### 🎵 Audio & Video Support
- `<Video>` — embed video files synced to the frame clock
- `<Audio>` — embed audio with per-frame volume control
- `<OffthreadVideo>` — pixel-perfect frame extraction via FFmpeg (for rendering)
- `<Img>` — load images with guaranteed readiness before capture
- `<AnimatedImage>` — GIF, AVIF, and animated WebP support

### 🏗 Async Frame Control
Load external data before a frame is captured using a simple hold/release pattern:

```ts
const handle = holdRender('Loading data...');
const data = await fetchMyData();
// update state
releaseRender(handle);
```

### 🖥 Rendiv Studio
A local preview app that launches in your browser:
- Live preview of all registered compositions
- Playback controls with keyboard shortcuts
- Frame-by-frame scrubbing
- JSON-based props editor
- Hot reload on every file change
- One-click render trigger

```bash
npx rendiv studio
```

### ⚡ Fast Parallel Rendering
- Headless Chromium (via Playwright) captures frames in parallel
- Configurable concurrency — up to 16 simultaneous tabs
- FFmpeg stitches frames + audio into the final video
- Outputs: MP4, WebM, GIF, MP3, WAV, PNG sequence

### 📦 Embeddable Player
Drop a Rendiv composition directly into any React app with zero server dependency:

```tsx
import { Player } from '@rendiv/player';
import { MyVideo } from './MyVideo';

<Player
  component={MyVideo}
  totalFrames={150}
  fps={30}
  compositionWidth={1920}
  compositionHeight={1080}
  controls
  loop
/>
```

### 🎨 Transitions
```tsx
<TransitionSeries>
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneA />
  </TransitionSeries.Sequence>
  <TransitionSeries.Transition timing={springTiming()} transition={fade()} />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

Built-in transitions: `fade`, `slide`, `wipe`, `flip`, `clockWipe`

### 🔷 SVG Shapes & Paths
- `makeCircle`, `makeRect`, `makeTriangle`, `makeStar`, `makePie` — SVG shape primitives
- `getLength`, `getPointAtLength`, `interpolatePath`, `evolvePath` — path animation utilities

### 🌊 Perlin Noise
```ts
import { noise2D, noise3D } from '@rendiv/noise';
const x = noise2D(frame * 0.05, 0) * 100;
```

### 💫 Motion Blur
```tsx
<Trail layers={5} lagInFrames={2}>
  <MovingObject />
</Trail>

<CameraMotionBlur shutterAngle={180} samples={10}>
  <Scene />
</CameraMotionBlur>
```

---

## Packages

| Package | Description |
|---------|-------------|
| `rendiv` | Core runtime — hooks, components, animation utilities |
| `@rendiv/cli` | CLI for studio, render, still, and benchmark commands |
| `@rendiv/player` | Embeddable React player component |
| `@rendiv/renderer` | Node.js/Bun server-side rendering API |
| `@rendiv/bundler` | Vite-based bundler for compositions |
| `@rendiv/transitions` | Transition primitives (`fade`, `slide`, `wipe`, etc.) |
| `@rendiv/shapes` | SVG shape helpers |
| `@rendiv/paths` | SVG path manipulation utilities |
| `@rendiv/noise` | Perlin noise for organic animations |
| `@rendiv/motion-blur` | Trail and camera motion blur effects |
| `@rendiv/lottie` | Lottie animation support |
| `@rendiv/three` | Three.js integration |
| `@rendiv/fonts` | Custom font loading |
| `@rendiv/google-fonts` | Google Fonts integration |
| `@rendiv/gif` | GIF rendering support |
| `@rendiv/captions` | Auto caption/subtitle support |
| `@rendiv/studio` | Studio UI — preview, timeline, props editor |

---

## Getting Started

```bash
npx create-rendiv@latest
cd my-rendiv-project
npm run dev
```

### Manual install

```bash
npm install rendiv @rendiv/cli
```

### Register your root and composition

```tsx
// src/index.tsx
import { setRootComponent } from 'rendiv';
import { Composition } from 'rendiv';
import { MyVideo } from './MyVideo';

setRootComponent(() => (
  <Composition
    id="MyVideo"
    component={MyVideo}
    totalFrames={150}
    fps={30}
    width={1920}
    height={1080}
  />
));
```

### Launch Studio

```bash
npx rendiv studio
```

### Render to video

```bash
npx rendiv render src/index.tsx MyVideo out/video.mp4
```

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `rendiv studio` | Start the Studio preview server |
| `rendiv render <entry> <id> <output>` | Render a composition to video |
| `rendiv still <entry> <id> <output>` | Export a single frame as PNG/JPEG |
| `rendiv compositions <entry>` | List all registered compositions |
| `rendiv benchmark` | Benchmark render performance |
| `rendiv upgrade` | Upgrade all Rendiv packages |

---

## Render API (Node.js / Bun)

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

---

## Tech Stack

| Layer | Technology |
|-------|------------|
| Core runtime | React 18+, TypeScript 5+ |
| Bundler | Vite 5 |
| Headless browser | Playwright (Chromium) |
| Frame stitching | FFmpeg |
| Monorepo tooling | pnpm workspaces + Turborepo |
| Testing | Vitest + Playwright E2E |
| License | MIT |

---

## Roadmap

- [x] Core hooks and composition system
- [x] Sequence, Series, Loop, Freeze primitives
- [x] Spring and interpolation animation engine
- [x] Headless Playwright renderer
- [x] Studio preview UI
- [x] Embeddable player
- [x] Transitions package
- [ ] Cloud / distributed rendering (v2)
- [ ] AI prompt-to-video integration (v2)
- [ ] Visual timeline editor GUI (v2)
- [ ] Collaborative editing (v2)

---

## Contributing

Rendiv is fully open source and welcomes contributions of all kinds.

```bash
git clone https://github.com/rendiv-dev/rendiv
cd rendiv
pnpm install
pnpm dev
```

Please read [CONTRIBUTING.md](./CONTRIBUTING.md) before opening a pull request.

---

## License

MIT © Rendiv Contributors

You are free to use Rendiv in personal projects, commercial products, open-source libraries, and SaaS applications without any licensing fees or restrictions.

---

## Acknowledgments

Rendiv was **inspired by the concept** of programmatic, React-based video creation pioneered by [Remotion](https://www.remotion.dev) — a project we deeply respect. Jonny Burger and the Remotion team did groundbreaking work in proving that "a video is a function of time" is a powerful and developer-friendly paradigm.

However, Rendiv is **not a fork, port, or derivative of Remotion's codebase**. It is an independent implementation built from scratch with several fundamental technical differences:

### How Rendiv differs from Remotion

| Aspect | Rendiv | Remotion |
|--------|--------|----------|
| **License** | MIT — fully free for all use | Custom source-available license with commercial restrictions |
| **Headless browser** | Playwright (Chromium) | Puppeteer with custom serving strategy |
| **Spring physics** | Semi-implicit Euler integration | Analytical closed-form solution |
| **Bezier solver** | Newton-Raphson algorithm | Pre-computed lookup table |
| **Bundler** | Vite 5 (first-class) | Webpack (primary) |
| **Core API naming** | `useFrame`, `useCompositionConfig`, `Fill`, `holdRender`/`releaseRender` | `useCurrentFrame`, `useVideoConfig`, `AbsoluteFill`, `delayRender`/`continueRender` |
| **Context model** | Independent context shape design | Remotion-specific context structure |
| **Package manager** | pnpm + Turborepo | Custom tooling |

The goal of Rendiv is to provide the same developer experience and power that Remotion offers, while being fully free, open, and unrestricted — so that every developer, studio, and startup can build on top of it without worrying about licensing costs or commercial terms.

We encourage you to check out [Remotion](https://www.remotion.dev) as well — if their licensing works for your use case, it is an excellent and mature product.
