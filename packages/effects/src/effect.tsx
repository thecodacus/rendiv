import React from 'react';
import { useFrame } from '@rendiv/core';
import type { EffectProps } from './types';

export type { EffectProps };

export function Effect({
  filters,
  style,
  className,
  children,
}: EffectProps): React.ReactElement {
  const frame = useFrame();

  const filterString = filters.map((f) => f.resolve(frame)).join(' ');

  return (
    <div style={{ ...style, filter: filterString }} className={className}>
      {children}
    </div>
  );
}

Effect.displayName = 'Effect';
