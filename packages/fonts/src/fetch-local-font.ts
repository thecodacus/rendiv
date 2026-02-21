import type { LocalFontOptions, FontResult } from './types';

const FORMAT_MAP: Record<string, string> = {
  woff2: 'woff2',
  woff: 'woff',
  ttf: 'truetype',
  otf: 'opentype',
};

/**
 * Load a font from a URL or local file path using the FontFace API.
 *
 * ```ts
 * const { fontFamily } = await fetchLocalFont({
 *   family: 'CustomFont',
 *   src: '/fonts/custom.woff2',
 * });
 * ```
 */
export async function fetchLocalFont(options: LocalFontOptions): Promise<FontResult> {
  const {
    family,
    src,
    format,
    weight = '400',
    style = 'normal',
    display = 'block',
    unicodeRange,
  } = options;

  const resolvedFormat = format ?? detectFormat(src);

  const descriptors: FontFaceDescriptors = {
    weight: String(weight),
    style,
    display,
  };

  if (unicodeRange) {
    descriptors.unicodeRange = unicodeRange;
  }

  const url = resolvedFormat
    ? `url("${src}") format("${resolvedFormat}")`
    : `url("${src}")`;

  const fontFace = new FontFace(family, url, descriptors);
  const loaded = await fontFace.load();
  document.fonts.add(loaded);

  return {
    fontFamily: `"${family}", sans-serif`,
    cleanup: () => {
      document.fonts.delete(loaded);
    },
  };
}

function detectFormat(src: string): string | undefined {
  const ext = src.split('.').pop()?.toLowerCase();
  return ext ? FORMAT_MAP[ext] : undefined;
}
