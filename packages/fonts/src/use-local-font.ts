import { useEffect, useRef, useState } from 'react';
import { holdRender, releaseRender } from '@rendiv/core';
import { fetchLocalFont } from './fetch-local-font';
import type { LocalFontOptions } from './types';

/**
 * React hook that loads a local font and blocks rendering until it's ready.
 *
 * ```tsx
 * const fontFamily = useLocalFont({
 *   family: 'CustomFont',
 *   src: staticFile('custom.woff2'),
 * });
 *
 * return <h1 style={{ fontFamily }}>Hello</h1>;
 * ```
 */
export function useLocalFont(options: LocalFontOptions): string {
  const { family, src, format, weight, style, display, unicodeRange } = options;
  const holdHandleRef = useRef<number | null>(null);
  const cleanupRef = useRef<(() => void) | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const handle = holdRender(
      `Loading font "${family}" from "${src}"`,
      { timeoutInMilliseconds: 30000 },
    );
    holdHandleRef.current = handle;

    fetchLocalFont({ family, src, format, weight, style, display, unicodeRange })
      .then((result) => {
        cleanupRef.current = result.cleanup;
        setReady(true);
        if (holdHandleRef.current !== null) {
          releaseRender(holdHandleRef.current);
          holdHandleRef.current = null;
        }
      })
      .catch((err) => {
        console.error(`useLocalFont: Failed to load "${family}":`, err);
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
      if (cleanupRef.current) {
        cleanupRef.current();
        cleanupRef.current = null;
      }
    };
  }, [family, src, format, weight, style, display, unicodeRange]);

  return `"${family}", sans-serif`;
}
