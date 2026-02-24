import fs from 'node:fs';
import path from 'node:path';
import type { Page } from 'playwright';
import { openBrowser, openPage } from './browser.js';
import { startServer } from './serve.js';
import type { AudioSourceInfo, CompositionInfo } from './types.js';

export interface RenderFramesOptions {
  serveUrl: string;
  composition: CompositionInfo;
  outputDir: string;
  inputProps?: Record<string, unknown>;
  concurrency?: number;
  frameRange?: [number, number];
  onFrameRendered?: (info: { frame: number; total: number }) => void;
  cancelSignal?: AbortSignal;
  timeoutPerFrame?: number;
}

async function renderSingleFrame(
  page: Page,
  frame: number,
  outputDir: string,
  timeoutPerFrame: number
): Promise<void> {
  // Set the frame and wait for it to be ready
  await page.evaluate((f: number) => {
    return (window as any).__RENDIV_SET_FRAME__(f);
  }, frame);

  // Additional check for delay renders
  await page.waitForFunction(
    () => (window as any).__RENDIV_PENDING_HOLDS__() === 0,
    { timeout: timeoutPerFrame }
  );

  // Screenshot
  const paddedFrame = String(frame).padStart(6, '0');
  await page.screenshot({
    path: path.join(outputDir, `frame-${paddedFrame}.png`),
    type: 'png',
    animations: 'disabled',
  });
}

export interface RenderFramesResult {
  audioSources: AudioSourceInfo[];
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
  } = options;

  const [startFrame, endFrame] = frameRange ?? [0, composition.durationInFrames - 1];
  const totalFrames = endFrame - startFrame + 1;

  fs.mkdirSync(outputDir, { recursive: true });

  const server = await startServer(serveUrl);
  const browser = await openBrowser();

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

      // Set composition and input props
      await page.evaluate(
        ({ id, props }: { id: string; props: Record<string, unknown> }) => {
          (window as any).__RENDIV_SET_INPUT_PROPS__(props);
          (window as any).__RENDIV_SET_COMPOSITION__(id);
        },
        { id: composition.id, props: inputProps }
      );

      // Wait for composition to render
      await page.waitForTimeout(100);

      pages.push(page);
    }

    // Render frames using a simple pool
    const frameQueue = Array.from({ length: totalFrames }, (_, i) => startFrame + i);
    let completedFrames = 0;

    const renderNext = async (page: Page): Promise<void> => {
      while (frameQueue.length > 0) {
        if (cancelSignal?.aborted) return;

        const frame = frameQueue.shift()!;
        await renderSingleFrame(page, frame, outputDir, timeoutPerFrame);

        completedFrames++;
        onFrameRendered?.({ frame: completedFrames, total: totalFrames });
      }
    };

    await Promise.all(pages.map((page) => renderNext(page)));

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

    return { audioSources };
  } finally {
    server.close();
  }
}
