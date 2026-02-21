import React, { useContext, useMemo, type ReactNode } from 'react';
import { TimelineContext } from '@rendiv/core';

export interface ShutterBlurProps {
  /** Shutter angle in degrees (0–360). 180° = half-frame exposure. Default: 180 */
  angle?: number;
  /** Number of sub-frame samples. More = smoother blur. Default: 10 */
  layers?: number;
  children: ReactNode;
}

export function ShutterBlur({
  angle = 180,
  layers = 10,
  children,
}: ShutterBlurProps): React.ReactElement {
  const timeline = useContext(TimelineContext);

  const shutterFraction = angle / 360;
  const sampleOpacity = 1 / layers;

  const layerElements = useMemo(() => {
    const elements: React.ReactElement[] = [];

    for (let i = 0; i < layers; i++) {
      // Distribute samples evenly from (frame - shutterFraction) to frame
      const t = layers === 1 ? 1 : i / (layers - 1);
      const frameOffset = -shutterFraction * (1 - t);

      elements.push(
        <BlurLayer
          key={i}
          frame={timeline.frame + frameOffset}
          playing={timeline.playing}
          playingRef={timeline.playingRef}
          opacity={sampleOpacity}
        >
          {children}
        </BlurLayer>,
      );
    }

    return elements;
  }, [layers, shutterFraction, sampleOpacity, timeline.frame, timeline.playing, timeline.playingRef, children]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {layerElements}
    </div>
  );
}

ShutterBlur.displayName = 'ShutterBlur';

function BlurLayer({
  frame,
  playing,
  playingRef,
  opacity,
  children,
}: {
  frame: number;
  playing: boolean;
  playingRef: React.MutableRefObject<boolean>;
  opacity: number;
  children: ReactNode;
}): React.ReactElement {
  const value = useMemo(
    () => ({ frame, playing, playingRef }),
    [frame, playing, playingRef],
  );

  return (
    <div style={{ position: 'absolute', inset: 0, opacity }}>
      <TimelineContext.Provider value={value}>
        {children}
      </TimelineContext.Provider>
    </div>
  );
}
