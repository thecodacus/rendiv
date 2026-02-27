import { useEffect, useRef } from 'react';
import { holdRender, releaseRender } from '@rendiv/core';
import { buildGoogleFontsUrl } from './build-url';
import type { GoogleFontOptions } from './types';

/**
 * React hook that loads a Google Font and blocks rendering until it's ready.
 *
 * ```tsx
 * const fontFamily = useFont({ family: 'Roboto', weight: '700' });
 * return <h1 style={{ fontFamily }}>Hello</h1>;
 * ```
 */
export function useFont(options: GoogleFontOptions): string {
  const {
    family,
    weight = '400',
    style = 'normal',
    display = 'block',
    subsets,
    text,
  } = options;

  const url = buildGoogleFontsUrl({ family, weight, style, display, subsets, text });
  const holdHandleRef = useRef<number | null>(null);

  useEffect(() => {
    const handle = holdRender(
      `Loading Google Font "${family}"`,
      { timeoutInMilliseconds: 30000 },
    );
    holdHandleRef.current = handle;

    const release = () => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    };

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;

    const fontSpec = `${style} ${weight} 16px "${family}"`;

    // Wait for the stylesheet to load before checking font availability.
    // document.fonts.load() resolves immediately if no matching @font-face
    // rule exists yet, so we must ensure the CSS is parsed first.
    link.onload = () => {
      document.fonts.load(fontSpec).then(release).catch((err) => {
        console.error(`useFont: Failed to load "${family}":`, err);
        release();
      });
    };

    link.onerror = () => {
      console.error(`useFont: Failed to load stylesheet for "${family}"`);
      release();
    };

    document.head.appendChild(link);

    return () => {
      release();
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [url, family, weight, style]);

  return `"${family}", sans-serif`;
}
