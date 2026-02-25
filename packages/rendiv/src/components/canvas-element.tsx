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
  const parentCtx = useContext(CanvasElementContext);
  const isNested = parentCtx !== null;

  // Reset namePath so inner Sequences build fresh paths with the scoped
  // composition ID as prefix. Preserve all timing fields unchanged.
  const scopedSequence = useMemo<SequenceContextValue>(
    () => ({ ...parentSequence, namePath: '' }),
    [parentSequence],
  );

  const ctxValue = useMemo(() => ({ id, nested: isNested, scopeOffset: parentSequence.accumulatedOffset }), [id, isNested, parentSequence.accumulatedOffset]);

  return (
    <CanvasElementContext.Provider value={ctxValue}>
      <SequenceContext.Provider value={scopedSequence}>
        {children}
      </SequenceContext.Provider>
    </CanvasElementContext.Provider>
  );
}

CanvasElement.displayName = 'CanvasElement';
