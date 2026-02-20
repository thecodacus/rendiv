import { openBrowser, openPage } from './browser.js';
import { startServer } from './serve.js';
import type { CompositionInfo } from './types.js';

export async function getCompositions(serveUrl: string): Promise<CompositionInfo[]> {
  const server = await startServer(serveUrl);
  const browser = await openBrowser();

  try {
    const page = await openPage(browser, server.url, {
      width: 1920,
      height: 1080,
    });

    // Capture console errors for debugging
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') {
        errors.push(msg.text());
      }
    });
    page.on('pageerror', (err) => {
      errors.push(err.message);
    });

    // Wait for the entry to load
    try {
      await page.waitForFunction(() => (window as any).__RENDIV_LOADED__ === true, {
        timeout: 30000,
      });
    } catch (e) {
      const errorDetails = errors.length > 0
        ? `\nBrowser errors:\n${errors.join('\n')}`
        : '\nNo browser errors captured.';
      throw new Error(`Timed out waiting for Rendiv bundle to load.${errorDetails}`);
    }

    // Small delay to ensure compositions are registered
    await page.waitForTimeout(100);

    const compositions = await page.evaluate(() => {
      return (window as any).__RENDIV_GET_COMPOSITIONS__();
    });

    await page.close();
    return compositions;
  } finally {
    server.close();
  }
}

export async function selectComposition(
  serveUrl: string,
  id: string,
  inputProps?: Record<string, unknown>
): Promise<CompositionInfo> {
  const compositions = await getCompositions(serveUrl);
  const comp = compositions.find((c: CompositionInfo) => c.id === id);
  if (!comp) {
    const available = compositions.map((c: CompositionInfo) => c.id).join(', ');
    throw new Error(
      `Composition "${id}" not found. Available: ${available || '(none)'}`
    );
  }
  if (inputProps) {
    comp.defaultProps = { ...comp.defaultProps, ...inputProps };
  }
  return comp;
}
