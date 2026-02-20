# Rendiv

Programmatic video rendering framework using React/TypeScript. Write React components as video compositions, preview them in a player or studio, and render to MP4/WebM via headless Chromium + FFmpeg.

## Project Structure

Monorepo: pnpm workspaces + Turborepo.

| Package | npm name | Build | Purpose |
|---|---|---|---|
| `packages/rendiv` | `@rendiv/core` | `vite build` (library mode, ESM+CJS) | Core: hooks, components, animation, contexts |
| `packages/player` | `@rendiv/player` | `vite build` (library mode, ESM+CJS) | Browser `<Player>` component |
| `packages/bundler` | `@rendiv/bundler` | `tsc` (ESM only) | Vite-based project bundler |
| `packages/renderer` | `@rendiv/renderer` | `tsc` (ESM only) | Playwright frames + FFmpeg stitching |
| `packages/cli` | `@rendiv/cli` | `tsc` (ESM only) | CLI: `rendiv render/still/compositions/studio` |
| `packages/studio` | `@rendiv/studio` | `tsc` (ESM only) | Studio dev server, Vite plugin, server-side render queue |
| `packages/tsconfig` | `@rendiv/tsconfig` | N/A | Shared TS configs (base, react-library, node-library) |
| `examples/hello-world` | private | vite dev | Demo compositions (HelloWorld, SeriesDemo, ShowcaseDemo) |

### Dependency graph
```
cli → bundler → (vite)
    → renderer → (playwright, ffmpeg)
    → studio → bundler, renderer
player → @rendiv/core (peer)
examples → @rendiv/core, player, cli
```

## Commands

```bash
pnpm build        # Build all packages (turbo, dependency-ordered)
pnpm test         # Run all tests (76 tests in packages/rendiv)
pnpm typecheck    # Type-check all packages
pnpm clean        # Remove dist/ from all packages
```

## Code Conventions

### File naming
- All files: `kebab-case` (`use-frame.ts`, `render-frames.ts`)
- Components: `.tsx`, hooks/contexts/utilities: `.ts`

### Exports
- Named exports only, no default exports
- Props interfaces: `<Component>Props`, exported alongside the component
- Types co-exported with their values: `export { Foo, type FooValue }`
- Barrel `src/index.ts` per package, organized by category with comments

### Package exports in package.json
- `"types"` must come first in the exports map (before `"import"` and `"require"`)
- React packages: dual ESM (`.js`) + CJS (`.cjs`) via Vite library mode
- Node packages: ESM only via `tsc`

### Components
- Function components with named export
- `forwardRef` when imperative ref is needed (e.g., `Fill`, `Player`)
- `<Composition>` and `<Still>` render `null` — registration-only via `useEffect` into `CompositionManagerContext`
- Compound component pattern: `Series` + `Series.Sequence` (marker child, throws if rendered directly)

### Contexts
- Live in `packages/rendiv/src/context/` as `.ts` files
- Pattern: `createContext<TypeValue>(default)` + exported interface
- Five contexts: `TimelineContext`, `CompositionContext`, `SequenceContext`, `RendivEnvironmentContext`, `CompositionManagerContext`
- Components like `Freeze` and `Loop` override `TimelineContext` (and optionally `SequenceContext`) to alter the frame seen by children

### Hooks
- Live in `packages/rendiv/src/hooks/`, prefixed `use-`
- Named function exports: `export function useFrame(): number`

### TypeScript
- Shared configs in `packages/tsconfig/`: `base.json`, `react-library.json`, `node-library.json`
- Target: ES2022, module: ESNext, moduleResolution: bundler, strict: true
- Per-package tsconfig extends the shared preset and sets `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]`

## Public API Names

Key exports from `@rendiv/core`:

