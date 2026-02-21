<div align="center">

# Rendiv

**The video editor built for AI.**

[![License](https://img.shields.io/badge/License-Apache_2.0-blue.svg)](https://opensource.org/licenses/Apache-2.0)
[![npm version](https://img.shields.io/npm/v/@rendiv/core.svg)](https://www.npmjs.com/package/@rendiv/core)
[![TypeScript](https://img.shields.io/badge/TypeScript-5%2B-blue)](https://www.typescriptlang.org/)
[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/rendiv-dev/rendiv/pulls)

Create videos programmatically with **React and TypeScript** — designed from the ground up for AI agents, LLM pipelines, and automated video production.
Pure code. No GUI required. Fully open source.

</div>

---

## What is Rendiv?

Rendiv is a **code-first video editor** where AI is a first-class citizen. Every video is a pure function of time — a React component that renders a frame given a frame number. This makes video creation fully deterministic, versionable, and trivially automatable by LLMs and AI agents.

Give an AI agent your Rendiv project and a prompt. It writes React components. You get a video. No drag-and-drop. No timeline editors. Just code that any LLM can read, write, and iterate on.

```tsx
import { useFrame, useCompositionConfig, Fill } from '@rendiv/core';

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

### 🤖 Built for AI
Every video is plain React + TypeScript — the languages LLMs understand best. AI agents can generate, modify, and iterate on compositions without any special tooling. Pair with Claude, GPT, or any code-generating model to produce videos from natural language prompts.

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
- Server-side render queue (persists across page refresh)
- One-click render trigger

```bash
npx rendiv studio src/index.tsx
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
  <TransitionSeries.Transition timing={linearTiming({ durationInFrames: 15 })} presentation={fade()} />
  <TransitionSeries.Sequence durationInFrames={60}>
    <SceneB />
  </TransitionSeries.Sequence>
</TransitionSeries>
```

Built-in transitions: `fade`, `slide`, `wipe`, `flip`, `clockWipe`

### 🔷 SVG Shapes & Paths
- `shapeCircle`, `shapeRect`, `shapeTriangle`, `shapeStar`, `shapePie`, `shapePolygon`, `shapeEllipse` — SVG shape primitives
- `pathLength`, `pointOnPath`, `morphPath`, `strokeReveal` — path animation utilities

### 🌊 Perlin Noise
```ts
import { noise2D, noise3D } from '@rendiv/noise';
const x = noise2D(frame * 0.05, 0) * 100;
```

### 🔤 Font Loading
```tsx
import { useFont } from '@rendiv/google-fonts';

const fontFamily = useFont({ family: 'Roboto', weight: '700' });
return <h1 style={{ fontFamily }}>Hello</h1>;
```

Load local fonts with `@rendiv/fonts`:
```tsx
import { useLocalFont } from '@rendiv/fonts';

const fontFamily = useLocalFont({ family: 'CustomFont', src: staticFile('custom.woff2') });
```

### 💫 Motion Blur
```tsx
<MotionTrail layers={5} offset={2} fadeRate={0.6}>
  <MovingObject />
</MotionTrail>

<ShutterBlur angle={180} layers={10}>
  <Scene />
</ShutterBlur>
```

---

## Why AI-First?

Traditional video editors are GUI-based — impossible for AI to operate. Rendiv flips this:

| Traditional Editor | Rendiv |
|--------------------|--------|
| Click, drag, drop in a GUI | Write React components |
| Binary project files | Plain `.tsx` files in git |
| Manual keyframing | `interpolate()`, `spring()`, code-driven animation |
| Can't be automated | AI agent writes code, runs `rendiv render`, gets MP4 |
| One-off edits | Parameterized compositions — change props, get new video |

**The workflow**: Describe what you want in natural language. An AI agent writes the Rendiv composition. `rendiv render` produces the video. Iterate by editing code — something AI is already great at.

```ts
// AI generates this from: "fade in a title, then show 3 bullet points with spring animations"
import { useFrame, Fill, Sequence, interpolate, spring } from '@rendiv/core';

export const AIGeneratedVideo = () => {
  const frame = useFrame();
  return (
    <Fill style={{ background: '#0a0a0a', padding: 80 }}>
      <Sequence from={0} durationInFrames={60}>
        <h1 style={{ color: 'white', opacity: interpolate(frame, [0, 30], [0, 1]) }}>
          Quarterly Results
        </h1>
      </Sequence>
      {['Revenue up 40%', 'New markets launched', '10k new users'].map((text, i) => (
        <Sequence key={i} from={60 + i * 30} durationInFrames={90}>
          <p style={{ color: '#ccc', transform: `translateX(${(1 - spring({ frame: frame - 60 - i * 30, fps: 30 })) * 100}px)` }}>
            {text}
          </p>
        </Sequence>
      ))}
    </Fill>
  );
};
```

Rendiv compositions are **just functions** — deterministic, testable, and perfectly suited for AI-generated code.

---

## Packages

| Package | Description |
|---------|-------------|
| `@rendiv/core` | Core runtime — hooks, components, animation utilities |
| `@rendiv/cli` | CLI for studio, render, still, and compositions commands |
| `@rendiv/player` | Embeddable React player component |
| `@rendiv/renderer` | Node.js/Bun server-side rendering API |
| `@rendiv/bundler` | Vite-based bundler for compositions |
| `@rendiv/studio` | Studio dev server — preview, timeline, render queue |
| `create-rendiv` | Project scaffolding CLI (`npx create-rendiv`) |
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

---

## Getting Started

The fastest way to start is with `create-rendiv`:

```bash
npx create-rendiv my-video-project
cd my-video-project
```

This scaffolds a complete project with a starter composition, Vite config, and all dependencies installed. Then:

```bash
# Open the Studio preview
npx rendiv studio src/index.tsx

# Render to MP4
npm run render

# Preview in browser (Vite dev server)
npm run preview
```

### Manual setup

If you prefer to set things up yourself:

```bash
npm install @rendiv/core @rendiv/cli @rendiv/player react react-dom
npm install -D @types/react @types/react-dom @vitejs/plugin-react vite typescript
```

Create your entry point:

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

Create your first composition:

```tsx
// src/MyVideo.tsx
import { useFrame, useCompositionConfig, Fill, interpolate, spring } from '@rendiv/core';

export const MyVideo = () => {
  const frame = useFrame();
  const { fps } = useCompositionConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1]);
  const scale = spring({ frame, fps, config: { damping: 12 } });

  return (
    <Fill style={{ background: '#0f0f0f', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <h1 style={{ color: 'white', fontSize: 80, opacity, transform: `scale(${scale})` }}>
        Hello, Rendiv!
      </h1>
    </Fill>
  );
};
```

Then launch the studio or render:

```bash
npx rendiv studio src/index.tsx
npx rendiv render src/index.tsx MyVideo out/video.mp4
```

---

## CLI Reference

| Command | Description |
|---------|-------------|
| `rendiv studio <entry>` | Start the Studio preview server |
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
| Core runtime | React 18/19, TypeScript 5+ |
| Bundler | Vite 6 |
| Headless browser | Playwright (Chromium) |
| Frame stitching | FFmpeg |
| Monorepo tooling | pnpm workspaces + Turborepo |
| Testing | Vitest + jsdom |
| License | Apache 2.0 |

---

## Roadmap

- [x] Core hooks and composition system
- [x] Sequence, Series, Loop, Freeze primitives
- [x] Spring and interpolation animation engine
- [x] Media components (Video, Audio, Img, AnimatedImage, IFrame)
- [x] Headless Playwright renderer with parallel frame capture
- [x] Studio with preview, timeline, and server-side render queue
- [x] Embeddable player component
- [x] Transition primitives (`@rendiv/transitions`)
- [x] Project scaffolding CLI (`create-rendiv`)
- [x] SVG shapes and path animation (`@rendiv/shapes`, `@rendiv/paths`)
- [x] Simplex noise (`@rendiv/noise`)
- [x] Motion blur effects (`@rendiv/motion-blur`)
- [x] Font loading (`@rendiv/fonts`, `@rendiv/google-fonts`)
- [ ] Lottie, Three.js integrations
- [ ] Cloud / distributed rendering
- [ ] Visual timeline editor GUI

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

Apache License 2.0 © Rendiv Contributors

You are free to use Rendiv in personal projects, commercial products, open-source libraries, and SaaS applications. See [LICENSE](./LICENSE) for the full text.

---

## Acknowledgments

Rendiv was **inspired by the concept** of programmatic, React-based video creation pioneered by [Remotion](https://www.remotion.dev) — a project we deeply respect. Jonny Burger and the Remotion team did groundbreaking work in proving that "a video is a function of time" is a powerful and developer-friendly paradigm.

However, Rendiv is **not a fork, port, or derivative of Remotion's codebase**. It is an independent implementation built from scratch with several fundamental technical differences:

### How Rendiv differs from Remotion

| Aspect | Rendiv | Remotion |
|--------|--------|----------|
| **License** | Apache 2.0 — fully free for all use | Custom source-available license with commercial restrictions |
| **Headless browser** | Playwright (Chromium) | Puppeteer with custom serving strategy |
| **Spring physics** | Semi-implicit Euler integration | Analytical closed-form solution |
| **Bezier solver** | Newton-Raphson algorithm | Pre-computed lookup table |
| **Bundler** | Vite 6 (first-class) | Webpack (primary) |
| **Core API naming** | `useFrame`, `useCompositionConfig`, `Fill`, `holdRender`/`releaseRender` | `useCurrentFrame`, `useVideoConfig`, `AbsoluteFill`, `delayRender`/`continueRender` |
| **Context model** | Independent context shape design | Remotion-specific context structure |
| **Package manager** | pnpm + Turborepo | Custom tooling |

The goal of Rendiv is to be the **video editor that AI agents use** — fully free, open, and unrestricted — so that every developer, studio, and AI startup can build on top of it without worrying about licensing costs or commercial terms.

We encourage you to check out [Remotion](https://www.remotion.dev) as well — if their licensing works for your use case, it is an excellent and mature product.
