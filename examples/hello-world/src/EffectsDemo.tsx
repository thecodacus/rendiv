import React from 'react';
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate } from '@rendiv/core';
import { Effect, blur, brightness, glowEffect, VignetteEffect, GlitchEffect, ChromaEffect } from '@rendiv/effects';

export function EffectsDemo(): React.ReactElement {
	const frame = useFrame();
	const { durationInFrames } = useCompositionConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const opacity = fadeIn * fadeOut;

	const boxStyle: React.CSSProperties = {
		width: 260,
		height: 180,
		background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
		borderRadius: 12,
		display: 'flex',
		alignItems: 'center',
		justifyContent: 'center',
		flexDirection: 'column',
		gap: 8,
	};

	const labelStyle: React.CSSProperties = {
		fontSize: 14,
		color: '#8b949e',
		fontFamily: 'system-ui',
		marginTop: 12,
	};

	return (
		<CanvasElement id="EffectsDemo">
			<Fill
				style={{
					background: '#0d1117',
					opacity,
					display: 'flex',
					flexDirection: 'column',
					alignItems: 'center',
					justifyContent: 'center',
					gap: 40,
				}}
			>
				<div style={{ fontSize: 36, color: '#ffffff', fontFamily: 'system-ui', fontWeight: 700 }}>
					Visual Effects
				</div>

				<div style={{ display: 'flex', gap: 30 }}>
					{/* Animated Deblur */}
					<div style={{ textAlign: 'center' }}>
						<Effect
							filters={[
								blur((f) => interpolate(f, [0, 60], [10, 0], { extrapolateRight: 'clamp' })),
							]}
						>
							<div style={boxStyle}>
								<span style={{ fontSize: 32, color: '#58a6ff' }}>Deblur</span>
							</div>
						</Effect>
						<div style={labelStyle}>Animated Blur</div>
					</div>

					{/* Glow */}
					<div style={{ textAlign: 'center' }}>
						<Effect filters={glowEffect({ color: '#f78166', intensity: 1.3, blur: 12 })}>
							<div style={boxStyle}>
								<span style={{ fontSize: 32, color: '#f78166' }}>Glow</span>
							</div>
						</Effect>
						<div style={labelStyle}>Glow Effect</div>
					</div>

					{/* Brightness pulse */}
					<div style={{ textAlign: 'center' }}>
						<Effect
							filters={[
								brightness((f) => 1 + 0.3 * Math.sin(f * 0.15)),
							]}
						>
							<div style={boxStyle}>
								<span style={{ fontSize: 32, color: '#3fb950' }}>Pulse</span>
							</div>
						</Effect>
						<div style={labelStyle}>Brightness Pulse</div>
					</div>
				</div>

				<div style={{ display: 'flex', gap: 30 }}>
					{/* Vignette */}
					<div style={{ textAlign: 'center' }}>
						<VignetteEffect intensity={0.7}>
							<div style={boxStyle}>
								<span style={{ fontSize: 32, color: '#d2a8ff' }}>Vignette</span>
							</div>
						</VignetteEffect>
						<div style={labelStyle}>Vignette Effect</div>
					</div>

					{/* Glitch */}
					<div style={{ textAlign: 'center' }}>
						<GlitchEffect intensity={0.6}>
							<div style={boxStyle}>
								<span style={{ fontSize: 32, color: '#ffa657' }}>Glitch</span>
							</div>
						</GlitchEffect>
						<div style={labelStyle}>Glitch Effect</div>
					</div>

					{/* Chroma */}
					<div style={{ textAlign: 'center' }}>
						<ChromaEffect shift={4}>
							<div style={boxStyle}>
								<span style={{ fontSize: 32, color: '#79c0ff' }}>Chroma</span>
							</div>
						</ChromaEffect>
						<div style={labelStyle}>Chromatic Aberration</div>
					</div>
				</div>
			</Fill>
		</CanvasElement>
	);
}
