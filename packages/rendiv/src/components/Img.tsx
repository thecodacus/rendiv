import React, { useCallback, useEffect, useRef, type ImgHTMLAttributes } from 'react';
import { holdRender, releaseRender } from '../delay-render';

export interface ImgProps extends ImgHTMLAttributes<HTMLImageElement> {
  /** Timeout for holdRender in milliseconds. Default: 30000 */
  holdRenderTimeout?: number;
}

export function Img({
  holdRenderTimeout = 30000,
  onLoad: userOnLoad,
  onError: userOnError,
  ...imgProps
}: ImgProps): React.ReactElement {
  const holdHandleRef = useRef<number | null>(null);

  useEffect(() => {
    const handle = holdRender(
      `Loading <Img> with src="${imgProps.src}"`,
      { timeoutInMilliseconds: holdRenderTimeout },
    );
    holdHandleRef.current = handle;

    return () => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    };
  }, [imgProps.src, holdRenderTimeout]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
      userOnLoad?.(e);
    },
    [userOnLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
      userOnError?.(e);
    },
    [userOnError],
  );

  return (
    <img
      {...imgProps}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

Img.displayName = 'Img';
