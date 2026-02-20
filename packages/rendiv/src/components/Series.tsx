import React, { Children, type CSSProperties, type ReactNode } from 'react';
import { Sequence } from './Sequence';

export interface SeriesSequenceProps {
  durationInFrames: number;
  /** Additional offset to shift this entry. Negative values create overlaps. */
  offset?: number;
  /** Display name for this sequence in the Studio timeline. */
  name?: string;
  layout?: 'none' | 'absolute-fill';
  style?: CSSProperties;
  children: ReactNode;
}

export interface SeriesProps {
  children: ReactNode;
}

function SeriesSequence(_props: SeriesSequenceProps): React.ReactNode {
  throw new Error(
    '<Series.Sequence> can only be used as a direct child of <Series>.',
  );
}

SeriesSequence.displayName = 'Series.Sequence';

function SeriesRoot({ children }: SeriesProps): React.ReactElement {
  const childArray = Children.toArray(children);

  let accumulatedFrom = 0;
  const sequences: React.ReactElement[] = [];

  for (const child of childArray) {
    if (!React.isValidElement(child)) continue;

    if (child.type !== SeriesSequence) {
      throw new Error(
        'Only <Series.Sequence> elements are allowed as children of <Series>.',
      );
    }

    const {
      durationInFrames,
      offset = 0,
      name,
      layout,
      style,
      children: sequenceChildren,
    } = child.props as SeriesSequenceProps;

    const from = accumulatedFrom + offset;

    // Derive name from the child component if not explicitly provided
    let sequenceName = name;
    if (!sequenceName) {
      const childElements = Children.toArray(sequenceChildren);
      if (childElements.length > 0) {
        const first = childElements[0];
        if (React.isValidElement(first) && typeof first.type !== 'string') {
          const type = first.type as { displayName?: string; name?: string };
          sequenceName = type.displayName || type.name;
        }
      }
    }

    sequences.push(
      <Sequence
        key={child.key ?? sequences.length}
        from={from}
        durationInFrames={durationInFrames}
        name={sequenceName}
        layout={layout}
        style={style}
      >
        {sequenceChildren}
      </Sequence>,
    );

    accumulatedFrom = from + durationInFrames;
  }

  return <>{sequences}</>;
}

SeriesRoot.displayName = 'Series';

export const Series = Object.assign(SeriesRoot, {
  Sequence: SeriesSequence,
});
