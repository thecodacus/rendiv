import React from 'react';
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate, spring } from '@rendiv/core';
import { shapeStar, shapeCircle, shapePie, shapePolygon } from '@rendiv/shapes';
import { strokeReveal, morphPath } from '@rendiv/paths';

/**
 * Demonstrates @rendiv/shapes + @rendiv/paths:
 * 1. Star with animated stroke-reveal draw-on effect
 * 2. Shape morphing from hexagon to star
 * 3. Animated pie chart
 */
export function ShapesDemo(): React.ReactElement {
	const frame = useFrame();
	const { fps, durationInFrames } = useCompositionConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	// --- Star stroke reveal ---
	const starShape = shapeStar({ innerRadius: 50, outerRadius: 120, points: 5 });
	const revealProgress = interpolate(frame, [10, 80], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	const reveal = strokeReveal(revealProgress, starShape.d);

	// Star fill fades in after stroke completes
	const starFillOpacity = interpolate(frame, [75, 100], [0, 0.3], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

	// --- Shape morph: hexagon → star ---
	const hexagon = shapePolygon({ radius: 100, sides: 6 });
	const morphStar = shapeStar({ innerRadius: 50, outerRadius: 100, points: 6 });
	// Both have 6-pointed structures: hexagon has 6 line segments + close,
	// star has 12 vertices + close. We need matching segment counts.
	// Use two polygons instead for clean morphing.
	const morphFrom = shapePolygon({ radius: 100, sides: 12 });
	const morphTo = shapeStar({ innerRadius: 50, outerRadius: 100, points: 6 });
	const morphProgress = interpolate(frame, [30, 90], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

	let morphedPath: string;
	try {
		morphedPath = morphPath(morphProgress, morphFrom.d, morphTo.d);
	} catch {
		// Fallback if segment counts don't match — show target
		morphedPath = morphProgress < 0.5 ? morphFrom.d : morphTo.d;
	}

	// --- Animated pie chart ---
	const pieAngle = interpolate(frame, [20, 100], [0, 360], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	const pie = shapePie({ radius: 100, startAngle: 0, endAngle: Math.max(pieAngle, 0.1) });

	// Rotation for morph shape
	const rotation = spring({ frame: Math.max(0, frame - 30), fps, config: { damping: 20, stiffness: 60, mass: 0.8 } });

	return (
		<CanvasElement id="ShapesDemo">
		<Fill style={{ background: '#0d1117', opacity: fadeIn * fadeOut }}>
			{/* Row of three demos */}
			<div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%', padding: '0 80px' }}>
				{/* 1: Star stroke reveal */}
				<div style={{ textAlign: 'center' }}>
					<svg width={240} height={240} viewBox={starShape.viewBox}>
						<path
							d={starShape.d}
							fill={`rgba(88, 166, 255, ${starFillOpacity})`}
							stroke="#58a6ff"
							strokeWidth={3}
							style={{
								strokeDasharray: reveal.strokeDasharray,
								strokeDashoffset: reveal.strokeDashoffset,
							}}
						/>
					</svg>
					<p style={{ color: '#8b949e', fontFamily: 'monospace', fontSize: 14, marginTop: 12 }}>
						strokeReveal
					</p>
				</div>

				{/* 2: Shape morphing */}
				<div style={{ textAlign: 'center' }}>
					<svg width={240} height={240} viewBox={morphFrom.viewBox}>
						<path
							d={morphedPath}
							fill="none"
							stroke="#f78166"
							strokeWidth={3}
							strokeLinejoin="round"
							transform={`rotate(${rotation * 30}, ${morphFrom.width / 2}, ${morphFrom.height / 2})`}
						/>
					</svg>
					<p style={{ color: '#8b949e', fontFamily: 'monospace', fontSize: 14, marginTop: 12 }}>
						morphPath
					</p>
				</div>

				{/* 3: Animated pie */}
				<div style={{ textAlign: 'center' }}>
					<svg width={240} height={240} viewBox={pie.viewBox}>
						<path
							d={pie.d}
							fill="#3fb950"
							fillOpacity={0.6}
							stroke="#3fb950"
							strokeWidth={2}
						/>
						{/* Tick marks around the circle */}
						<circle
							cx={pie.width / 2}
							cy={pie.height / 2}
							r={100}
							fill="none"
							stroke="#30363d"
							strokeWidth={1}
						/>
					</svg>
					<p style={{ color: '#8b949e', fontFamily: 'monospace', fontSize: 14, marginTop: 12 }}>
						shapePie
					</p>
				</div>
			</div>

			{/* Title */}
			<div style={{ position: 'absolute', bottom: 50, left: 0, right: 0, textAlign: 'center' }}>
				<span style={{
					color: '#ffffff',
					fontSize: 32,
					fontFamily: 'system-ui, sans-serif',
					fontWeight: 600,
					textShadow: '0 2px 8px rgba(0,0,0,0.6)',
				}}>
					@rendiv/shapes + @rendiv/paths
				</span>
			</div>
		</Fill>
		</CanvasElement>
	);
}
