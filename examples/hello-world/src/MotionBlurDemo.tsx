import React from 'react';
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate } from '@rendiv/core';
import { MotionTrail, ShutterBlur } from '@rendiv/motion-blur';

function MovingCircle({ color }: { color: string }): React.ReactElement {
	const frame = useFrame();
	const x = interpolate(frame, [0, 120], [100, 1820], { extrapolateRight: 'clamp' });
	const y = 540 + Math.sin(frame * 0.08) * 150;

	return (
		<div
			style={{
				position: 'absolute',
				left: x - 40,
				top: y - 40,
				width: 80,
				height: 80,
				borderRadius: '50%',
				backgroundColor: color,
			}}
		/>
	);
}

function SpinningStar(): React.ReactElement {
	const frame = useFrame();
	const rotation = frame * 6;
	const scale = 1 + Math.sin(frame * 0.1) * 0.3;

	return (
		<div style={{ position: 'absolute', inset: 0, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
			<svg
				width={200}
				height={200}
				viewBox="0 0 200 200"
				style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
			>
				<polygon
					points="100,10 120,80 195,80 135,125 155,195 100,155 45,195 65,125 5,80 80,80"
					fill="none"
					stroke="#f78166"
					strokeWidth={3}
					strokeLinejoin="round"
				/>
			</svg>
		</div>
	);
}

export function MotionBlurDemo(): React.ReactElement {
	const frame = useFrame();
	const { durationInFrames } = useCompositionConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	return (
		<CanvasElement id="MotionBlurDemo">
		<Fill style={{ background: '#0d1117', opacity: fadeIn * fadeOut }}>
			{/* Left half: MotionTrail */}
			<div style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden' }}>
				<MotionTrail layers={6} offset={2} fadeRate={0.5}>
					<MovingCircle color="#58a6ff" />
				</MotionTrail>
				<div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center' }}>
					<span style={{ color: '#8b949e', fontFamily: 'monospace', fontSize: 18 }}>
						{'<MotionTrail>'}
					</span>
				</div>
			</div>

			{/* Divider */}
			<div style={{ position: 'absolute', left: '50%', top: '10%', bottom: '10%', width: 1, backgroundColor: '#30363d' }} />

			{/* Right half: ShutterBlur */}
			<div style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%', overflow: 'hidden' }}>
				<ShutterBlur angle={220} layers={12}>
					<SpinningStar />
				</ShutterBlur>
				<div style={{ position: 'absolute', bottom: 80, left: 0, right: 0, textAlign: 'center' }}>
					<span style={{ color: '#8b949e', fontFamily: 'monospace', fontSize: 18 }}>
						{'<ShutterBlur>'}
					</span>
				</div>
			</div>

			{/* Title */}
			<div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center' }}>
				<span style={{ color: '#fff', fontSize: 28, fontFamily: 'system-ui, sans-serif', fontWeight: 600 }}>
					@rendiv/motion-blur
				</span>
			</div>
		</Fill>
		</CanvasElement>
	);
}
