import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { renderFrames, type RenderFramesOptions } from './render-frames.js';
import { stitchFramesToVideo } from './stitch-frames-to-video.js';
import type { CompositionInfo } from './types.js';
import type { GlRenderer } from './browser.js';

export interface RenderMediaOptions {
  composition: CompositionInfo;
  serveUrl: string;
  codec?: 'mp4' | 'webm';
  outputLocation: string;
  inputProps?: Record<string, unknown>;
  concurrency?: number;
  onProgress?: (info: { progress: number; renderedFrames: number; totalFrames: number }) => void;
  frameRange?: [number, number];
  cancelSignal?: AbortSignal;
  /** Intermediate frame image format. Default: png */
  imageFormat?: 'png' | 'jpeg';
  /** FFmpeg encoding preset (ultrafast, fast, medium, slow, veryslow). */
  encodingPreset?: string;
  /** Quality factor (0–51, lower = better). Default: 18 */
  crf?: number;
  /** Video encoder override (e.g. libx264, h264_videotoolbox, h264_nvenc). */
  videoEncoder?: string;
  /** GL renderer for headless Chromium. Default: swiftshader */
  gl?: GlRenderer;
}

export async function renderMedia(options: RenderMediaOptions): Promise<void> {
  const {
    composition,
    serveUrl,
    codec = 'mp4',
    outputLocation,
    inputProps,
    concurrency,
    onProgress,
    frameRange,
    cancelSignal,
    imageFormat,
    encodingPreset,
    crf,
    videoEncoder,
    gl,
  } = options;

  const totalFrames = frameRange
    ? frameRange[1] - frameRange[0] + 1
    : composition.durationInFrames;

  const tmpDir = path.join(os.tmpdir(), `rendiv-frames-${Date.now()}`);
  fs.mkdirSync(tmpDir, { recursive: true });

  // Ensure output directory exists
  const outputDir = path.dirname(outputLocation);
  fs.mkdirSync(outputDir, { recursive: true });

  try {
    // Step 1: Render frames and collect audio metadata
    const { audioSources } = await renderFrames({
      serveUrl,
      composition,
      outputDir: tmpDir,
      inputProps,
      concurrency,
      frameRange,
      imageFormat,
      gl,
      onFrameRendered: ({ frame, total }) => {
        onProgress?.({
          progress: (frame / total) * 0.9, // 90% for frame rendering
          renderedFrames: frame,
          totalFrames: total,
        });
      },
      cancelSignal,
    });

    if (cancelSignal?.aborted) return;

    // Step 2: Stitch frames to video (with audio if available)
    onProgress?.({
      progress: 0.9,
      renderedFrames: totalFrames,
      totalFrames,
    });

    await stitchFramesToVideo({
      framesDir: tmpDir,
      outputPath: outputLocation,
      fps: composition.fps,
      codec,
      crf,
      encodingPreset,
      videoEncoder,
      imageFormat,
      audioSources,
      assetsDir: serveUrl,
    });

    onProgress?.({
      progress: 1.0,
      renderedFrames: totalFrames,
      totalFrames,
    });
  } finally {
    // Cleanup temp frames
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
}
