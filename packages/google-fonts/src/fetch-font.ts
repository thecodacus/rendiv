import { buildGoogleFontsUrl } from './build-url';
import type { GoogleFontOptions, GoogleFontResult } from './types';

/**
 * Load a Google Font by injecting a stylesheet `<link>` and waiting
 * for the font to be available via the Font Loading API.
 *
 * ```ts
 * const { fontFamily, cleanup } = await fetchFont({ family: 'Roboto' });
 * // ... use fontFamily in styles ...
 * cleanup(); // removes the <link> tag
 * ```
 */
export async function fetchFont(options: GoogleFontOptions): Promise<GoogleFontResult> {
  const {
    family,
    weight = '400',
    style = 'normal',
  } = options;

  const url = buildGoogleFontsUrl(options);

  const link = document.createElement('link');
  link.rel = 'stylesheet';
  link.href = url;

  // Wait for the stylesheet to load before checking font availability.
  // document.fonts.load() resolves immediately if no matching @font-face
  // rule exists yet, so we must ensure the CSS is parsed first.
  await new Promise<void>((resolve, reject) => {
    link.onload = () => resolve();
    link.onerror = () => reject(new Error(`Failed to load stylesheet for "${family}"`));
    document.head.appendChild(link);
  });

  const fontSpec = `${style} ${weight} 16px "${family}"`;
  await document.fonts.load(fontSpec);

  return {
    fontFamily: `"${family}", sans-serif`,
    cleanup: () => {
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    },
  };
}
