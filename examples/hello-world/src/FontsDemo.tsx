import React from 'react';
import { useFrame, interpolate, Fill, spring, useCompositionConfig } from '@rendiv/core';
import { useFont } from '@rendiv/google-fonts';

const FONTS = [
  { family: 'Playfair Display', weight: '700', label: 'Serif', color: '#ff79c6' },
  { family: 'Inter', weight: '400', label: 'Sans-Serif', color: '#8be9fd' },
  { family: 'Fira Code', weight: '500', label: 'Monospace', color: '#50fa7b' },
  { family: 'Pacifico', weight: '400', label: 'Script', color: '#ffb86c' },
  { family: 'Bebas Neue', weight: '400', label: 'Display', color: '#bd93f9' },
  { family: 'Merriweather', weight: '700', label: 'Literary', color: '#f1fa8c' },
] as const;

const SAMPLE = 'The quick brown fox jumps over the lazy dog';

function FontRow({
  fontFamily,
  label,
  familyName,
  color,
  delay,
}: {
  fontFamily: string;
  label: string;
  familyName: string;
  color: string;
  delay: number;
}) {
  const frame = useFrame();
  const { fps } = useCompositionConfig();

  const slideIn = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
  const x = interpolate(slideIn, [0, 1], [120, 0]);
  const opacity = interpolate(slideIn, [0, 1], [0, 1]);

  return (
    <div
      style={{
        opacity,
        transform: `translateX(${x}px)`,
        display: 'flex',
        alignItems: 'baseline',
        gap: 24,
        marginBottom: 12,
      }}
    >
      <span
        style={{
          fontFamily: '"Inter", sans-serif',
          fontSize: 14,
          color,
          textTransform: 'uppercase',
          letterSpacing: 2,
          width: 110,
          flexShrink: 0,
          textAlign: 'right',
        }}
      >
        {label}
      </span>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <span
          style={{
            fontFamily,
            fontSize: 36,
            color: '#f8f8f2',
            whiteSpace: 'nowrap',
          }}
        >
          {SAMPLE}
        </span>
        <span
          style={{
            fontFamily: '"Inter", sans-serif',
            fontSize: 13,
            color: 'rgba(255,255,255,0.35)',
          }}
        >
          {familyName}
        </span>
      </div>
    </div>
  );
}

export const FontsDemo: React.FC = () => {
  const frame = useFrame();
  const { fps, durationInFrames } = useCompositionConfig();

  const playfair = useFont({ family: 'Playfair Display', weight: '700' });
  const inter = useFont({ family: 'Inter', weight: '400' });
  const firaCode = useFont({ family: 'Fira Code', weight: '500' });
  const pacifico = useFont({ family: 'Pacifico', weight: '400' });
  const bebas = useFont({ family: 'Bebas Neue', weight: '400' });
  const merriweather = useFont({ family: 'Merriweather', weight: '700' });

  const fontFamilies = [playfair, inter, firaCode, pacifico, bebas, merriweather];

  const titleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
  const titleY = interpolate(titleSpring, [0, 1], [50, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const gradientAngle = interpolate(frame, [0, durationInFrames], [135, 235], { extrapolateRight: 'clamp' });

  return (
    <Fill>
      <div
        style={{
          width: '100%',
          height: '100%',
          background: `linear-gradient(${gradientAngle}deg, #0f0c29, #302b63, #24243e)`,
          display: 'flex',
          flexDirection: 'column',
          padding: '60px 80px',
          overflow: 'hidden',
        }}
      >
        <h1
          style={{
            fontFamily: playfair,
            fontSize: 56,
            color: '#f8f8f2',
            opacity: titleOpacity,
            transform: `translateY(${titleY}px)`,
            margin: 0,
            marginBottom: 48,
            letterSpacing: -1,
          }}
        >
          Font Showcase
        </h1>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {FONTS.map((font, i) => (
            <FontRow
              key={font.family}
              fontFamily={fontFamilies[i]}
              label={font.label}
              familyName={font.family}
              color={font.color}
              delay={8 + i * 6}
            />
          ))}
        </div>
      </div>
    </Fill>
  );
};
