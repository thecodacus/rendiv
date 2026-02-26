# Rendering Performance Guide

## Quick Wins (No Code Changes)

### 1. Use `--concurrency` (biggest impact)

The renderer supports a page pool but defaults to 1. Increase it to render multiple frames in parallel:

```bash
rendiv render src/index.tsx MyComp --concurrency 4
```

Each concurrent page renders a different frame simultaneously using Playwright. On a machine with 8+ cores, try 4-8.

### 2. Render a frame subset

While iterating on a specific section, render only the frames you need:

```bash
rendiv render src/index.tsx MyComp --frames 0-89
```

## Bottlenecks and Potential Optimizations

| Bottleneck | Impact | Possible Fix |
|---|---|---|
| **PNG screenshots** | Every frame is captured as lossless PNG, which is slow to encode. JPEG would be ~3-5x faster per frame. | Add `--image-format jpeg` option for intermediate frames |
| **Software GL rendering** | Browser uses `--use-angle=swiftshader` (CPU-based GL). Slow for Three.js/canvas-heavy compositions. | Use `--use-gl=egl` or native GPU on Linux; macOS GPU is less reliable headless |
| **FFmpeg H.264 preset** | No `-preset` specified, defaults to `medium`. | Add `-preset ultrafast` for ~4x faster encoding (slightly larger file) or `-preset fast` for a good balance |
| **FFmpeg hardware encoding** | CPU-only `libx264` encoder. | Use `h264_videotoolbox` (macOS) or `h264_nvenc` (NVIDIA) for GPU-accelerated encoding |
| **holdRender polling** | Playwright's default `waitForFunction` polling interval (~100ms). | Reduce polling interval or switch to a notification-based approach |

## Rendering Pipeline Overview

### Stages

1. **Bundle** - Vite builds the project into a static bundle
2. **Serve** - Local HTTP server serves the bundle + assets
3. **Frame Rendering** (0-90% of total time) - Playwright pages capture PNG screenshots per frame
4. **FFmpeg Stitching** (10% of total time) - PNG frames + audio tracks encoded to MP4/WebM

### Per-Frame Lifecycle

1. `page.evaluate(__RENDIV_SET_FRAME__(n))` - Sets the frame on the React component
2. `page.waitForFunction(pendingHolds === 0)` - Waits for all media to load (holdRender)
3. `page.screenshot({ type: 'png' })` - Captures the frame as PNG
4. Frame saved to disk as `frame-000001.png`

### Concurrency Model

- Creates N Playwright pages (controlled by `--concurrency`)
- Frames are pre-queued; each page pulls the next available frame
- Parallelism is across pages (not within a single page)
- Example: `--concurrency 3` with 300 frames = 3 pages rendering frames concurrently

### FFmpeg Encoding Settings

**MP4 (H.264):**
```
-c:v libx264 -crf 18 -pix_fmt yuv420p -movflags +faststart
-c:a aac -b:a 192k -shortest
```

**WebM (VP9):**
```
-c:v libvpx-vp9 -crf 18 -b:v 0
-c:a libopus -b:a 128k -shortest
```

### Audio Processing

Each audio/video source with audio generates an FFmpeg filter chain:
1. `atrim` - Trim to playback range
2. `asetpts` - Reset timestamps
3. `atempo` - Adjust playback speed
4. `adelay` - Offset start in timeline
5. `volume` - Scale volume
6. All tracks mixed via `amix`
