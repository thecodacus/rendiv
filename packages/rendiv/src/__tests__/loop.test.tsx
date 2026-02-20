import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { useFrame } from '../hooks/use-frame';
import { Loop } from '../components/Loop';
import { Sequence } from '../components/Sequence';
import { TimelineContext } from '../context/TimelineContext';
import { CompositionContext, type CompositionConfig } from '../context/CompositionContext';

const compositionConfig: CompositionConfig = {
  id: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 300,
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
    </CompositionContext.Provider>,
  );
}

describe('Loop', () => {
  it('loops frame within durationInFrames', () => {
    const { getByTestId } = renderAtFrame(25, (
      <Loop durationInFrames={10}>
        <FrameDisplay />
      </Loop>
    ));
    // 25 % 10 = 5
    expect(getByTestId('frame').textContent).toBe('5');
  });

  it('returns null after all iterations when times is finite', () => {
    const { queryByTestId } = renderAtFrame(30, (
      <Loop durationInFrames={10} times={3}>
        <FrameDisplay />
      </Loop>
    ));
    // times=3, durationInFrames=10 => total=30, frame 30 is past the end
    expect(queryByTestId('frame')).toBeNull();
  });

  it('renders within finite iterations', () => {
    const { getByTestId } = renderAtFrame(25, (
      <Loop durationInFrames={10} times={3}>
        <FrameDisplay />
      </Loop>
    ));
    // 25 % 10 = 5, still within 3 iterations (total 30)
    expect(getByTestId('frame').textContent).toBe('5');
  });

  it('returns null for negative frames', () => {
    // Simulating a negative local frame by wrapping in a Sequence
    // At frame 5, Sequence from=10 would not render its children at all
    // But for Loop itself, if localFrame < 0 it returns null
    const { queryByTestId } = renderAtFrame(5, (
      <Sequence from={10}>
        <Loop durationInFrames={10}>
          <FrameDisplay />
        </Loop>
      </Sequence>
    ));
    expect(queryByTestId('frame')).toBeNull();
  });

  it('infinite loop never stops', () => {
    const { getByTestId } = renderAtFrame(1000, (
      <Loop durationInFrames={10}>
        <FrameDisplay />
      </Loop>
    ));
    // 1000 % 10 = 0
    expect(getByTestId('frame').textContent).toBe('0');
  });

  it('works inside a Sequence', () => {
    const { getByTestId } = renderAtFrame(35, (
      <Sequence from={20}>
        <Loop durationInFrames={10}>
          <FrameDisplay />
        </Loop>
      </Sequence>
    ));
    // localFrame inside Sequence = 35 - 20 = 15
    // 15 % 10 = 5
    expect(getByTestId('frame').textContent).toBe('5');
  });

  it('times=1 renders only the first iteration', () => {
    const { queryByTestId } = renderAtFrame(10, (
      <Loop durationInFrames={10} times={1}>
        <FrameDisplay />
      </Loop>
    ));
    // frame 10 is at the boundary, >= 10*1 = 10 => null
    expect(queryByTestId('frame')).toBeNull();
  });
});
