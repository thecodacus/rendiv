import React from 'react';
import { useFrame } from '@rendiv/core';
import type { CSSProperties, ReactNode } from 'react';

export interface ChromaEffectProps {
  shift?: number;
  style?: CSSProperties;
  children: ReactNode;
}

export function ChromaEffect({
  shift = 3,
  style,
  children,
}: ChromaEffectProps): React.ReactElement {
  useFrame(); // subscribe to frame updates for consistency

  return (
    <div style={{ position: 'relative', ...style }}>
      {/* Red channel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${-shift}px)`,
          mixBlendMode: 'screen',
          filter: 'saturate(0) brightness(0.8)',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      >
        <div style={{ filter: 'sepia(1) saturate(10) hue-rotate(0deg)' }}>
          {children}
        </div>
      </div>
      {/* Green channel (base) */}
      <div style={{ position: 'relative' }}>
        {children}
      </div>
      {/* Blue channel */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: `translateX(${shift}px)`,
          mixBlendMode: 'screen',
          filter: 'saturate(0) brightness(0.8)',
          opacity: 0.8,
          pointerEvents: 'none',
        }}
      >
        <div style={{ filter: 'sepia(1) saturate(10) hue-rotate(200deg)' }}>
          {children}
        </div>
      </div>
    </div>
  );
}

ChromaEffect.displayName = 'ChromaEffect';
