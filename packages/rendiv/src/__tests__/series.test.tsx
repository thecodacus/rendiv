import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { useFrame } from '../hooks/use-frame';
import { Series } from '../components/Series';
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

function FrameDisplay({ label }: { label: string }) {
  const frame = useFrame();
  return <div data-testid={`frame-${label}`}>{frame}</div>;
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

describe('Series', () => {
  it('renders sequences back-to-back', () => {
    const { getByTestId, queryByTestId } = renderAtFrame(0, (
      <Series>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="first" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="second" />
        </Series.Sequence>
      </Series>
    ));
    expect(getByTestId('frame-first').textContent).toBe('0');
    expect(queryByTestId('frame-second')).toBeNull();
  });

  it('shows the second sequence after the first ends', () => {
    const { queryByTestId, getByTestId } = renderAtFrame(30, (
      <Series>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="first" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="second" />
        </Series.Sequence>
      </Series>
    ));
    expect(queryByTestId('frame-first')).toBeNull();
    expect(getByTestId('frame-second').textContent).toBe('0');
  });

  it('resets useFrame() to 0 for each sequence', () => {
    const { getByTestId } = renderAtFrame(45, (
      <Series>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="first" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="second" />
        </Series.Sequence>
      </Series>
    ));
    // Second starts at from=30, frame 45: useFrame = 45 - 30 = 15
    expect(getByTestId('frame-second').textContent).toBe('15');
  });

  it('calculates offsets for three sequences', () => {
    const { getByTestId, queryByTestId } = renderAtFrame(55, (
      <Series>
        <Series.Sequence durationInFrames={10}>
          <FrameDisplay label="a" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={20}>
          <FrameDisplay label="b" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="c" />
        </Series.Sequence>
      </Series>
    ));
    // a: from=0, duration=10 (frames 0-9)
    // b: from=10, duration=20 (frames 10-29)
    // c: from=30, duration=30 (frames 30-59)
    expect(queryByTestId('frame-a')).toBeNull();
    expect(queryByTestId('frame-b')).toBeNull();
    expect(getByTestId('frame-c').textContent).toBe('25'); // 55 - 30 = 25
  });

  it('supports positive offset to create gaps', () => {
    const { queryByTestId, getByTestId } = renderAtFrame(35, (
      <Series>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="first" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={30} offset={10}>
          <FrameDisplay label="second" />
        </Series.Sequence>
      </Series>
    ));
    // first: from=0, dur=30 (0-29)
    // second: from=30+10=40, dur=30 (40-69)
    // frame 35 is in the gap — neither visible
    expect(queryByTestId('frame-first')).toBeNull();
    expect(queryByTestId('frame-second')).toBeNull();
  });

  it('supports negative offset to create overlaps', () => {
    const { getByTestId } = renderAtFrame(25, (
      <Series>
        <Series.Sequence durationInFrames={30}>
          <FrameDisplay label="first" />
        </Series.Sequence>
        <Series.Sequence durationInFrames={30} offset={-5}>
          <FrameDisplay label="second" />
        </Series.Sequence>
      </Series>
    ));
    // first: from=0, dur=30 (0-29)
    // second: from=30+(-5)=25, dur=30 (25-54)
    // frame 25: both visible
    expect(getByTestId('frame-first').textContent).toBe('25');
    expect(getByTestId('frame-second').textContent).toBe('0');
  });

  it('throws for non-Series.Sequence children', () => {
    expect(() => {
      renderAtFrame(0, (
        <Series>
          <div>invalid</div>
        </Series>
      ));
    }).toThrow('Only <Series.Sequence> elements are allowed');
  });
});
