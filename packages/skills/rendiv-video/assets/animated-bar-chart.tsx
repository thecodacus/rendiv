import React from 'react';
import { useFrame, useCompositionConfig, interpolate, spring } from '@rendiv/core';

const DATA = [
  { label: 'React', value: 85, color: '#61dafb' },
  { label: 'Vue', value: 62, color: '#42b883' },
  { label: 'Svelte', value: 48, color: '#ff3e00' },
  { label: 'Angular', value: 55, color: '#dd0031' },
  { label: 'Solid', value: 35, color: '#4f88c6' },
];

const BAR_HEIGHT = 48;
const GAP = 16;
const CHART_LEFT = 120;
const CHART_RIGHT = 160;

export const AnimatedBarChart: React.FC = () => {
  const frame = useFrame();
  const { fps, width, height } = useCompositionConfig();

  const maxValue = Math.max(...DATA.map((d) => d.value));
  const chartWidth = width - CHART_LEFT - CHART_RIGHT;
  const totalHeight = DATA.length * (BAR_HEIGHT + GAP) - GAP;
  const topOffset = (height - totalHeight) / 2;

  return (
    <div
      style={{
        width,
        height,
        backgroundColor: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: topOffset - 80,
          left: CHART_LEFT,
          color: '#e2e8f0',
          fontSize: 36,
          fontWeight: 700,
          opacity: interpolate(frame, [0, 15], [0, 1], {
            extrapolateRight: 'clamp',
          }),
        }}
      >
        Framework Popularity
      </div>

      {/* Bars */}
      {DATA.map((item, i) => {
        const staggerDelay = i * 4;
        const barProgress = spring({
          frame: frame - staggerDelay,
          fps,
          config: { damping: 14, stiffness: 120, mass: 0.8 },
        });
        const barWidth = (item.value / maxValue) * chartWidth * barProgress;

        const labelOpacity = interpolate(frame - staggerDelay, [0, 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        const valueOpacity = interpolate(frame - staggerDelay - 8, [0, 10], [0, 1], {
          extrapolateLeft: 'clamp',
          extrapolateRight: 'clamp',
        });

        return (
          <div
            key={item.label}
            style={{
              position: 'absolute',
              top: topOffset + i * (BAR_HEIGHT + GAP),
              left: 0,
              width: '100%',
              height: BAR_HEIGHT,
              display: 'flex',
              alignItems: 'center',
            }}
          >
            {/* Label */}
            <div
              style={{
                width: CHART_LEFT - 16,
                textAlign: 'right',
                color: '#94a3b8',
                fontSize: 20,
                fontWeight: 500,
                opacity: labelOpacity,
              }}
            >
              {item.label}
            </div>

            {/* Bar */}
            <div
              style={{
                marginLeft: 16,
                width: barWidth,
                height: BAR_HEIGHT,
                backgroundColor: item.color,
                borderRadius: 6,
              }}
            />

            {/* Value */}
            <div
              style={{
                marginLeft: 12,
                color: '#e2e8f0',
                fontSize: 22,
                fontWeight: 600,
                opacity: valueOpacity,
              }}
            >
              {Math.round(item.value * barProgress)}
            </div>
          </div>
        );
      })}
    </div>
  );
};
