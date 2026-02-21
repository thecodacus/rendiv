# Rendiv Studio

Studio is a local development environment that launches in your browser. It provides a real-time preview of all your compositions with professional editing tools.

## Launch

```bash
npx rendiv studio src/index.tsx
```

Or with a custom port:

```bash
npx rendiv studio src/index.tsx --port 4000
```

## Features

- **Live preview** of all registered compositions
- **Playback controls** with keyboard shortcuts (Space to play/pause, arrow keys to step)
- **Frame-by-frame scrubbing** via the timeline
- **Composition sidebar** with folder support
- **JSON-based props editor** for parameterized compositions
- **Hot module reload** on every file save
- **Server-side render queue** that persists across page refreshes
- **One-click render trigger** — select codec, quality, and output path from the UI

## How It Works

1. The CLI writes temporary entry files (`.studio/entry.tsx`, `.studio/studio.html`) to your project root
2. A Vite dev server starts with the Studio UI injected alongside your compositions
3. Your compositions register via `setRootComponent()` — Studio reads this registry and renders each one in an isolated viewport
4. The timeline and playback controls manipulate the `TimelineContext` frame value
5. Rendering is dispatched to the server-side render queue, which uses `@rendiv/renderer` under the hood

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Previous frame |
| `→` | Next frame |
| `Home` | Jump to start |
| `End` | Jump to end |
| `L` | Toggle loop |
