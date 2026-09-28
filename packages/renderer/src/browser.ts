import { chromium, type Browser, type Page } from 'playwright';

export type GlRenderer = 'swiftshader' | 'egl' | 'angle';

export interface OpenBrowserOptions {
  gl?: GlRenderer;
}

let browserInstance: Browser | null = null;
let currentGl: GlRenderer = 'swiftshader';

/**
 * Chromium flags per GL renderer.
 *
 * `egl` and `angle` must name an explicit ANGLE backend: plain `--use-gl=egl` / `--use-gl=angle` let headless
 * Chromium fall back to SwiftShader (software) even when a GPU and its drivers are present, so "GPU" renders were
 * silently running on the CPU. Verified on an NVIDIA RTX 3060 in Docker (WebGL renderer string):
 *   egl   → ANGLE (NVIDIA ..., OpenGL ES 3.2)        via --use-angle=gl-egl
 *   angle → ANGLE (NVIDIA, Vulkan 1.4 ...)            via --use-angle=vulkan
 * Both need the GPU's Vulkan/EGL userspace (see the Dockerfile); without it Chromium still falls back to SwiftShader.
 */
function glArgs(gl: GlRenderer): string[] {
  switch (gl) {
    case 'egl':
      return ['--use-gl=angle', '--use-angle=gl-egl'];
    case 'angle':
      return ['--use-gl=angle', '--use-angle=vulkan'];
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
      '--force-color-profile=srgb',
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
