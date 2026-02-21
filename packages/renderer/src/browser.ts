import { chromium, type Browser, type Page } from 'playwright';

let browserInstance: Browser | null = null;

export async function openBrowser(): Promise<Browser> {
  if (browserInstance && browserInstance.isConnected()) {
    return browserInstance;
  }
  browserInstance = await chromium.launch({
    headless: true,
    args: [
      '--disable-web-security',
      '--disable-features=IsolateOrigins',
      '--disable-site-isolation-trials',
      '--no-sandbox',
      '--use-gl=angle',
      '--use-angle=swiftshader',
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
