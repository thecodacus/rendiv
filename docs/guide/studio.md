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
- **Interactive timeline editor** — drag to reposition and resize sequences, multi-track z-ordering
- **Playback controls** with keyboard shortcuts (Space to play/pause, arrow keys to step)
- **Frame-by-frame scrubbing** via the timeline
- **Composition sidebar** with folder support
- **JSON-based props editor** for parameterized compositions
- **Hot module reload** on every file save
- **Server-side render queue** that persists across page refreshes
- **One-click render trigger** — select codec, quality, and output path from the UI
- **Integrated agent terminal** — launch Claude Code or any CLI agent directly in Studio
- **Multi-project workspace mode** — manage multiple projects from a single Studio instance

## How It Works

1. The CLI writes temporary entry files (`.studio/entry.tsx`, `.studio/studio.html`) to your project root
2. A Vite dev server starts with the Studio UI injected alongside your compositions
3. Your compositions register via `setRootComponent()` — Studio reads this registry and renders each one in an isolated viewport
4. The timeline and playback controls manipulate the `TimelineContext` frame value
5. Rendering is dispatched to the server-side render queue, which uses `@rendiv/renderer` under the hood

## Interactive Timeline Editor

The timeline at the bottom of Studio is a fully interactive editor. You can visually rearrange sequences without changing code — overrides are stored in a `timeline-overrides.json` file at your project root.

### Editing Sequences

- **Drag a sequence** left or right to change its start frame (`from`)
- **Drag the edges** of a sequence to change its duration (`durationInFrames`)
- **Drag vertically** to move a sequence to a different track (changes its z-order)

All changes are saved automatically to `timeline-overrides.json` in your project root. This file is read during headless rendering, so your visual edits carry through to the final video.

### Multi-Track Z-Ordering

Sequences can be placed on different tracks. Higher tracks render on top of lower tracks. The `trackIndex` is computed as:

- Track 0 is the base layer
- Higher track numbers render in front (higher z-index)
- You can set `trackIndex` directly in code via the `<Sequence trackIndex={2}>` prop, or drag sequences between tracks in the timeline editor

### Timeline Overrides File

The `timeline-overrides.json` file stores visual edits as a JSON object:

```json
{
  "MyVideo/IntroScene[0]": {
    "from": 0,
    "durationInFrames": 60,
    "trackIndex": 0
  },
  "MyVideo/MainContent[60]": {
    "from": 45,
    "durationInFrames": 120,
    "trackIndex": 1,
    "playbackRate": 1.5
  }
}
```

Keys use the format `CompositionId/SequenceName[originalFrom]`. Values override the sequence's `from`, `durationInFrames`, `trackIndex`, and `playbackRate`.

- **Code props take precedence** by default — if you change a sequence's props in code, those values are used
- **Overrides apply on top** when the original props match the override's key
- **External edits sync live** — if you edit `timeline-overrides.json` in your editor, Studio picks up the changes immediately via file watching

### Editor vs Tree View

The timeline supports two view modes, toggled via buttons above the timeline:

- **Editor** — the interactive drag-to-edit view with tracks and visual sequence blocks
- **Tree** — a hierarchical list view showing the composition's sequence structure

## Agent Terminal

Studio includes a built-in browser terminal that launches an AI coding agent (Claude Code by default) directly in your project directory. This lets you interact with an AI agent while previewing your compositions side by side.

### Using the Agent Terminal

1. Click the **panel toggle** button in the top bar (right side)
2. Switch to the **Agent** tab
3. Click **Launch Claude Code** to start a terminal session
4. The terminal runs a real PTY on the server — full TUI support with colors, formatting, and interactive input

### How It Works

The terminal communicates over Vite's existing HMR WebSocket, so there's no additional server or port needed. The PTY process runs server-side and survives page refreshes — if you reload the page, the terminal reconnects to the running session (though previous output history is lost).

The right panel is resizable by dragging its left edge. Both the panel width and the active tab (Queue or Agent) are persisted to localStorage.

### Requirements

The agent terminal requires `node-pty` (included in `@rendiv/studio` dependencies). On first use, Studio automatically fixes file permissions if needed (pnpm may strip execute permissions from native binaries).

## Multi-Project Workspace Mode

Workspace mode lets you manage multiple Rendiv projects from a single Studio instance. This is useful for cloud-hosted setups where you want one constant URL to access from a remote machine.

### Launch

```bash
npx rendiv studio --workspace ./my-projects
```

This opens a project picker UI in the browser. The `--workspace` flag takes the path to a parent directory containing your Rendiv projects (each project is a subdirectory with its own `package.json`).

### Features

- **Project grid** — see all detected projects at a glance
- **Create new projects** — scaffold a new project with dependencies directly from the browser
- **Click to open** — select a project to launch its full Studio environment
- **Back to projects** — click the "Projects" button in the TopBar to return to the picker
- **Single port** — everything runs on the same port, suitable for cloud hosting

### How It Works

1. Studio scans subdirectories for `package.json` files with `@rendiv/core` in dependencies
2. Clicking a project card restarts the Vite server for that project on the same port
3. The browser auto-reconnects via Vite's HMR mechanism (~1-2 seconds)
4. The "Projects" back button in the TopBar returns to the workspace picker

### Project Detection

A subdirectory is detected as a Rendiv project if it contains a `package.json` with `@rendiv/core` in `dependencies` or `devDependencies`. The entry point is detected from the `studio` script in `package.json` (e.g., `rendiv studio src/index.tsx`), falling back to `src/index.tsx`.

## Docker

Studio can run in a Docker container for cloud-hosted or remote setups. See the dedicated [Docker guide](/guide/docker) for full setup instructions, Docker Compose examples, and cloud hosting details.

## Keyboard Shortcuts

| Key | Action |
|-----|--------|
| `Space` | Play / Pause |
| `←` | Previous frame |
| `→` | Next frame |
| `Home` | Jump to start |
| `End` | Jump to end |
| `L` | Toggle loop |
