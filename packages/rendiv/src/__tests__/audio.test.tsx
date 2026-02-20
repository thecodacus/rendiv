import { describe, it, expect } from 'vitest';
import React from 'react';
import { render } from '@testing-library/react';
import { Audio } from '../components/Audio';
import { TimelineContext } from '../context/TimelineContext';
import { CompositionContext, type CompositionConfig } from '../context/CompositionContext';
import { RendivEnvironmentContext } from '../context/RendivEnvironmentContext';

const compositionConfig: CompositionConfig = {
  id: 'test',
  width: 1920,
  height: 1080,
  fps: 30,
  durationInFrames: 150,
  defaultProps: {},
};

function renderAudioInContext(
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

describe('Audio', () => {
  it('renders audio element in player mode', () => {
    const { container } = renderAudioInContext(
      <Audio src="/test.mp3" />,
      { environment: 'player' },
    );
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
    expect(audio?.getAttribute('src')).toBe('/test.mp3');
  });

  it('renders null in rendering mode', () => {
    const { container } = renderAudioInContext(
      <Audio src="/test.mp3" />,
      { environment: 'rendering' },
    );
    const audio = container.querySelector('audio');
    expect(audio).toBeNull();
  });

  it('renders audio in studio mode', () => {
    const { container } = renderAudioInContext(
      <Audio src="/test.mp3" />,
      { environment: 'studio' },
    );
    const audio = container.querySelector('audio');
    expect(audio).not.toBeNull();
  });

  it('sets preload attribute', () => {
    const { container } = renderAudioInContext(
      <Audio src="/test.mp3" />,
      { environment: 'player' },
    );
    const audio = container.querySelector('audio')!;
    expect(audio.getAttribute('preload')).toBe('auto');
  });
});
