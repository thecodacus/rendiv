import os from 'node:os';
import path from 'node:path';
import fs from 'node:fs';
import { renderFrames, type RenderFramesOptions } from './render-frames.js';
import { stitchFramesToVideo } from './stitch-frames-to-video.js';
import type { CompositionInfo } from './types.js';

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
    // Step 1: Render frames
    await renderFrames({
      serveUrl,
      composition,
      outputDir: tmpDir,
      inputProps,
      concurrency,
      frameRange,
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

    // Step 2: Stitch frames to video
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
