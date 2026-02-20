import { describe, it, expect, beforeEach } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Video } from '../components/Video';
import { TimelineContext } from '../context/TimelineContext';
import { CompositionContext, type CompositionConfig } from '../context/CompositionContext';
import { RendivEnvironmentContext } from '../context/RendivEnvironmentContext';
import { getPendingHoldCount, _resetPendingHolds } from '../delay-render';

const compositionConfig: CompositionConfig = {
  id: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  defaultProps: {},
};

function renderVideoInContext(
  ui: React.ReactElement,
  options?: { frame?: number; environment?: 'player' | 'rendering' | 'studio' },
) {
  const { frame = 0, environment = 'player' } = options ?? {};
  return render(
    <CompositionContext.Provider value={compositionConfig}>
      <RendivEnvironmentContext.Provider value={{ environment }}>
        <TimelineContext.Provider
          value={{
            frame,
            playing: false,
            playingRef: { current: false },
          }}
        >
          {ui}
        </TimelineContext.Provider>
      </RendivEnvironmentContext.Provider>
    </CompositionContext.Provider>,
  );
}

beforeEach(() => {
  _resetPendingHolds();
});

describe('Video', () => {
  it('renders a video element with src', () => {
    const { container } = renderVideoInContext(
      <Video src="/test.mp4" />,
    );
    const video = container.querySelector('video');
    expect(video).not.toBeNull();
    expect(video?.getAttribute('src')).toBe('/test.mp4');
  });

  it('sets preload and playsInline attributes', () => {
    const { container } = renderVideoInContext(
      <Video src="/test.mp4" />,
    );
    const video = container.querySelector('video')!;
    expect(video.getAttribute('preload')).toBe('auto');
    expect(video.playsInline).toBe(true);
  });

  it('calls holdRender on mount for metadata', () => {
    renderVideoInContext(<Video src="/test.mp4" />);
    expect(getPendingHoldCount()).toBeGreaterThan(0);
  });

  it('releases hold on unmount', () => {
    const { unmount } = renderVideoInContext(
      <Video src="/test.mp4" />,
    );
    expect(getPendingHoldCount()).toBe(1);
    unmount();
    expect(getPendingHoldCount()).toBe(0);
  });

  it('passes through style and className', () => {
    const { container } = renderVideoInContext(
      <Video src="/test.mp4" style={{ width: '100%' }} className="hero-video" />,
    );
    const video = container.querySelector('video')!;
    expect(video.getAttribute('class')).toBe('hero-video');
    expect(video.style.width).toBe('100%');
  });
});
