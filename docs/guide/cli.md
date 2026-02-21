# CLI Reference

The `@rendiv/cli` package provides the `rendiv` command for studio, rendering, and project management.

## Installation

```bash
npm install @rendiv/cli
```

Or use directly with `npx`:

```bash
npx rendiv <command>
```

## Commands

### `rendiv studio <entry>`

Start the Studio preview server.

```bash
npx rendiv studio src/index.tsx
npx rendiv studio src/index.tsx --port 4000
```

| Flag | Default | Description |
|------|---------|-------------|
| `--port` | `3000` | Dev server port |

### `rendiv render <entry> <id> <output>`

Render a composition to video.

```bash
npx rendiv render src/index.tsx MyVideo out/video.mp4
npx rendiv render src/index.tsx MyVideo out/video.webm --codec webm
npx rendiv render src/index.tsx MyVideo out/frames/ --image-sequence
```

| Flag | Default | Description |
|------|---------|-------------|
| `--codec` | `mp4` | Output codec (`mp4`, `webm`) |
| `--concurrency` | `4` | Parallel browser tabs |
| `--image-sequence` | — | Output PNG frames instead of video |
| `--crf` | `18` | Quality (lower = better, 0-51) |

### `rendiv still <entry> <id> <output>`

Export a single frame as an image.

```bash
npx rendiv still src/index.tsx MyVideo out/thumbnail.png
npx rendiv still src/index.tsx MyVideo out/frame90.png --frame 90
```

| Flag | Default | Description |
|------|---------|-------------|
| `--frame` | `0` | Frame number to capture |

### `rendiv compositions <entry>`

List all registered compositions and their metadata.

```bash
npx rendiv compositions src/index.tsx
```

### `rendiv benchmark`

Benchmark render performance for your compositions.

### `rendiv upgrade`

Upgrade all `@rendiv/*` packages in your project to the latest versions.
