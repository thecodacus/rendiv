import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import type { Page } from 'playwright';
import { openBrowser, openPage, type OpenBrowserOptions } from './browser.js';
import { startServer } from './serve.js';
import type { AudioSourceInfo, CompositionInfo } from './types.js';

export type ImageFormat = 'png' | 'jpeg';

export interface FrameTimings {
  setFrameMs: number;
  waitForHoldsMs: number;
  screenshotMs: number;
  totalMs: number;
}

export interface RenderProfile {
  totalFrames: number;
  totalTimeMs: number;
  avgFrameTimeMs: number;
  phases: {
    setFrame: { avgMs: number; maxMs: number; totalMs: number };
    waitForHolds: { avgMs: number; maxMs: number; totalMs: number };
    screenshot: { avgMs: number; maxMs: number; totalMs: number };
  };
  bottleneck: 'setFrame' | 'waitForHolds' | 'screenshot';
  framesPerSecond: number;
}

export interface RenderFramesOptions {
  serveUrl: string;
  composition: CompositionInfo;
  outputDir: string;
  inputProps?: Record<string, unknown>;
  concurrency?: number;
  frameRange?: [number, number];
  onFrameRendered?: (info: { frame: number; total: number; timings?: FrameTimings }) => void;
  cancelSignal?: AbortSignal;
  timeoutPerFrame?: number;
  imageFormat?: ImageFormat;
  gl?: OpenBrowserOptions['gl'];
  profiling?: boolean;
}

async function renderSingleFrame(
  page: Page,
  frame: number,
  outputDir: string,
  timeoutPerFrame: number,
  imageFormat: ImageFormat,
  profiling: boolean,
): Promise<FrameTimings | null> {
  const t0 = profiling ? performance.now() : 0;

  // Set the frame and wait for it to be ready.
  // __RENDIV_SET_FRAME__ resolves once holds === 0, so this includes
  // both React rendering AND hold waiting (e.g. OffthreadVideo extraction).
  // The browser records actual flushSync time in __RENDIV_RENDER_MS__.
  await page.evaluate((f: number) => {
    return (window as any).__RENDIV_SET_FRAME__(f);
  }, frame);

  const t1 = profiling ? performance.now() : 0;

  // Read the browser-side measurement of just the React flushSync time.
  // This separates actual React rendering from hold waiting that happens
  // inside the same evaluate call.
  const browserRenderMs = profiling
    ? await page.evaluate(() => (window as any).__RENDIV_RENDER_MS__ ?? 0) as number
    : 0;

  // Additional poll for holds placed asynchronously after __RENDIV_SET_FRAME__
  // resolves (e.g. useEffect-based holdRender that fires after the promise).
  await page.waitForFunction(
    () => (window as any).__RENDIV_PENDING_HOLDS__() === 0,
    { timeout: timeoutPerFrame, polling: 4 }
  );

  const t2 = profiling ? performance.now() : 0;

  // Screenshot
  const paddedFrame = String(frame).padStart(6, '0');
  const ext = imageFormat === 'jpeg' ? 'jpeg' : 'png';
  await page.screenshot({
    path: path.join(outputDir, `frame-${paddedFrame}.${ext}`),
    type: imageFormat,
    animations: 'disabled',
    ...(imageFormat === 'jpeg' ? { quality: 80 } : {}),
  });

  const t3 = profiling ? performance.now() : 0;

  if (!profiling) return null;

  // Use browser-side render time for accurate React render measurement.
  // The remaining evaluate time (t1 - t0 - browserRenderMs) is hold waiting
  // that happened inside __RENDIV_SET_FRAME__'s promise.
  const evaluateHoldMs = Math.max(0, (t1 - t0) - browserRenderMs);

  return {
    setFrameMs: browserRenderMs,
    waitForHoldsMs: evaluateHoldMs + (t2 - t1),
    screenshotMs: t3 - t2,
    totalMs: t3 - t0,
  };
}

