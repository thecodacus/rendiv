import React, { useContext, useMemo, type ReactNode } from 'react';
import { TimelineContext } from '@rendiv/core';

export interface MotionTrailProps {
  /** Number of trail copies. Default: 5 */
  layers?: number;
  /** Frame offset between each layer. Default: 1 */
  offset?: number;
  /** Opacity multiplier per layer (0–1). Layer i has opacity fadeRate^i. Default: 0.6 */
  fadeRate?: number;
  children: ReactNode;
}

export function MotionTrail({
  layers = 5,
  offset = 1,
  fadeRate = 0.6,
  children,
}: MotionTrailProps): React.ReactElement {
  const timeline = useContext(TimelineContext);

  // Build layers from oldest (most faded, bottom) to newest (full opacity, top)
  const layerElements = useMemo(() => {
    const elements: React.ReactElement[] = [];

    for (let i = layers - 1; i >= 0; i--) {
      const frameShift = i * offset;
      const opacity = Math.pow(fadeRate, i);

      elements.push(
        <TrailLayer
          key={i}
          frame={timeline.frame - frameShift}
          playing={timeline.playing}
          playingRef={timeline.playingRef}
          opacity={opacity}
        >
          {children}
        </TrailLayer>,
      );
    }

    return elements;
  }, [layers, offset, fadeRate, timeline.frame, timeline.playing, timeline.playingRef, children]);

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {layerElements}
    </div>
  );
}

MotionTrail.displayName = 'MotionTrail';

function TrailLayer({
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
