import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { AnimatedImage } from '../components/AnimatedImage';
import { TimelineContext } from '../context/TimelineContext';
import { CompositionContext, type CompositionConfig } from '../context/CompositionContext';
import { getPendingHoldCount, _resetPendingHolds } from '../delay-render';

const compositionConfig: CompositionConfig = {
  id: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  defaultProps: {},
};

function renderInContext(ui: React.ReactElement, frame = 0) {
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

beforeEach(() => {
  _resetPendingHolds();
});

describe('AnimatedImage', () => {
  it('renders a canvas element', () => {
    const { container } = renderInContext(
      <AnimatedImage src="/animation.gif" width={200} height={200} />,
    );
    const canvas = container.querySelector('canvas');
    expect(canvas).not.toBeNull();
  });

  it('calls holdRender on mount', () => {
    renderInContext(
      <AnimatedImage src="/animation.gif" />,
    );
    expect(getPendingHoldCount()).toBeGreaterThan(0);
  });

  it('passes through style and className', () => {
    const { container } = renderInContext(
      <AnimatedImage
        src="/animation.gif"
        style={{ border: '1px solid red' }}
        className="anim"
      />,
    );
    const canvas = container.querySelector('canvas')!;
    expect(canvas.getAttribute('class')).toBe('anim');
    expect(canvas.style.border).toBe('1px solid red');
  });
});