function computeProfile(allTimings: FrameTimings[], totalRenderTimeMs: number): RenderProfile {
  const n = allTimings.length;

  const sum = { setFrame: 0, waitForHolds: 0, screenshot: 0 };
  const max = { setFrame: 0, waitForHolds: 0, screenshot: 0 };

  for (const t of allTimings) {
    sum.setFrame += t.setFrameMs;
    sum.waitForHolds += t.waitForHoldsMs;
    sum.screenshot += t.screenshotMs;
    if (t.setFrameMs > max.setFrame) max.setFrame = t.setFrameMs;
    if (t.waitForHoldsMs > max.waitForHolds) max.waitForHolds = t.waitForHoldsMs;
    if (t.screenshotMs > max.screenshot) max.screenshot = t.screenshotMs;
  }

  const avgTotal = allTimings.reduce((s, t) => s + t.totalMs, 0) / n;

  const phases = {
    setFrame: { avgMs: sum.setFrame / n, maxMs: max.setFrame, totalMs: sum.setFrame },
    waitForHolds: { avgMs: sum.waitForHolds / n, maxMs: max.waitForHolds, totalMs: sum.waitForHolds },
    screenshot: { avgMs: sum.screenshot / n, maxMs: max.screenshot, totalMs: sum.screenshot },
  };

  let bottleneck: RenderProfile['bottleneck'] = 'setFrame';
  if (phases.waitForHolds.totalMs > phases[bottleneck].totalMs) bottleneck = 'waitForHolds';
  if (phases.screenshot.totalMs > phases[bottleneck].totalMs) bottleneck = 'screenshot';

  return {
    totalFrames: n,
    totalTimeMs: totalRenderTimeMs,
    avgFrameTimeMs: avgTotal,
    phases,
    bottleneck,
    framesPerSecond: n / (totalRenderTimeMs / 1000),
  };
}

export interface RenderFramesResult {
  audioSources: AudioSourceInfo[];
  profile?: RenderProfile;
}

export async function renderFrames(options: RenderFramesOptions): Promise<RenderFramesResult> {
  const {
    serveUrl,
    composition,
    outputDir,
    inputProps = {},
    concurrency = 1,
    frameRange,
    onFrameRendered,
    cancelSignal,
    timeoutPerFrame = 30000,
    imageFormat = 'png',
    gl,
    profiling = false,
  } = options;

  const [startFrame, endFrame] = frameRange ?? [0, composition.durationInFrames - 1];
  const totalFrames = endFrame - startFrame + 1;

  fs.mkdirSync(outputDir, { recursive: true });

  const server = await startServer(serveUrl);
  const browser = await openBrowser({ gl });

  try {
    // Create page pool
    const pages: Page[] = [];
    for (let i = 0; i < concurrency; i++) {
      const page = await openPage(browser, server.url, {
        width: composition.width,
        height: composition.height,
      });

      // Wait for entry to load
      await page.waitForFunction(() => (window as any).__RENDIV_LOADED__ === true, {
        timeout: 30000,
      });

      // Set composition, input props, and image format for OffthreadVideo
      await page.evaluate(
        ({ id, props, imgFormat }: { id: string; props: Record<string, unknown>; imgFormat: string }) => {
          (window as any).__RENDIV_IMAGE_FORMAT__ = imgFormat;
          (window as any).__RENDIV_SET_INPUT_PROPS__(props);
          (window as any).__RENDIV_SET_COMPOSITION__(id);
        },
        { id: composition.id, props: inputProps, imgFormat: imageFormat }
      );

      // Wait for composition to render
      await page.waitForTimeout(100);

      pages.push(page);
    }

    // Render frames using a simple pool
    const frameQueue = Array.from({ length: totalFrames }, (_, i) => startFrame + i);
    let completedFrames = 0;
    const allTimings: FrameTimings[] = [];
    const renderStartTime = profiling ? performance.now() : 0;

    const renderNext = async (page: Page): Promise<void> => {
      while (frameQueue.length > 0) {
        if (cancelSignal?.aborted) return;

        const frame = frameQueue.shift()!;
        const timings = await renderSingleFrame(page, frame, outputDir, timeoutPerFrame, imageFormat, profiling);

        if (timings) {
          allTimings.push(timings);
        }

        completedFrames++;
        onFrameRendered?.({ frame: completedFrames, total: totalFrames, timings: timings ?? undefined });
      }
    };

    await Promise.all(pages.map((page) => renderNext(page)));

    const renderEndTime = profiling ? performance.now() : 0;

    // Collect audio source metadata registered by Audio/Video components.
    // The persistent Map accumulates entries across all frames, so reading
    // from any page after rendering captures everything.
    const audioSources = await pages[0].evaluate(() => {
      const w = window as any;
      const map = w.__RENDIV_AUDIO_SOURCES__ as Map<string, unknown> | undefined;
      if (!map || map.size === 0) return [];
      return Array.from(map.values());
    }) as AudioSourceInfo[];

    // Cleanup pages
    for (const page of pages) {
      await page.close();
    }

    const profile = profiling && allTimings.length > 0
      ? computeProfile(allTimings, renderEndTime - renderStartTime)
      : undefined;

    return { audioSources, profile };
  } finally {
    server.close();
  }
}
