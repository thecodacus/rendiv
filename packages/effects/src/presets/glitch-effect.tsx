import React, { useMemo } from 'react';
import { useFrame } from '@rendiv/core';
import type { CSSProperties, ReactNode } from 'react';

export interface GlitchEffectProps {
  intensity?: number;
  seed?: number;
  style?: CSSProperties;
  children: ReactNode;
}

function pseudoRandom(a: number, b: number): number {
  return ((a * 2654435761 + b) >>> 0) / 4294967296;
}

export function GlitchEffect({
  intensity = 1,
  seed = 42,
  style,
  children,
}: GlitchEffectProps): React.ReactElement {
  const frame = useFrame();

  const glitch = useMemo(() => {
    const r1 = pseudoRandom(frame, seed);
    const r2 = pseudoRandom(frame, seed + 1);
    const r3 = pseudoRandom(frame, seed + 2);

    const offsetX = (r1 * 20 - 10) * intensity;
    const sliceY = r2 * 80 + 10;
    const sliceH = r3 * 25 + 5;

    return { offsetX, sliceY, sliceH };
  }, [frame, seed, intensity]);

  return (
    <div style={{ position: 'relative', ...style }}>
      {children}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${glitch.offsetX}px)`,
          mixBlendMode: 'screen',
          opacity: 0.8 * intensity,
          filter: 'saturate(2) hue-rotate(-60deg)',
          clipPath: `inset(${glitch.sliceY}% 0 ${Math.max(0, 100 - glitch.sliceY - glitch.sliceH)}% 0)`,
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-glitch.offsetX * 0.7}px)`,
          mixBlendMode: 'screen',
          opacity: 0.8 * intensity,
          filter: 'saturate(2) hue-rotate(60deg)',
          clipPath: `inset(${Math.max(0, glitch.sliceY - 20)}% 0 ${Math.max(0, 100 - glitch.sliceY - glitch.sliceH + 20)}% 0)`,
          pointerEvents: 'none',
        }}
      >
        {children}
      </div>
    </div>
  );
}

GlitchEffect.displayName = 'GlitchEffect';
