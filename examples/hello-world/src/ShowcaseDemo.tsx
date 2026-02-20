import React from 'react';
import {
  useFrame,
  useCompositionConfig,
  Fill,
  Series,
  Sequence,
  interpolate,
  spring,
} from 'rendiv';
import { HelloWorld } from './HelloWorld';
import { SeriesDemo } from './SeriesDemo';

/** Intro card before each composition */
function CompositionCard({ title, subtitle }: { title: string; subtitle: string }): React.ReactElement {
  const frame = useFrame();
  const { fps, durationInFrames } = useCompositionConfig();

  const scale = spring({ frame, fps, config: { damping: 12, stiffness: 100, mass: 0.6 } });
  const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const lineWidth = interpolate(frame, [10, 30], [0, 120], { extrapolateRight: 'clamp' });

  return (
    <Fill
      style={{
        background: 'linear-gradient(135deg, #0d1117, #161b22)',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeIn * fadeOut,
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <p
          style={{
            color: '#58a6ff',
            fontSize: 20,
            fontFamily: 'monospace',
            fontWeight: 500,
            margin: 0,
            marginBottom: 12,
            opacity: fadeIn,
          }}
        >
          {subtitle}
        </p>
        <h1
          style={{
            color: '#ffffff',
            fontSize: 64,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 700,
            margin: 0,
            transform: `scale(${scale})`,
          }}
        >
          {title}
        </h1>
        <div
          style={{
            width: lineWidth,
            height: 3,
            backgroundColor: '#58a6ff',
            margin: '20px auto 0',
            borderRadius: 2,
          }}
        />
      </div>
    </Fill>
  );
}

/**
 * Showcase composition: plays both HelloWorld and SeriesDemo back-to-back
 * with intro cards between them.
 *
 * Structure:
 *   Intro (45 frames) → HelloWorld (90 frames) → Transition (45 frames) → SeriesDemo (270 frames) → Outro (45 frames)
 *   Total: 495 frames = 16.5s at 30fps
 */
export function ShowcaseDemo(): React.ReactElement {
  return (
    <Series>
      <Series.Sequence durationInFrames={45}>
        <CompositionCard title="Rendiv Showcase" subtitle="Compositions in action" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={90}>
        <HelloWorld />
      </Series.Sequence>

      <Series.Sequence durationInFrames={45}>
        <CompositionCard title="Series Demo" subtitle="Up next" />
      </Series.Sequence>

      <Series.Sequence durationInFrames={270}>
        <SeriesDemo />
      </Series.Sequence>

      <Series.Sequence durationInFrames={45}>
        <OutroCard />
      </Series.Sequence>
    </Series>
  );
}

function OutroCard(): React.ReactElement {
  const frame = useFrame();
  const { fps, durationInFrames } = useCompositionConfig();

  const scale = spring({ frame, fps, config: { damping: 14, stiffness: 80, mass: 0.5 } });
  const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  return (
    <Fill
      style={{
        background: '#0d1117',
        justifyContent: 'center',
        alignItems: 'center',
        opacity: fadeOut,
      }}
    >
      <h1
        style={{
          color: '#58a6ff',
          fontSize: 48,
          fontFamily: 'system-ui, -apple-system, sans-serif',
          fontWeight: 600,
          transform: `scale(${scale})`,
          margin: 0,
        }}
      >
        Built with Rendiv
      </h1>
    </Fill>
  );
}
