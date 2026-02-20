# Rendiv

Programmatic video rendering framework using React/TypeScript. Write React components as video compositions, preview them in a player or studio, and render to MP4/WebM via headless Chromium + FFmpeg.

## Project Structure

Monorepo: pnpm workspaces + Turborepo.

| Package | npm name | Build | Purpose |
|---|---|---|---|
| `packages/rendiv` | `rendiv` | `vite build` (library mode, ESM+CJS) | Core: hooks, components, animation, contexts |
| `packages/player` | `@rendiv/player` | `vite build` (library mode, ESM+CJS) | Browser `<Player>` component |
| `packages/bundler` | `@rendiv/bundler` | `tsc` (ESM only) | Vite-based project bundler |
| `packages/renderer` | `@rendiv/renderer` | `tsc` (ESM only) | Playwright frames + FFmpeg stitching |
| `packages/cli` | `@rendiv/cli` | `tsc` (ESM only) | CLI: `rendiv render/still/compositions` |
| `packages/tsconfig` | `@rendiv/tsconfig` | N/A | Shared TS configs (base, react-library, node-library) |
| `examples/hello-world` | private | vite dev | Demo composition |

### Dependency graph
```
cli → bundler → (vite)
    → renderer → (playwright, ffmpeg)
player → rendiv (peer)
examples → rendiv, player, cli
```

## Commands

```bash
pnpm build        # Build all packages (turbo, dependency-ordered)
pnpm test         # Run all tests (24 tests in packages/rendiv)
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

### Contexts
- Live in `packages/rendiv/src/context/` as `.ts` files
- Pattern: `createContext<TypeValue>(default)` + exported interface
- Five contexts: `TimelineContext`, `CompositionContext`, `SequenceContext`, `RendivEnvironmentContext`, `CompositionManagerContext`

### Hooks
- Live in `packages/rendiv/src/hooks/`, prefixed `use-`
- Named function exports: `export function useFrame(): number`

### TypeScript
- Shared configs in `packages/tsconfig/`: `base.json`, `react-library.json`, `node-library.json`
- Target: ES2022, module: ESNext, moduleResolution: bundler, strict: true
- Per-package tsconfig extends the shared preset and sets `outDir: "dist"`, `rootDir: "src"`, `include: ["src"]`

## Public API Names

Key exports from `rendiv` (these are Rendiv-original names, intentionally distinct from Remotion):

| Category | Names |
|---|---|
| Hooks | `useFrame`, `useCompositionConfig` |
| Components | `Composition`, `Sequence`, `Fill`, `Still`, `Folder` |
| Animation | `interpolate`, `spring`, `getSpringDuration`, `Easing`, `blendColors` |
| Registration | `setRootComponent`, `getRootComponent` |
| Render control | `holdRender`, `releaseRender`, `abortRender`, `getPendingHoldCount` |
| Types | `CompositionConfig`, `CompositionEntry`, `SpringConfig`, `ResolveConfigFunction` |
| Context fields | `accumulatedOffset`, `localOffset`, `parentOffset`, `playingRef` |

Do NOT reintroduce Remotion-specific names (e.g., `useCurrentFrame`, `VideoConfig`, `AbsoluteFill`, `registerRoot`, `delayRender`, `cumulatedFrom`, `imperativePlaying`, `folderName`, `calculateMetadata`, `overshootClamping`, `interpolateColors`, `measureSpring`).

## Architecture

### Frame-driven rendering
Video = function of frame number. `useFrame()` returns the current frame, offset by any `<Sequence>` nesting via `SequenceContext`.

### Composition registration
`<Composition>` registers metadata into `CompositionManagerContext` via `useEffect` and renders nothing. Player, Studio, and Renderer each provide their own context providers that wrap the actual component.

### Bundler temp file pattern
The bundler writes `__rendiv_entry__.jsx` + `__rendiv_entry__.html` in the user's project root (not `/tmp/`). This is critical — Vite resolves modules relative to its root, so temp files must be in the project directory to find `node_modules`. Files are cleaned up in a `finally` block.

### Rendering pipeline
Bundle (Vite build) → serve static files → Playwright headless Chromium → `__RENDIV_SET_FRAME__(n)` per frame → screenshot to PNG → FFmpeg stitch to MP4/WebM.

## Testing

- Framework: Vitest + jsdom
- Location: `packages/rendiv/src/__tests__/<subject>.test.ts[x]`
- Uses `@testing-library/react` for component tests
- Tests wrap components with real context providers (no mocking)
- Only `packages/rendiv` has tests currently

## Commit Messages

- Do not mention Claude Code or any AI tool in commit messages
