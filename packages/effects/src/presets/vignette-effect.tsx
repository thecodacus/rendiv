import React from 'react';
import type { CSSProperties, ReactNode } from 'react';

export interface VignetteEffectProps {
  intensity?: number;
  style?: CSSProperties;
  children: ReactNode;
}

export function VignetteEffect({
  intensity = 0.6,
  style,
  children,
}: VignetteEffectProps): React.ReactElement {
  return (
    <div style={{ position: 'relative', ...style }}>
      {children}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          pointerEvents: 'none',
          background: `radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,${intensity}) 100%)`,
        }}
      />
    </div>
  );
}

VignetteEffect.displayName = 'VignetteEffect';
