import type { GoogleFontOptions } from './types';

/**
 * Build a Google Fonts CSS API v2 URL.
 *
 * ```ts
 * buildGoogleFontsUrl({ family: 'Roboto', weight: 700, style: 'italic' });
 * // => 'https://fonts.googleapis.com/css2?family=Roboto:ital,wght@1,700&display=block&subset=latin'
 * ```
 */
export function buildGoogleFontsUrl(options: GoogleFontOptions): string {
  const {
    family,
    weight = '400',
    style = 'normal',
    display = 'block',
    subsets = ['latin'],
    text,
  } = options;

  // Google Fonts CSS v2 expects spaces as '+' and literal ':' / '@' in the
  // family spec.  URLSearchParams double-encodes '+' to '%2B' and encodes
  // ':' / '@', so we build the query string manually.
  const encodedFamily = family.replace(/ /g, '+');
  const ital = style === 'italic' ? 1 : 0;
  const wght = String(weight);

  let familySpec: string;
  if (ital === 0 && wght === '400') {
    familySpec = encodedFamily;
  } else if (ital === 0) {
    familySpec = `${encodedFamily}:wght@${wght}`;
  } else {
    familySpec = `${encodedFamily}:ital,wght@${ital},${wght}`;
  }

  let url = `https://fonts.googleapis.com/css2?family=${familySpec}&display=${display}`;

  for (const subset of subsets) {
    url += `&subset=${encodeURIComponent(subset)}`;
  }

  if (text) {
    url += `&text=${encodeURIComponent(text)}`;
  }

  return url;
}
