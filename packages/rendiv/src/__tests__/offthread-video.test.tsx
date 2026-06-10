import { describe, it, expect, beforeEach, vi } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { OffthreadVideo } from '../components/offthread-video';
import { TimelineContext } from '../context/TimelineContext';
import { CompositionContext, type CompositionConfig } from '../context/CompositionContext';
import { RendivEnvironmentContext } from '../context/RendivEnvironmentContext';
import { _resetPendingHolds } from '../delay-render';

const compositionConfig: CompositionConfig = {
  id: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  defaultProps: {},
};

function treeAtFrame(
  ui: React.ReactElement,
  frame: number,
  environment: 'player' | 'rendering' | 'studio' = 'rendering',
) {
  return (
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
    </CompositionContext.Provider>
  );
}

beforeEach(() => {
  _resetPendingHolds();
  // The rendering-mode component fetches frames from the extraction
  // endpoint; reject so the catch path (keep last frame / release hold) runs.
  vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('no server in tests'))));
});

describe('OffthreadVideo rendering mode', () => {
  it('renders null past endAt', () => {
    const { container } = render(
      treeAtFrame(<OffthreadVideo src="/clip.mp4" endAt={34} muted />, 34),
    );
    expect(container.querySelector('img')).toBeNull();
  });

  it('keeps hook order constant when the frame crosses endAt (no tree unmount)', () => {
    // Regression: the past-endAt branch used to early-return BEFORE the
    // useEffect hooks. The first frame where videoFrame >= endAt then
    // rendered fewer hooks than the previous frame, React threw
    // "Rendered fewer hooks than expected", and the entire composition
    // tree unmounted — every subsequent frame of the render came out
    // black (Studio was unaffected because it delegates to <Video>).
    const ui = <OffthreadVideo src="/clip.mp4" endAt={34} muted />;
    const { container, rerender } = render(treeAtFrame(ui, 33));

    expect(() => {
      rerender(treeAtFrame(ui, 34));
    }).not.toThrow();

    // and it must stay renderable on the frames after the boundary
    expect(() => {
      rerender(treeAtFrame(ui, 35));
    }).not.toThrow();
    expect(container.querySelector('img')).toBeNull();
  });

  it('still renders normally before endAt', () => {
    const { container } = render(
      treeAtFrame(<OffthreadVideo src="/clip.mp4" endAt={34} muted />, 0),
    );
    // no frame fetched yet (fetch rejected) -> nothing rendered, but no crash
    expect(container.querySelector('video')).toBeNull();
  });

  it('delegates to <Video> outside rendering mode', () => {
    const { container } = render(
      treeAtFrame(<OffthreadVideo src="/clip.mp4" muted />, 0, 'player'),
    );
    expect(container.querySelector('video')).not.toBeNull();
  });
});
