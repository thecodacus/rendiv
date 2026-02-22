import React from "react";
import { useFrame, useCompositionConfig, Fill, Series, Loop, Freeze, Sequence, interpolate, spring, blendColors } from "@rendiv/core";

/** Scene 1: Title card with spring animation */
function TitleScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const scale = spring({ frame, fps, config: { damping: 10, stiffness: 80, mass: 0.6 } });
	const opacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

	return (
		<Fill
			style={{
				background: "#0d1117",
				justifyContent: "center",
				alignItems: "center",
			}}
		>
			<h1
				style={{
					color: "#ffffff",
					fontSize: 72,
					fontFamily: "system-ui, sans-serif",
					fontWeight: 700,
					opacity,
					transform: `scale(${scale})`,
					margin: 0,
				}}
			>
				Rendiv Phase 2
			</h1>
		</Fill>
	);
}

/** Scene 2: Demonstrate Loop — a pulsing circle that repeats */
function LoopScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const bgColor = blendColors(frame, [0, 60], ["#1a1a2e", "#16213e"]);

	return (
		<Fill
			style={{
				background: bgColor,
				justifyContent: "center",
				alignItems: "center",
				gap: 40,
			}}
		>
			<p
				style={{
					color: "#8b949e",
					fontSize: 24,
					fontFamily: "system-ui, sans-serif",
					position: "absolute",
					top: 80,
				}}
			>
				{"<Loop durationInFrames={30}>"}
			</p>

			<Loop durationInFrames={30} layout="none">
				<PulsingCircle />
			</Loop>

			{/* Counter showing which iteration we're on */}
			<p
				style={{
					color: "#58a6ff",
					fontSize: 36,
					fontFamily: "monospace",
					position: "absolute",
					bottom: 80,
				}}
			>
				iteration {Math.floor(frame / 30) + 1}
			</p>
		</Fill>
	);
}

function PulsingCircle(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const scale = spring({ frame, fps, config: { damping: 8, stiffness: 120, mass: 0.5 } });
	const opacity = interpolate(frame, [0, 10, 25, 30], [0.3, 1, 1, 0.3], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<div
			style={{
				width: 200,
				height: 200,
				borderRadius: "50%",
				background: "linear-gradient(135deg, #58a6ff, #bc8cff)",
				transform: `scale(${scale})`,
				opacity,
				boxShadow: `0 0 ${40 * scale}px rgba(88, 166, 255, 0.4)`,
			}}
		/>
	);
}

/** Scene 3: Demonstrate Freeze — a counter that freezes mid-count */
function FreezeScene(): React.ReactElement {
	const frame = useFrame();

	return (
		<Fill
			style={{
				background: "#0d1117",
				justifyContent: "center",
				alignItems: "center",
				flexDirection: "column",
				gap: 48,
			}}
		>
			<p
				style={{
					color: "#8b949e",
					fontSize: 24,
					fontFamily: "system-ui, sans-serif",
				}}
			>
				{"<Freeze frame={20}>"}
			</p>

			<div style={{ display: "flex", gap: 80, alignItems: "center" }}>
				{/* Normal counter */}
				<div style={{ textAlign: "center" }}>
					<p style={{ color: "#8b949e", fontSize: 18, fontFamily: "system-ui, sans-serif", margin: 0 }}>Normal</p>
					<Counter />
				</div>

				{/* Frozen counter */}
				<div style={{ textAlign: "center" }}>
					<p style={{ color: "#bc8cff", fontSize: 18, fontFamily: "system-ui, sans-serif", margin: 0 }}>Frozen</p>
					<Freeze frame={20}>
						<Counter />
					</Freeze>
				</div>
			</div>

			<p
				style={{
					color: "#484f58",
					fontSize: 20,
					fontFamily: "monospace",
				}}
			>
				frame: {frame}
			</p>
		</Fill>
	);
}

function Counter(): React.ReactElement {
	const frame = useFrame();

	return (
		<p
			style={{
				color: "#ffffff",
				fontSize: 96,
				fontFamily: "monospace",
				fontWeight: 700,
				margin: 0,
				minWidth: 160,
				textAlign: "center",
			}}
		>
			{frame}
		</p>
	);
}

/** Scene 4: Outro with fade out */
function OutroScene(): React.ReactElement {
	const frame = useFrame();
	const { fps, durationInFrames } = useCompositionConfig();

	const scale = spring({ frame, fps, config: { damping: 14, stiffness: 80, mass: 0.5 } });
	const fadeOut = interpolate(frame, [durationInFrames - 20, durationInFrames], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	return (
		<Fill
			style={{
				background: "#0d1117",
				justifyContent: "center",
				alignItems: "center",
				opacity: fadeOut,
			}}
		>
			<h1
				style={{
					color: "#58a6ff",
					fontSize: 56,
					fontFamily: "system-ui, sans-serif",
					fontWeight: 600,
					transform: `scale(${scale})`,
					margin: 0,
				}}
			>
				Series + Loop + Freeze
			</h1>
		</Fill>
	);
}

/**
 * Main composition: uses <Series> to play scenes back-to-back.
 * Total: 60 + 90 + 75 + 45 = 270 frames = 9s at 30fps
 */
export function SeriesDemo(): React.ReactElement {
	return (
		<Series>
			<Series.Sequence durationInFrames={60}>
				<TitleScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={90}>
				<LoopScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={75}>
				<FreezeScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={45}>
				<OutroScene />
			</Series.Sequence>
		</Series>
	);
}
