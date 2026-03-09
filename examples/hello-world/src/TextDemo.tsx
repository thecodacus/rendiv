import React from 'react';
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate } from '@rendiv/core';
import { AnimatedText, slideUp, bounce, typewriter, scramble, blurIn, rotateIn } from '@rendiv/text';

export function TextDemo(): React.ReactElement {
	const frame = useFrame();
	const { durationInFrames } = useCompositionConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: 'clamp',
		extrapolateRight: 'clamp',
	});
	const opacity = fadeIn * fadeOut;

	return (
		<CanvasElement id="TextDemo">
			<Fill
				style={{
					background: 'linear-gradient(135deg, #0d1117, #161b22)',
					opacity,
					display: 'flex',
					flexDirection: 'column',
					gap: 50,
					justifyContent: 'center',
					padding: '0 120px',
				}}
			>
				<AnimatedText
					text="Slide Up By Word"
					splitBy="word"
					animation={slideUp({ distance: 30, durationInFrames: 20 })}
					stagger={5}
					style={{ fontSize: 52, color: '#58a6ff', fontFamily: 'system-ui', fontWeight: 700 }}
				/>

				<AnimatedText
					text="Bouncy Characters!"
					splitBy="character"
					animation={bounce({ fps: 30 })}
					stagger={2}
					style={{ fontSize: 48, color: '#f78166', fontFamily: 'system-ui', fontWeight: 600 }}
				/>

				<AnimatedText
					text="Typewriter effect..."
					splitBy="character"
					animation={typewriter()}
					stagger={3}
					style={{ fontSize: 40, color: '#3fb950', fontFamily: 'monospace' }}
				/>

				<AnimatedText
					text="SCRAMBLE DECODE"
					splitBy="character"
					animation={scramble({ durationInFrames: 20 })}
					stagger={2}
					style={{ fontSize: 44, color: '#d2a8ff', fontFamily: 'monospace', letterSpacing: 4 }}
				/>

				<AnimatedText
					text="Blur Reveal"
					splitBy="word"
					animation={blurIn({ from: 12, durationInFrames: 25 })}
					stagger={8}
					style={{ fontSize: 48, color: '#79c0ff', fontFamily: 'system-ui', fontWeight: 600 }}
				/>

				<AnimatedText
					text="Rotate In"
					splitBy="character"
					animation={rotateIn({ degrees: 45, durationInFrames: 18 })}
					stagger={3}
					style={{ fontSize: 48, color: '#ffa657', fontFamily: 'system-ui', fontWeight: 700 }}
				/>
			</Fill>
		</CanvasElement>
	);
}
