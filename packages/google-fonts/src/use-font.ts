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

    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    document.head.appendChild(link);

    const fontSpec = `${style} ${weight} 16px "${family}"`;
    document.fonts.load(fontSpec)
      .then(() => {
        if (holdHandleRef.current !== null) {
          releaseRender(holdHandleRef.current);
          holdHandleRef.current = null;
        }
      })
      .catch((err) => {
        console.error(`useFont: Failed to load "${family}":`, err);
        if (holdHandleRef.current !== null) {
          releaseRender(holdHandleRef.current);
          holdHandleRef.current = null;
        }
      });

    return () => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
      if (link.parentNode) {
        link.parentNode.removeChild(link);
      }
    };
  }, [url, family, weight, style]);

  return `"${family}", sans-serif`;
}
