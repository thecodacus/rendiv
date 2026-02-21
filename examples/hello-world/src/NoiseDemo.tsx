import React from 'react';
import { useFrame, useCompositionConfig, Fill, interpolate } from '@rendiv/core';
import { noise2D, noise3D, seed } from '@rendiv/noise';

const COLS = 32;
const ROWS = 18;
const CELL_W = 1920 / COLS;
const CELL_H = 1080 / ROWS;

/**
 * Animated noise field — each cell's colour and opacity is driven
 * by 2D/3D simplex noise that evolves over time (frame / fps).
 */
export function NoiseDemo(): React.ReactElement {
	const frame = useFrame();
	const { fps, durationInFrames } = useCompositionConfig();

	seed(42);

	const t = frame / fps;
	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const cells: React.ReactElement[] = [];

	for (let row = 0; row < ROWS; row++) {
		for (let col = 0; col < COLS; col++) {
			const nx = col / COLS;
			const ny = row / ROWS;

			// 3D noise: x, y for spatial, t for animation
			const n = noise3D(nx * 4, ny * 4, t * 0.8);

			// Map [-1, 1] → hue [200, 320] (blue → purple → pink)
			const hue = 200 + ((n + 1) / 2) * 120;
			// Map noise to lightness
			const lightness = 30 + ((n + 1) / 2) * 40;
			// Secondary noise for subtle opacity variation
			const opacityNoise = noise2D(nx * 6 + t * 0.5, ny * 6);
			const opacity = 0.5 + ((opacityNoise + 1) / 2) * 0.5;

			cells.push(
				<div
					key={`${row}-${col}`}
					style={{
						position: 'absolute',
						left: col * CELL_W,
						top: row * CELL_H,
						width: CELL_W,
						height: CELL_H,
						backgroundColor: `hsl(${hue}, 70%, ${lightness}%)`,
						opacity,
					}}
				/>,
			);
		}
	}

	return (
		<Fill style={{ background: '#0d1117', opacity: fadeIn * fadeOut }}>
			{cells}
			<div
				style={{
					position: 'absolute',
					bottom: 60,
					left: 0,
					right: 0,
					textAlign: 'center',
				}}
			>
				<span
					style={{
						color: '#ffffff',
						fontSize: 36,
						fontFamily: 'system-ui, sans-serif',
						fontWeight: 600,
						textShadow: '0 2px 12px rgba(0,0,0,0.8)',
					}}
				>
					@rendiv/noise — simplex noise field
				</span>
			</div>
		</Fill>
	);
}
