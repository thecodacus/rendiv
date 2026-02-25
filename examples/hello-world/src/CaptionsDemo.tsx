import React from 'react';
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate, spring } from '@rendiv/core';
import {
	CaptionRenderer,
	parseSrt,
	createHighlightedCaptions,
	type Caption,
} from '@rendiv/captions';

// Sample SRT string — 5 seconds of captions at 30fps = 150 frames
const SRT_DATA = `1
00:00:00,500 --> 00:00:02,000
Rendiv makes video creation

2
00:00:02,200 --> 00:00:03,800
as simple as writing React

3
00:00:04,000 --> 00:00:05,000
Let's see how!`;

// Word-level timed captions for the highlighted demo
const WORD_CAPTIONS: Caption[] = [
	{
		text: 'Build stunning videos with code',
		startMs: 500,
		endMs: 2500,
		words: [
			{ text: 'Build', startMs: 500, endMs: 900 },
			{ text: 'stunning', startMs: 900, endMs: 1400 },
			{ text: 'videos', startMs: 1400, endMs: 1800 },
			{ text: 'with', startMs: 1800, endMs: 2100 },
			{ text: 'code', startMs: 2100, endMs: 2500 },
		],
	},
	{
		text: 'Frame perfect every time',
		startMs: 2700,
		endMs: 4500,
		words: [
			{ text: 'Frame', startMs: 2700, endMs: 3100 },
			{ text: 'perfect', startMs: 3100, endMs: 3600 },
			{ text: 'every', startMs: 3600, endMs: 4000 },
			{ text: 'time', startMs: 4000, endMs: 4500 },
		],
	},
];

const srtCaptions = parseSrt(SRT_DATA);
const highlightedCaptions = createHighlightedCaptions(WORD_CAPTIONS, { maxWordsPerChunk: 5 });

export function CaptionsDemo(): React.ReactElement {
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

	const labelSpring = spring({ frame: frame - 8, fps, config: { damping: 14, stiffness: 120 } });
	const labelOpacity = interpolate(labelSpring, [0, 1], [0, 1]);

	return (
		<CanvasElement id="CaptionsDemo">
		<Fill style={{ background: '#0d1117', opacity: fadeIn * fadeOut }}>
			{/* Title */}
			<div
				style={{
					position: 'absolute',
					top: 50,
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
					@rendiv/captions
				</span>
			</div>

			{/* Left panel: Plain SRT Captions */}
			<div
				style={{
					position: 'absolute',
					left: 0,
					top: 140,
					width: '50%',
					bottom: 0,
					overflow: 'hidden',
				}}
			>
				{/* Label */}
				<div style={{ textAlign: 'center', marginBottom: 8, opacity: labelOpacity }}>
					<span
						style={{
							color: '#58a6ff',
							fontFamily: 'monospace',
							fontSize: 16,
						}}
					>
						parseSrt + CaptionRenderer
					</span>
				</div>

				{/* Mock video area */}
				<div
					style={{
						margin: '0 40px',
						height: 500,
						borderRadius: 16,
						background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
						border: '2px solid #30363d',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					{/* Decorative content */}
					<div
						style={{
							position: 'absolute',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 12,
							opacity: 0.3,
						}}
					>
						<svg width={80} height={80} viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z" fill="#58a6ff" />
						</svg>
						<span style={{ color: '#8b949e', fontFamily: 'monospace', fontSize: 14 }}>
							video content
						</span>
					</div>

					{/* Caption overlay */}
					<CaptionRenderer
						captions={srtCaptions}
						align="bottom"
						padding={30}
						activeStyle={{
							fontSize: 28,
							color: '#ffffff',
							fontFamily: 'system-ui, sans-serif',
							fontWeight: 600,
							textShadow: '0 2px 8px rgba(0,0,0,0.8)',
						}}
					/>
				</div>
			</div>

			{/* Divider */}
			<div
				style={{
					position: 'absolute',
					left: '50%',
					top: 160,
					bottom: 60,
					width: 1,
					backgroundColor: '#30363d',
				}}
			/>

			{/* Right panel: Highlighted Word Captions */}
			<div
				style={{
					position: 'absolute',
					right: 0,
					top: 140,
					width: '50%',
					bottom: 0,
					overflow: 'hidden',
				}}
			>
				{/* Label */}
				<div style={{ textAlign: 'center', marginBottom: 8, opacity: labelOpacity }}>
					<span
						style={{
							color: '#ff79c6',
							fontFamily: 'monospace',
							fontSize: 16,
						}}
					>
						createHighlightedCaptions
					</span>
				</div>

				{/* Mock video area */}
				<div
					style={{
						margin: '0 40px',
						height: 500,
						borderRadius: 16,
						background: 'linear-gradient(135deg, #1a1a2e, #16213e)',
						border: '2px solid #30363d',
						position: 'relative',
						overflow: 'hidden',
					}}
				>
					{/* Decorative content */}
					<div
						style={{
							position: 'absolute',
							top: '50%',
							left: '50%',
							transform: 'translate(-50%, -50%)',
							display: 'flex',
							flexDirection: 'column',
							alignItems: 'center',
							gap: 12,
							opacity: 0.3,
						}}
					>
						<svg width={80} height={80} viewBox="0 0 24 24">
							<path d="M8 5v14l11-7z" fill="#ff79c6" />
						</svg>
						<span style={{ color: '#8b949e', fontFamily: 'monospace', fontSize: 14 }}>
							video content
						</span>
					</div>

					{/* Highlighted caption overlay */}
					<CaptionRenderer
						captions={highlightedCaptions}
						align="bottom"
						padding={30}
						activeStyle={{
							fontSize: 28,
							color: 'rgba(255,255,255,0.6)',
							fontFamily: 'system-ui, sans-serif',
							fontWeight: 600,
							textShadow: '0 2px 8px rgba(0,0,0,0.8)',
						}}
						highlightedWordStyle={{
							color: '#ff79c6',
							fontWeight: 800,
						}}
					/>
				</div>
			</div>

			{/* Bottom label */}
			<div style={{ position: 'absolute', bottom: 30, left: 0, right: 0, textAlign: 'center' }}>
				<span
					style={{
						color: '#8b949e',
						fontFamily: 'monospace',
						fontSize: 15,
						opacity: labelOpacity,
					}}
				>
					SRT parsing &bull; Whisper transcripts &bull; Word-by-word highlighting
				</span>
			</div>
		</Fill>
		</CanvasElement>
	);
}
