import React from "react";
import { useFrame, useCompositionConfig, Fill, Series, Sequence, CanvasElement, interpolate, spring, Video, Audio, staticFile, OffthreadVideo } from "@rendiv/core";

/** Scene 1: Intro — title fades and scales in */
function IntroScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const scale = spring({ frame, fps, config: { damping: 12, stiffness: 90, mass: 0.7 } });
	const opacity = interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" });

	return (
		<Fill
			style={{
				background: "linear-gradient(135deg, #0d1117, #1a2332)",
				justifyContent: "center",
				alignItems: "center",
				flexDirection: "column",
				gap: 16,
			}}
		>
			<h1
				style={{
					color: "#ffffff",
					fontSize: 64,
					fontFamily: "system-ui, sans-serif",
					fontWeight: 700,
					margin: 0,
					opacity,
					transform: `scale(${scale})`,
				}}
			>
				Video + Sequences
			</h1>
			<p
				style={{
					color: "#58a6ff",
					fontSize: 28,
					fontFamily: "system-ui, sans-serif",
					fontWeight: 300,
					margin: 0,
					opacity: interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
				}}
			>
				A rendiv demo composition
			</p>
		</Fill>
	);
}

/** Scene 2: Full-screen video with a frame counter overlay */
function VideoScene(): React.ReactElement {
	const frame = useFrame();

	const overlayOpacity = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });

	return (
		<Fill style={{ background: "#000000" }}>
			<OffthreadVideo src={staticFile("Intro Segment 1_1080p.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
			{/* Dark gradient at bottom */}
			<div
				style={{
					position: "absolute",
					bottom: 0,
					left: 0,
					right: 0,
					height: 160,
					background: "linear-gradient(transparent, rgba(0,0,0,0.8))",
				}}
			/>
			<div
				style={{
					position: "absolute",
					bottom: 48,
					left: 0,
					right: 0,
					textAlign: "center",
					opacity: overlayOpacity,
				}}
			>
				<span
					style={{
						color: "#ffffff",
						fontSize: 28,
						fontFamily: "system-ui, sans-serif",
						background: "rgba(0,0,0,0.5)",
						padding: "6px 20px",
						borderRadius: 6,
					}}
				>
					{"<Video>"} — frame {frame}
				</span>
			</div>
		</Fill>
	);
}

/** Scene 3: Video in a picture-in-picture layout with an animated stat */
function PipScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const pipScale = spring({ frame, fps, config: { damping: 14, stiffness: 100, mass: 0.6 } });
	const textOpacity = interpolate(frame, [10, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

	return (
		<Fill
			style={{
				background: "#0d1117",
				justifyContent: "center",
				alignItems: "center",
				flexDirection: "column",
				gap: 40,
			}}
		>
			<p
				style={{
					color: "#8b949e",
					fontSize: 22,
					fontFamily: "system-ui, sans-serif",
					margin: 0,
					opacity: textOpacity,
				}}
			>
				Picture-in-picture with {"<Sequence>"}
			</p>

			<div style={{ display: "flex", gap: 40, alignItems: "flex-start" }}>
				{/* Main video */}
				<div
					style={{
						width: 640,
						height: 360,
						borderRadius: 12,
						overflow: "hidden",
						border: "1px solid #30363d",
					}}
				>
					<Video src={staticFile("Intro 2_1080p.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
				</div>

				{/* PiP video — starts 15 frames in */}
				<Sequence from={15} layout="none">
					<div
						style={{
							width: 300,
							height: 169,
							borderRadius: 10,
							overflow: "hidden",
							border: "2px solid #58a6ff",
							transform: `scale(${pipScale})`,
							transformOrigin: "top left",
							boxShadow: "0 8px 32px rgba(88,166,255,0.3)",
						}}
					>
						<OffthreadVideo src={staticFile("Intro Segment 1_1080p.mp4")} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
					</div>
				</Sequence>
			</div>
		</Fill>
	);
}

/** Scene 4: Outro with staggered text reveal */
function OutroScene(): React.ReactElement {
	const frame = useFrame();
	const { fps, durationInFrames } = useCompositionConfig();

	const fadeOut = interpolate(frame, [durationInFrames - 25, durationInFrames], [1, 0], {
		extrapolateLeft: "clamp",
		extrapolateRight: "clamp",
	});

	const line1Scale = spring({ frame, fps, config: { damping: 12, stiffness: 80, mass: 0.5 } });
	const line2Opacity = interpolate(frame, [20, 40], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
	const line3Opacity = interpolate(frame, [40, 60], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

	return (
		<Fill
			style={{
				background: "linear-gradient(135deg, #0d1117, #1a2332)",
				justifyContent: "center",
				alignItems: "center",
				flexDirection: "column",
				gap: 20,
				opacity: fadeOut,
			}}
		>
			<h1
				style={{
					color: "#58a6ff",
					fontSize: 56,
					fontFamily: "system-ui, sans-serif",
					fontWeight: 700,
					margin: 0,
					transform: `scale(${line1Scale})`,
				}}
			>
				That's a wrap!
			</h1>
			<p
				style={{
					color: "#ffffff",
					fontSize: 28,
					fontFamily: "system-ui, sans-serif",
					fontWeight: 300,
					margin: 0,
					opacity: line2Opacity,
				}}
			>
				Video · Series · Sequence
			</p>
			<p
				style={{
					color: "#8b949e",
					fontSize: 20,
					fontFamily: "monospace",
					margin: 0,
					opacity: line3Opacity,
				}}
			>
				powered by rendiv
			</p>
		</Fill>
	);
}

/**
 * VideoSequencesDemo — combines <Video> with <Series> and <Sequence>.
 * Total: 60 + 90 + 90 + 60 = 300 frames = 10s at 30fps
 */
export function VideoSequencesDemo(): React.ReactElement {
	return (
		<CanvasElement id="VideoSequencesDemo">
			{/* Audio track — parallel sequence spanning the full composition */}
			{/* <Sequence from={60} durationInFrames={240} layout="none">
				<Audio src={staticFile("01_hook_intro.wav")} />
			</Sequence> */}

			<Series>
				<Series.Sequence durationInFrames={60}>
					<IntroScene />
				</Series.Sequence>

				<Series.Sequence durationInFrames={90} premountFor={90}>
					<VideoScene />
				</Series.Sequence>

				{/* <Series.Sequence durationInFrames={90} premountFor={30}>
					<PipScene />
				</Series.Sequence>

				<Series.Sequence durationInFrames={60}>
					<OutroScene />
				</Series.Sequence> */}
			</Series>
		</CanvasElement>
	);
}
