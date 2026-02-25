import React from 'react';
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate, spring } from '@rendiv/core';
import {
  TransitionSeries,
  linearTiming,
  springTiming,
  fade,
  slide,
  wipe,
  flip,
  clockWipe,
} from '@rendiv/transitions';

function SceneCard({
  title,
  subtitle,
  bg,
  color,
}: {
  title: string;
  subtitle: string;
  bg: string;
  color: string;
}): React.ReactElement {
  const frame = useFrame();
  const { fps } = useCompositionConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 0.5 } });
  const opacity = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });

  return (
    <Fill
      style={{
        background: bg,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <h1
        style={{
          color,
          fontSize: 64,
          fontFamily: 'system-ui, sans-serif',
          fontWeight: 700,
          transform: `scale(${scale})`,
          opacity,
          margin: 0,
        }}
      >
        {title}
      </h1>
      <p
        style={{
          color,
          fontSize: 28,
          fontFamily: 'system-ui, sans-serif',
          opacity: 0.6,
          margin: 0,
        }}
      >
        {subtitle}
      </p>
    </Fill>
  );
}

/**
 * Demonstrates TransitionSeries with 6 scenes and 5 transitions.
 * Total: 6x60 - (4x15 + 1x20) = 280 frames
 */
export function TransitionsDemo(): React.ReactElement {
  return (
    <CanvasElement id="TransitionsDemo">
    <TransitionSeries>
      <TransitionSeries.Sequence durationInFrames={60}>
        <SceneCard title="Fade" subtitle="linearTiming + fade()" bg="#1a1a2e" color="#ffffff" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 15 })}
        presentation={fade()}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <SceneCard title="Slide" subtitle="linearTiming + slide()" bg="#16213e" color="#58a6ff" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 15 })}
        presentation={slide({ direction: 'from-right' })}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <SceneCard title="Wipe" subtitle="linearTiming + wipe()" bg="#0f3460" color="#e94560" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 15 })}
        presentation={wipe({ direction: 'from-left' })}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <SceneCard title="Flip" subtitle="linearTiming + flip()" bg="#533483" color="#ffffff" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 15 })}
        presentation={flip({ direction: 'horizontal' })}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <SceneCard title="Clock Wipe" subtitle="clockWipe()" bg="#e94560" color="#ffffff" />
      </TransitionSeries.Sequence>

      <TransitionSeries.Transition
        timing={linearTiming({ durationInFrames: 20 })}
        presentation={clockWipe()}
      />

      <TransitionSeries.Sequence durationInFrames={60}>
        <SceneCard title="Fin" subtitle="That's all the transitions!" bg="#0d1117" color="#58a6ff" />
      </TransitionSeries.Sequence>
    </TransitionSeries>
    </CanvasElement>
  );
}
