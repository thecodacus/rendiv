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
- **Integrated agent terminal** — launch Claude Code or any CLI agent directly in Studio

## How It Works

1. The CLI writes temporary entry files (`.studio/entry.tsx`, `.studio/studio.html`) to your project root
2. A Vite dev server starts with the Studio UI injected alongside your compositions
3. Your compositions register via `setRootComponent()` — Studio reads this registry and renders each one in an isolated viewport
4. The timeline and playback controls manipulate the `TimelineContext` frame value
5. Rendering is dispatched to the server-side render queue, which uses `@rendiv/renderer` under the hood

## Agent Terminal

Studio includes a built-in browser terminal that launches an AI coding agent (Claude Code by default) directly in your project directory. This lets you interact with an AI agent while previewing your compositions side by side.

### Using the Agent Terminal

1. Click the **panel toggle** button in the top bar (right side)
2. Switch to the **Agent** tab
3. Click **Launch Claude Code** to start a terminal session
4. The terminal runs a real PTY on the server — full TUI support with colors, formatting, and interactive input

The terminal communicates over Vite's existing HMR WebSocket, so there's no additional server or port needed. The PTY process runs server-side and survives page refreshes — if you reload the page, the terminal reconnects to the running session (though previous output history is lost).

The right panel is resizable by dragging its left edge. Both the panel width and the active tab (Queue or Agent) are persisted to localStorage.

### Requirements

The agent terminal requires `node-pty` (included in `@rendiv/studio` dependencies). On first use, Studio automatically fixes file permissions if needed (pnpm may strip execute permissions from native binaries).

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Previous frame |
| `→` | Next frame |
| `Home` | Jump to start |
| `End` | Jump to end |
| `L` | Toggle loop |