| Category | Names |
|---|---|
| Hooks | `useFrame`, `useCompositionConfig` |
| Components | `Composition`, `Sequence`, `Fill`, `Still`, `Folder` |
| Core Components | `Series`, `Series.Sequence`, `Loop`, `Freeze` |
| Media Components | `Img`, `Video`, `Audio`, `AnimatedImage`, `IFrame` |
| Animation | `interpolate`, `spring`, `getSpringDuration`, `Easing`, `blendColors` |
| Registration | `setRootComponent`, `getRootComponent` |
| Render control | `holdRender`, `releaseRender`, `abortRender`, `getPendingHoldCount`, `getPendingHoldLabels` |
| Types | `CompositionConfig`, `CompositionEntry`, `SpringConfig`, `ResolveConfigFunction`, `HoldRenderOptions` |
| Context fields | `accumulatedOffset`, `localOffset`, `parentOffset`, `playingRef` |

## Architecture

### Frame-driven rendering
Video = function of frame number. `useFrame()` returns the current frame, offset by any `<Sequence>` nesting via `SequenceContext`.

### Context override pattern
- `<Freeze frame={N}>` overrides `TimelineContext.frame` to freeze children at frame N
- `<Loop durationInFrames={N}>` overrides both `TimelineContext` and `SequenceContext` using modulo arithmetic so children see frames in `[0, N)`
- `<Series>` delegates to `<Sequence>` with auto-calculated `from` offsets

### holdRender pattern
Media components (`Img`, `Video`, `IFrame`, `AnimatedImage`) automatically call `holdRender()` on mount and `releaseRender()` on load/error/unmount. `holdRender` accepts an optional `{ timeoutInMilliseconds }` that fires a descriptive error on timeout. The renderer waits for `getPendingHoldCount() === 0` before capturing each frame.

### Media component environment awareness
`Video` and `Audio` read `RendivEnvironmentContext` to adapt behavior:
- **Rendering mode**: `Video` pauses and seeks precisely per frame with holdRender; `Audio` renders null (not captured in screenshots)
- **Player/Studio mode**: Both sync playback naturally with drift correction

### Composition registration
`<Composition>` registers metadata into `CompositionManagerContext` via `useEffect` and renders nothing. Player, Studio, and Renderer each provide their own context providers that wrap the actual component.

### Bundler temp file pattern
The bundler writes `__rendiv_entry__.jsx` + `__rendiv_entry__.html` in the user's project root (not `/tmp/`). This is critical — Vite resolves modules relative to its root, so temp files must be in the project directory to find `node_modules`. Files are cleaned up in a `finally` block.

### Rendering pipeline
Bundle (Vite build) → serve static files → Playwright headless Chromium → `__RENDIV_SET_FRAME__(n)` per frame → screenshot to PNG → FFmpeg stitch to MP4/WebM.

### Studio architecture
Studio is a Vite dev server launched via `rendiv studio <entry>`. Temp files (`entry.tsx`, `studio.html`, `favicon.svg`) are written to `.studio/` in the project root (needed for Vite module resolution). Studio UI files (`packages/studio/ui/*.tsx`) ship as uncompiled source — Vite processes them at dev time.

**Server-side render queue**: Render jobs live in the Vite dev server's memory (not React state), so they persist across page refreshes and continue even if the browser tab is closed. The server exposes REST endpoints under `/__rendiv_api__/render/queue` (GET queue, POST add job, POST cancel, DELETE remove, POST clear). A self-draining `processQueue()` loop picks the next `'queued'` job and runs bundle → selectComposition → renderMedia. The client polls the server (500ms when active, 1000ms when idle).

**Studio UI components**: `StudioApp` (main shell + polling), `Sidebar` (composition navigator with folders), `Preview` (Player-based preview), `Timeline` (frame scrubber with entries), `TopBar` (controls, render button, queue toggle), `RenderQueue` (job list with progress/cancel/remove).

## Testing

- Framework: Vitest + jsdom
- Location: `packages/rendiv/src/__tests__/<subject>.test.ts[x]`
- Uses `@testing-library/react` for component tests
- Tests wrap components with real context providers (no mocking)
- Pattern: `renderAtFrame(frame, ui)` helper + `FrameDisplay` component to assert frame values
- `_resetPendingHolds()` from `delay-render.ts` used in `beforeEach` to reset global hold state between tests
- Only `packages/rendiv` has tests currently (76 tests across 12 files)
