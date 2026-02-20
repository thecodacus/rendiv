# Rendiv — Roadmap

> Phase 1 (MVP) is tracked in the implementation plan. This file covers Phase 2 and Phase 3.

---

## Phase 2: Studio + Media Components

### Studio (`packages/studio`)
- [ ] Vite dev server with hot reload for compositions
- [ ] Sidebar listing all registered compositions and stills (grouped by `<Folder>`)
- [ ] Video preview pane using the Player internally
- [ ] Timeline scrubber — drag to seek to any frame
- [ ] Playback controls — play, pause, step forward/backward, loop
- [ ] Keyboard shortcuts: Space (play/pause), ←/→ (step frame), J/K/L (slow/pause/fast), 0 (jump to start)
- [ ] FPS / duration / resolution display
- [ ] Props editor — edit defaultProps as a JSON schema form (Zod-typed props support)
- [ ] Render button — trigger local render from Studio UI
- [ ] Error overlay — display React errors per-frame without crashing preview
- [ ] CLI command: `rendiv studio` to launch the Studio

### Additional Core Components
- [ ] `<Series />` — renders sequences one after another without manually calculating `from` offsets
- [ ] `<Loop />` — loops a child component for a defined number of iterations
- [ ] `<Freeze />` — freezes time at a specific frame number for children

### Media Components (in `packages/rendiv`)
- [ ] `<Video />` — HTML5 video synchronized with the Rendiv frame clock (props: src, startFrom, endAt, volume, playbackRate, muted)
- [ ] `<Audio />` — same as Video but audio-only
- [ ] `<OffthreadVideo />` — FFmpeg-based frame extraction for pixel-perfect accuracy during rendering
- [ ] `<Img />` — renders `<img>` and waits for full load before frame capture (uses delayRender)
- [ ] `<AnimatedImage />` — renders GIF/AVIF/animated WebP synchronized to frame clock
- [ ] `<IFrame />` — renders `<iframe>` and waits for load before capture

### Enhanced delayRender
- [ ] Configurable timeout with descriptive error messages
- [ ] Automatic integration with `<Img>`, `<Video>`, `<IFrame>` (auto delay/continue on load)
- [ ] Better dev experience: show pending delay render labels in Studio error overlay

### CLI Additions
- [ ] `rendiv benchmark` — benchmark render performance
- [ ] `rendiv upgrade` — upgrade all Rendiv packages

---

## Phase 3: Ecosystem Packages

Each package is independently buildable. No ordering dependency between them.

### `@rendiv/transitions`
- [ ] `<TransitionSeries />` — wraps multiple scenes with transitions between them
- [ ] `fade()` — opacity cross-fade
- [ ] `slide({ direction })` — slide in/out (left, right, up, down)
- [ ] `wipe({ direction })` — wipe reveal
- [ ] `flip({ direction })` — 3D flip
- [ ] `clockWipe({ rotation })` — radial/clock wipe
- [ ] `linearTiming({ durationInFrames })` — constant speed timing
- [ ] `springTiming({ config })` — spring-based easing timing

### `@rendiv/shapes`
- [ ] `makeCircle()` — circle SVG path
- [ ] `makeEllipse()` — ellipse SVG path
- [ ] `makeRect()` — rectangle SVG path
- [ ] `makeTriangle()` — triangle SVG path
- [ ] `makeStar()` — star polygon SVG path
- [ ] `makePie()` — pie/arc segment SVG path
- [ ] Each returns `{ path, width, height }` for SVG or CSS clip-path use

### `@rendiv/paths`
- [ ] `getLength(path)` — total path length
- [ ] `getPointAtLength(path, length)` — `{x, y}` at distance along path
- [ ] `getTangentAtLength(path, length)` — tangent angle at a point
- [ ] `interpolatePath(progress, from, to)` — morph between two SVG paths
- [ ] `evolvePath(progress, path)` — animate path drawing
- [ ] `translatePath(path, x, y)` — translate a path
- [ ] `scalePath(path, scale)` — scale a path
- [ ] `reversePath(path)` — reverse path direction
- [ ] `parsePath(d)` — parse path string to instructions
- [ ] `serializeInstructions(instructions)` — serialize back to string

### `@rendiv/noise`
- [ ] `noise2D(x, y)` — 2D Perlin noise, returns [-1, 1]
- [ ] `noise3D(x, y, z)` — 3D Perlin noise
- [ ] `noise4D(x, y, z, w)` — 4D Perlin noise

### `@rendiv/motion-blur`
- [ ] `<Trail layers={n} lagInFrames={m}>` — ghost frames behind moving components
- [ ] `<CameraMotionBlur shutterAngle={180} samples={10}>` — directional blur on all children

### `@rendiv/fonts`
- [ ] Custom font loading with `delayRender` integration
- [ ] `loadFont({ family, url, weight?, style? })` — loads font and signals when ready

### `@rendiv/google-fonts`
- [ ] Google Fonts integration
- [ ] Auto-generated exports for all Google Fonts families
- [ ] `loadFont(family, { weights?, styles? })` — loads from Google Fonts CDN

### `@rendiv/gif`
- [ ] GIF rendering synchronized to frame clock
- [ ] `<Gif src={url} />` — renders specific GIF frame based on current frame

### `@rendiv/lottie`
- [ ] Lottie animation support synchronized to frame clock
- [ ] `<Lottie animationData={data} />` — renders Lottie at current frame

### `@rendiv/three`
- [ ] Three.js integration
- [ ] `<ThreeCanvas>` — Three.js canvas synchronized to Rendiv frame clock
- [ ] `useCurrentFrame()` works inside Three.js scene graph

### `@rendiv/captions`
- [ ] Auto caption/subtitle support
- [ ] SRT/VTT parsing and rendering
- [ ] `<Captions src={url} />` — renders subtitles synchronized to frame

### `create-rendiv` (Project Scaffolder)
- [ ] `npx create-rendiv@latest` — interactive project creation
- [ ] Template: `blank` — empty composition
- [ ] Template: `hello-world` — simple text animation starter
- [ ] Template: `react-typescript` — full TypeScript setup with Zod props schema
- [ ] Template: `next-js` — Rendiv player embedded in Next.js app
- [ ] Template: `audio-visualization` — audio-reactive animation starter

---

## Future (v2+)

- Cloud / Lambda rendering
- AI / LLM prompt-to-video
- Built-in timeline editor GUI
- Collaborative / multiplayer editing
