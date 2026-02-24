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

  it('applies zIndex from trackIndex prop', () => {
    const { container } = renderAtFrame(0, (
      <Sequence from={0} trackIndex={0}>
        <FrameDisplay />
      </Sequence>
    ));
    const fill = container.querySelector('[data-testid="frame"]')!.parentElement!;
    expect(fill.style.zIndex).toBe('10000');
  });

  it('lower trackIndex gets higher zIndex (renders in front)', () => {
    const { container } = renderAtFrame(0, (
      <>
        <Sequence from={0} trackIndex={0} name="front">
          <div data-testid="front" />
        </Sequence>
        <Sequence from={0} trackIndex={2} name="back">
          <div data-testid="back" />
        </Sequence>
      </>
    ));
    const front = container.querySelector('[data-testid="front"]')!.parentElement!;
    const back = container.querySelector('[data-testid="back"]')!.parentElement!;
    expect(Number(front.style.zIndex)).toBeGreaterThan(Number(back.style.zIndex));
  });

  it('defaults trackIndex to 0 when not set', () => {
    const { container } = renderAtFrame(0, (
      <Sequence from={0}>
        <FrameDisplay />
      </Sequence>
    ));
    const fill = container.querySelector('[data-testid="frame"]')!.parentElement!;
    expect(fill.style.zIndex).toBe('10000');
  });

  it('playbackRate=2 doubles the frame rate children see', () => {
    // Sequence starts at frame 10, we're at frame 15 (local frame = 5)
    // At 2x speed, children should see local frame 10 → useFrame() = 10
    const { getByTestId } = renderAtFrame(15, (
      <Sequence from={10} playbackRate={2}>
        <FrameDisplay />
      </Sequence>
    ));
    expect(getByTestId('frame').textContent).toBe('10');
  });

  it('playbackRate=0.5 halves the frame rate children see', () => {
    // Sequence starts at frame 10, we're at frame 20 (local frame = 10)
    // At 0.5x speed, children should see local frame 5 → useFrame() = 5
    const { getByTestId } = renderAtFrame(20, (
      <Sequence from={10} playbackRate={0.5}>
        <FrameDisplay />
      </Sequence>
    ));
    expect(getByTestId('frame').textContent).toBe('5');
  });

  it('playbackRate=1 behaves identically to default', () => {
    const { getByTestId } = renderAtFrame(45, (
      <Sequence from={30} playbackRate={1}>
        <FrameDisplay />
      </Sequence>
    ));
    expect(getByTestId('frame').textContent).toBe('15');
  });
});
