import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { useFrame } from '../hooks/use-frame';
import { Freeze } from '../components/Freeze';
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
    </CompositionContext.Provider>,
  );
}

describe('Freeze', () => {
  it('freezes children at the specified frame', () => {
    const { getByTestId } = renderAtFrame(50, (
      <Freeze frame={10}>
        <FrameDisplay />
      </Freeze>
    ));
    expect(getByTestId('frame').textContent).toBe('10');
  });

  it('children always see the frozen frame regardless of playback position', () => {
    const { getByTestId, rerender } = render(
      <CompositionContext.Provider value={compositionConfig}>
        <TimelineContext.Provider
          value={{ frame: 0, playing: false, playingRef: { current: false } }}
        >
          <Freeze frame={25}>
            <FrameDisplay />
          </Freeze>
        </TimelineContext.Provider>
      </CompositionContext.Provider>,
    );
    expect(getByTestId('frame').textContent).toBe('25');

    rerender(
      <CompositionContext.Provider value={compositionConfig}>
        <TimelineContext.Provider
          value={{ frame: 100, playing: false, playingRef: { current: false } }}
        >
          <Freeze frame={25}>
            <FrameDisplay />
          </Freeze>
        </TimelineContext.Provider>
      </CompositionContext.Provider>,
    );
    expect(getByTestId('frame').textContent).toBe('25');
  });

  it('works inside a Sequence', () => {
    const { getByTestId } = renderAtFrame(50, (
      <Sequence from={20}>
        <Freeze frame={35}>
          <FrameDisplay />
        </Freeze>
      </Sequence>
    ));
    // Freeze sets timeline.frame to 35
    // useFrame() returns timeline.frame - accumulatedOffset = 35 - 20 = 15
    expect(getByTestId('frame').textContent).toBe('15');
  });

  it('freezes at frame 0', () => {
    const { getByTestId } = renderAtFrame(80, (
      <Freeze frame={0}>
        <FrameDisplay />
      </Freeze>
    ));
    expect(getByTestId('frame').textContent).toBe('0');
  });
});
