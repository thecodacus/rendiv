import { useContext } from 'react';
import { TimelineContext } from '../context/TimelineContext';
import { SequenceContext } from '../context/SequenceContext';

export function useFrame(): number {
  const timeline = useContext(TimelineContext);
  const sequence = useContext(SequenceContext);
  return timeline.frame - sequence.accumulatedOffset;
}
