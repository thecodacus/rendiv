import React from 'react';
import { useFrame, useCompositionConfig, Fill, interpolate, spring } from 'rendiv';

export const HelloWorld: React.FC = () => {
  const frame = useFrame();
  const { fps, durationInFrames } = useCompositionConfig();

  const opacity = interpolate(frame, [0, 30], [0, 1], {
    extrapolateRight: 'clamp',
  });

  const scale = spring({
    frame,
    fps,
    config: { damping: 12, stiffness: 100, mass: 0.8 },
  });

  const subtitleOpacity = interpolate(frame, [30, 50], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const bgProgress = interpolate(frame, [0, durationInFrames], [0, 360], {
    extrapolateRight: 'clamp',
  });

  return (
    <Fill
      style={{
        background: `linear-gradient(${bgProgress}deg, #0b1215, #1a2940, #0b1215)`,
        justifyContent: 'center',
        alignItems: 'center',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <h1
          style={{
            color: '#ffffff',
            fontSize: 80,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 700,
            opacity,
            transform: `scale(${scale})`,
            margin: 0,
          }}
        >
          Hello from Rendiv!
        </h1>
        <p
          style={{
            color: '#8899aa',
            fontSize: 28,
            fontFamily: 'system-ui, -apple-system, sans-serif',
            fontWeight: 300,
            opacity: subtitleOpacity,
            marginTop: 16,
          }}
        >
          Create videos with React
        </p>
      </div>
    </Fill>
  );
};
