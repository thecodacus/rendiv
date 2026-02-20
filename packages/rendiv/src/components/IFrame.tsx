import React, { useCallback, useEffect, useRef, type IframeHTMLAttributes } from 'react';
import { holdRender, releaseRender } from '../delay-render';

export interface IFrameProps extends IframeHTMLAttributes<HTMLIFrameElement> {
  /** Timeout for holdRender in milliseconds. Default: 30000 */
  holdRenderTimeout?: number;
}

export function IFrame({
  holdRenderTimeout = 30000,
  onLoad: userOnLoad,
  onError: userOnError,
  ...iframeProps
}: IFrameProps): React.ReactElement {
  const holdHandleRef = useRef<number | null>(null);

  useEffect(() => {
    const handle = holdRender(
      `Loading <IFrame> with src="${iframeProps.src}"`,
      { timeoutInMilliseconds: holdRenderTimeout },
    );
    holdHandleRef.current = handle;

    return () => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
    };
  }, [iframeProps.src, holdRenderTimeout]);

  const handleLoad = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
      userOnLoad?.(e);
    },
    [userOnLoad],
  );

  const handleError = useCallback(
    (e: React.SyntheticEvent<HTMLIFrameElement>) => {
      if (holdHandleRef.current !== null) {
        releaseRender(holdHandleRef.current);
        holdHandleRef.current = null;
      }
      userOnError?.(e);
    },
    [userOnError],
  );

  return (
    <iframe
      {...iframeProps}
      onLoad={handleLoad}
      onError={handleError}
    />
  );
}

IFrame.displayName = 'IFrame';
