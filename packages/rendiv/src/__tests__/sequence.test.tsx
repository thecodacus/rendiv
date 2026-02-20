import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { useFrame } from '../hooks/use-frame';
import { Sequence } from '../components/Sequence';
import { TimelineContext } from '../context/TimelineContext';
import { CompositionContext, type CompositionConfig } from '../context/CompositionContext';

const compositionConfig: CompositionConfig = {
  id: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  defaultProps: {},
};

function FrameDisplay() {
  const frame = useFrame();
  return <div data-testid="frame">{frame}</div>;
}

function renderAtFrame(frame: number, ui: React.ReactElement) {
  return render(
    <CompositionContext.Provider value={compositionConfig}>
      <TimelineContext.Provider
        value={{
          frame,
          playing: false,
          playingRef: { current: false },
        }}
      >
        {ui}
      </TimelineContext.Provider>
    </CompositionContext.Provider>
  );
}

describe('Sequence', () => {
  it('offsets useFrame for children', () => {
    const { getByTestId } = renderAtFrame(45, (
      <Sequence from={30}>
        <FrameDisplay />
      </Sequence>
    ));
    expect(getByTestId('frame').textContent).toBe('15');
  });

  it('hides children before the from frame', () => {
    const { queryByTestId } = renderAtFrame(10, (
      <Sequence from={30}>
        <FrameDisplay />
      </Sequence>
    ));
    expect(queryByTestId('frame')).toBeNull();
  });

  it('hides children after durationInFrames', () => {
    const { queryByTestId } = renderAtFrame(100, (
      <Sequence from={30} durationInFrames={60}>
        <FrameDisplay />
      </Sequence>
    ));
    expect(queryByTestId('frame')).toBeNull();
  });

  it('shows children within the frame range', () => {
    const { getByTestId } = renderAtFrame(50, (
      <Sequence from={30} durationInFrames={60}>
        <FrameDisplay />
      </Sequence>
    ));
    expect(getByTestId('frame').textContent).toBe('20');
  });

  it('nests Sequences correctly', () => {
    const { getByTestId } = renderAtFrame(55, (
      <Sequence from={10}>
        <Sequence from={20}>
          <FrameDisplay />
        </Sequence>
      </Sequence>
    ));
    // Frame 55, outer from=10, inner from=20
    // Absolute start of inner = 10 + 20 = 30
    // Relative frame = 55 - 30 = 25
    expect(getByTestId('frame').textContent).toBe('25');
  });
});
