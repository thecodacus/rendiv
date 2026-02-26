import { chromium, type Browser, type Page } from 'playwright';

export type GlRenderer = 'swiftshader' | 'egl' | 'angle';

export interface OpenBrowserOptions {
  gl?: GlRenderer;
}

let browserInstance: Browser | null = null;
let currentGl: GlRenderer = 'swiftshader';

function glArgs(gl: GlRenderer): string[] {
  switch (gl) {
    case 'egl':
      return ['--use-gl=egl'];
    case 'angle':
      return ['--use-gl=angle'];
    case 'swiftshader':
    default:
      return ['--use-gl=angle', '--use-angle=swiftshader'];
  }
}

export async function openBrowser(options?: OpenBrowserOptions): Promise<Browser> {
  const gl = options?.gl ?? 'swiftshader';

  if (browserInstance && browserInstance.isConnected() && gl !== currentGl) {
    await browserInstance.close();
    browserInstance = null;
  }

  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }

  currentGl = gl;
  browserInstance = await chromium.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      ...glArgs(gl),
    ],
  });
  return browserInstance;
}

export async function closeBrowser(): Promise<void> {
  if (browserInstance) {
    await browserInstance.close();
    browserInstance = null;
  }
}

export async function ensureBrowser(): Promise<Browser> {
  return openBrowser();
}

export async function openPage(
  browser: Browser,
  url: string,
  viewport: { width: number; height: number }
): Promise<Page> {
  const context = await browser.newContext({
    viewport,
    deviceScaleFactor: 1,
  });
  const page = await context.newPage();
  await page.goto(url, { waitUntil: 'networkidle' });
  return page;
}
