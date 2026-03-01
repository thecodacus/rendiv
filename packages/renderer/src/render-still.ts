import fs from 'node:fs';
import path from 'node:path';
import { openBrowser, openPage, type OpenBrowserOptions } from './browser.js';
import { startServer } from './serve.js';
import type { CompositionInfo } from './types.js';

export interface RenderStillOptions {
  serveUrl: string;
  composition: CompositionInfo;
  output: string;
  frame?: number;
  inputProps?: Record<string, unknown>;
  imageFormat?: 'png' | 'jpeg';
  quality?: number;
  timeoutPerFrame?: number;
  gl?: OpenBrowserOptions['gl'];
}

export async function renderStill(options: RenderStillOptions): Promise<void> {
  const {
    serveUrl,
    composition,
    output,
    frame = 0,
    inputProps = {},
    imageFormat = 'png',
    quality,
    timeoutPerFrame = 30000,
    gl,
  } = options;

  // Ensure output directory exists
  const outputDir = path.dirname(output);
  fs.mkdirSync(outputDir, { recursive: true });

  const server = await startServer(serveUrl);
  const browser = await openBrowser({ gl });

  try {
    const page = await openPage(browser, server.url, {
      width: composition.width,
      height: composition.height,
    });

    await page.waitForFunction(() => (window as any).__RENDIV_LOADED__ === true, {
      timeout: 30000,
    });

    await page.evaluate(
      ({ id, props }: { id: string; props: Record<string, unknown> }) => {
        (window as any).__RENDIV_SET_INPUT_PROPS__(props);
        (window as any).__RENDIV_SET_COMPOSITION__(id);
      },
      { id: composition.id, props: inputProps }
    );

    await page.waitForTimeout(100);

    // Set frame
    await page.evaluate((f: number) => {
      return (window as any).__RENDIV_SET_FRAME__(f);
    }, frame);

    await page.waitForFunction(
      () => (window as any).__RENDIV_PENDING_HOLDS__() === 0,
      { timeout: timeoutPerFrame }
    );

    await page.screenshot({
      path: output,
      type: imageFormat,
      quality: imageFormat === 'jpeg' ? (quality ?? 80) : undefined,
      animations: 'disabled',
    });

    await page.close();
  } finally {
    server.close();
  }
}
