import React, { useMemo } from "react";
import { useFrame, useCompositionConfig, Fill, CanvasElement, interpolate } from "@rendiv/core";
import { Lottie } from "@rendiv/lottie";

// Inline a simple Lottie animation (a pulsing circle)
// In a real project, you'd import from a .json file: import animData from './my-anim.json';
function createPulseAnimation() {
	return {
		v: "5.7.0",
		fr: 30,
		ip: 0,
		op: 60,
		w: 400,
		h: 400,
		nm: "Pulse",
		layers: [
			{
				ty: 4,
				nm: "Circle",
				sr: 1,
				ks: {
					o: { a: 0, k: 100 },
					r: { a: 0, k: 0 },
					p: { a: 0, k: [200, 200, 0] },
					a: { a: 0, k: [0, 0, 0] },
					s: {
						a: 1,
						k: [
							{
								i: { x: [0.667], y: [1] },
								o: { x: [0.333], y: [0] },
								t: 0,
								s: [80, 80, 100],
							},
							{
								i: { x: [0.667], y: [1] },
								o: { x: [0.333], y: [0] },
								t: 30,
								s: [120, 120, 100],
							},
							{ t: 60, s: [80, 80, 100] },
						],
					},
				},
				shapes: [
					{
						ty: "el",
						d: 1,
						s: { a: 0, k: [100, 100] },
						p: { a: 0, k: [0, 0] },
						nm: "Ellipse",
					},
					{
						ty: "fl",
						c: { a: 0, k: [0.38, 0.83, 1, 1] },
						o: { a: 0, k: 100 },
						r: 1,
						nm: "Fill",
					},
				],
				ip: 0,
				op: 60,
				st: 0,
			},
		],
	};
}

export function LottieDemo(): React.ReactElement {
	const frame = useFrame();
	const { durationInFrames } = useCompositionConfig();
	const animationData = useMemo(() => createPulseAnimation(), []);

	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: "clamp",
	});

	return (
		<CanvasElement id="LottieDemo">
		<Fill
			style={{
				backgroundColor: "#0d1117",
				display: "flex",
				flexDirection: "column",
				alignItems: "center",
				justifyContent: "center",
				opacity: fadeIn * fadeOut,
			}}
		>
			<Lottie
				animationData={animationData}
				loop
				style={{ width: 300, height: 300 }}
			/>
			<div
				style={{
					color: "#e2e8f0",
					fontSize: 32,
					fontWeight: 600,
					marginTop: 24,
					fontFamily: "system-ui, -apple-system, sans-serif",
				}}
			>
				@rendiv/lottie
			</div>
		</Fill>
		</CanvasElement>
	);
}
