import React, { useRef } from "react";
import { useFrame, useCompositionConfig, Fill, interpolate, spring } from "@rendiv/core";
import { ThreeCanvas } from "@rendiv/three";
import * as THREE from "three";

function RotatingBox(): React.ReactElement {
	const meshRef = useRef<THREE.Mesh>(null);
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const rotationY = interpolate(frame, [0, 150], [0, Math.PI * 2]);
	const rotationX = interpolate(frame, [0, 150], [0, Math.PI]);
	const scale = spring({
		frame,
		fps,
		config: { damping: 12, stiffness: 100, mass: 0.8 },
	});

	if (meshRef.current) {
		meshRef.current.rotation.y = rotationY;
		meshRef.current.rotation.x = rotationX;
		meshRef.current.scale.setScalar(scale);
	}

	return (
		<mesh ref={meshRef}>
			<boxGeometry args={[2, 2, 2]} />
			<meshStandardMaterial color="#6bd4ff" metalness={0.3} roughness={0.4} />
		</mesh>
	);
}

function FloatingSphere(): React.ReactElement {
	const meshRef = useRef<THREE.Mesh>(null);
	const frame = useFrame();

	const y = Math.sin(frame * 0.05) * 1.5;
	const color = frame % 60 < 30 ? "#ff6b6b" : "#b06bff";

	if (meshRef.current) {
		meshRef.current.position.y = y;
		meshRef.current.position.x = -3;
	}

	return (
		<mesh ref={meshRef}>
			<sphereGeometry args={[0.6, 32, 32]} />
			<meshStandardMaterial color={color} metalness={0.5} roughness={0.2} />
		</mesh>
	);
}

export function ThreeDemo(): React.ReactElement {
	const frame = useFrame();
	const { durationInFrames } = useCompositionConfig();

	const fadeIn = interpolate(frame, [0, 15], [0, 1], { extrapolateRight: "clamp" });
	const fadeOut = interpolate(frame, [durationInFrames - 15, durationInFrames], [1, 0], {
		extrapolateLeft: "clamp",
	});

	return (
		<Fill
			style={{
				backgroundColor: "#0a0a1a",
				opacity: fadeIn * fadeOut,
				position: "relative",
			}}
		>
			<ThreeCanvas
				camera={{ position: [0, 2, 6], fov: 50 }}
				style={{ width: 1920, height: 1080 }}
			>
				<ambientLight intensity={0.4} />
				<directionalLight position={[5, 5, 5]} intensity={1} />
				<pointLight position={[-3, 3, -3]} intensity={0.5} color="#b06bff" />
				<RotatingBox />
				<FloatingSphere />
				<gridHelper args={[20, 20, "#333355", "#222244"]} position={[0, -2, 0]} />
			</ThreeCanvas>
			<div
				style={{
					position: "absolute",
					bottom: 60,
					left: 0,
					right: 0,
					textAlign: "center",
					color: "#e2e8f0",
					fontSize: 32,
					fontWeight: 600,
					fontFamily: "system-ui, -apple-system, sans-serif",
				}}
			>
				@rendiv/three
			</div>
		</Fill>
	);
}
