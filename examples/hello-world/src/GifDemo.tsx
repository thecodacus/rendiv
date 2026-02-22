import React from 'react';
import { useFrame, useCompositionConfig, Fill, interpolate, spring } from '@rendiv/core';
import { Gif } from '@rendiv/gif';

const GIF_URL = 'https://media.giphy.com/media/xT9IgzoKnwFNmISR8I/giphy.gif';

export function GifDemo(): React.ReactElement {
	const frame = useFrame();
	const { fps, durationInFrames } = useCompositionConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});

	const titleSpring = spring({ frame, fps, config: { damping: 12, stiffness: 100 } });
	const titleY = interpolate(titleSpring, [0, 1], [40, 0]);
	const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

	const labelSpring = spring({ frame: frame - 10, fps, config: { damping: 14, stiffness: 120 } });
	const labelOpacity = interpolate(labelSpring, [0, 1], [0, 1]);

	return (
		<Fill style={{ background: '#0d1117', opacity: fadeIn * fadeOut }}>
			{/* Title */}
			<div
				style={{
					position: 'absolute',
					top: 60,
					left: 0,
					right: 0,
					textAlign: 'center',
					opacity: titleOpacity,
					transform: `translateY(${titleY}px)`,
				}}
			>
				<span
					style={{
						color: '#f8f8f2',
						fontSize: 48,
						fontFamily: 'system-ui, sans-serif',
						fontWeight: 700,
					}}
				>
					@rendiv/gif
				</span>
			</div>

			{/* GIF display area */}
			<div
				style={{
					position: 'absolute',
					top: 160,
					left: 0,
					right: 0,
					bottom: 120,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					gap: 60,
				}}
			>
				{/* Normal speed */}
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
					<div
						style={{
							borderRadius: 16,
							overflow: 'hidden',
							boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
							border: '2px solid #30363d',
						}}
					>
						<Gif src={GIF_URL} width={400} height={300} fit="cover" />
					</div>
					<span
						style={{
							color: '#8b949e',
							fontFamily: 'monospace',
							fontSize: 16,
							opacity: labelOpacity,
						}}
					>
						playbackRate=1
					</span>
				</div>

				{/* Slow motion */}
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
					<div
						style={{
							borderRadius: 16,
							overflow: 'hidden',
							boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
							border: '2px solid #30363d',
						}}
					>
						<Gif src={GIF_URL} width={400} height={300} fit="cover" playbackRate={0.5} />
					</div>
					<span
						style={{
							color: '#8b949e',
							fontFamily: 'monospace',
							fontSize: 16,
							opacity: labelOpacity,
						}}
					>
						playbackRate=0.5
					</span>
				</div>

				{/* Fast */}
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
					<div
						style={{
							borderRadius: 16,
							overflow: 'hidden',
							boxShadow: '0 4px 24px rgba(0,0,0,0.5)',
							border: '2px solid #30363d',
						}}
					>
						<Gif src={GIF_URL} width={400} height={300} fit="cover" playbackRate={2} />
					</div>
					<span
						style={{
							color: '#8b949e',
							fontFamily: 'monospace',
							fontSize: 16,
							opacity: labelOpacity,
						}}
					>
						playbackRate=2
					</span>
				</div>
			</div>

			{/* Bottom label */}
			<div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center' }}>
				<span style={{ color: '#58a6ff', fontFamily: 'monospace', fontSize: 18, opacity: labelOpacity }}>
					{'<Gif src="..." fit="cover" playbackRate={n} />'}
				</span>
			</div>
		</Fill>
	);
}
