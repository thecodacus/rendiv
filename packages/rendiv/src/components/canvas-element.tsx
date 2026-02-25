import React, { useContext, useMemo, type ReactNode } from 'react';
import { CanvasElementContext } from '../context/canvas-element-context';
import { SequenceContext, type SequenceContextValue } from '../context/SequenceContext';

export interface CanvasElementProps {
  /** The composition ID whose overrides should apply to children. */
  id: string;
  children: ReactNode;
}

export function CanvasElement({ id, children }: CanvasElementProps): React.ReactElement {
  const parentSequence = useContext(SequenceContext);

  // Reset namePath so inner Sequences build fresh paths with the scoped
  // composition ID as prefix. Preserve all timing fields unchanged.
  const scopedSequence = useMemo<SequenceContextValue>(
    () => ({ ...parentSequence, namePath: '' }),
    [parentSequence],
  );

  return (
    <CanvasElementContext.Provider value={id}>
      <SequenceContext.Provider value={scopedSequence}>
        {children}
      </SequenceContext.Provider>
    </CanvasElementContext.Provider>
  );
}

CanvasElement.displayName = 'CanvasElement';
