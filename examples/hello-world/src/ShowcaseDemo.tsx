import React from 'react';
import {
	useFrame,
	useCompositionConfig,
	Fill,
	Series,
	interpolate,
	spring,
	Easing,
	blendColors,
} from '@rendiv/core';
import { useFont } from '@rendiv/google-fonts';
import { shapeStar, shapePolygon, shapePie } from '@rendiv/shapes';
import { strokeReveal, morphPath } from '@rendiv/paths';
import { noise2D, noise3D } from '@rendiv/noise';
import { MotionTrail } from '@rendiv/motion-blur';

// ─── Scene 1: Cinematic Title Reveal ──────────────────────────────────────────

function TitleScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const titleFont = useFont({ family: 'Space Grotesk', weight: '700' });
	const subFont = useFont({ family: 'Inter', weight: '300' });

	// Background gradient shift
	const bg1 = blendColors(frame, [0, 120], ['#0a0a1a', '#0d1b2a']);
	const bg2 = blendColors(frame, [0, 120], ['#1a0a2e', '#1b2838']);

	// Letter-by-letter spring animation for "RENDIV"
	const letters = 'RENDIV'.split('');
	const letterColors = ['#ff6b6b', '#ffa06b', '#ffd06b', '#6bffa0', '#6bd4ff', '#b06bff'];

	// Subtitle
	const subDelay = 25;
	const subSpring = spring({ frame: frame - subDelay, fps, config: { damping: 16, stiffness: 80 } });
	const subY = interpolate(subSpring, [0, 1], [30, 0]);
	const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

	// Decorative line
	const lineWidth = interpolate(frame, [30, 60], [0, 400], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });

	// Floating particles driven by noise
	const particles = Array.from({ length: 40 }, (_, i) => {
		const seed = i * 7.3;
		const baseX = (i % 10) * 192;
		const baseY = Math.floor(i / 10) * 270;
		const nx = noise2D(seed, frame * 0.02) * 60;
		const ny = noise2D(seed + 100, frame * 0.02) * 60;
		const size = 2 + noise2D(seed + 200, frame * 0.01) * 2;
		const opacity = 0.15 + noise2D(seed + 300, frame * 0.015) * 0.15;
		return { x: baseX + nx, y: baseY + ny, size, opacity };
	});

	// Fade out at end
	const fadeOut = interpolate(frame, [105, 120], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<Fill>
			<div
				style={{
					width: '100%',
					height: '100%',
					background: `linear-gradient(135deg, ${bg1}, ${bg2})`,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					position: 'relative',
					overflow: 'hidden',
					opacity: fadeOut,
				}}
			>
				{/* Noise particles */}
				{particles.map((p, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: p.x,
							top: p.y,
							width: p.size,
							height: p.size,
							borderRadius: '50%',
							backgroundColor: '#fff',
							opacity: p.opacity,
						}}
					/>
				))}

				{/* Main title */}
				<div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
					{letters.map((letter, i) => {
						const delay = i * 3;
						const s = spring({ frame: frame - delay, fps, config: { damping: 10, stiffness: 150, mass: 0.8 } });
						const y = interpolate(s, [0, 1], [80, 0]);
						const opacity = interpolate(s, [0, 1], [0, 1]);
						const rotate = interpolate(s, [0, 1], [15, 0]);

						return (
							<span
								key={i}
								style={{
									fontFamily: titleFont,
									fontSize: 140,
									color: letterColors[i],
									opacity,
									transform: `translateY(${y}px) rotate(${rotate}deg)`,
									display: 'inline-block',
									textShadow: `0 0 40px ${letterColors[i]}60`,
								}}
							>
								{letter}
							</span>
						);
					})}
				</div>

				{/* Decorative line */}
				<div
					style={{
						width: lineWidth,
						height: 2,
						background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.6), transparent)',
						marginBottom: 20,
					}}
				/>

				{/* Subtitle */}
				<p
					style={{
						fontFamily: subFont,
						fontSize: 28,
						color: 'rgba(255,255,255,0.7)',
						opacity: subOpacity,
						transform: `translateY(${subY}px)`,
						margin: 0,
						letterSpacing: 8,
						textTransform: 'uppercase',
					}}
				>
					Programmatic Video Creation
				</p>
			</div>
		</Fill>
	);
}

// ─── Scene 2: Geometric Symphony ──────────────────────────────────────────────

function GeometryScene(): React.ReactElement {
	const frame = useFrame();
	const labelFont = useFont({ family: 'Fira Code', weight: '400' });

	// Star stroke reveal
	const star = shapeStar({ innerRadius: 40, outerRadius: 90, points: 5 });
	const revealP = interpolate(frame, [5, 60], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	const reveal = strokeReveal(revealP, star.d);
	const starGlow = interpolate(revealP, [0, 1], [0, 15]);

	// Morphing polygon → star (12-gon → 6-pointed star for segment match)
	const morphFrom = shapePolygon({ radius: 80, sides: 12 });
	const morphTo = shapeStar({ innerRadius: 35, outerRadius: 80, points: 6 });
	const morphP = interpolate(frame, [20, 80], [0, 1], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	const eased = Easing.easeInOut(morphP);
	let morphedPath: string;
	try {
		morphedPath = morphPath(eased, morphFrom.d, morphTo.d);
	} catch {
		morphedPath = morphP < 0.5 ? morphFrom.d : morphTo.d;
	}
	const morphRotation = interpolate(frame, [20, 80], [0, 60], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	const morphColor = blendColors(frame, [20, 80], ['#ffa06b', '#ff6bcd']);

	// Animated pie
	const pieAngle = interpolate(frame, [10, 70], [0, 300], { extrapolateRight: 'clamp', extrapolateLeft: 'clamp' });
	const pie = shapePie({ radius: 80, startAngle: 0, endAngle: Math.max(pieAngle, 0.1) });
	const pieColor = blendColors(frame, [10, 70], ['#6bffa0', '#6bd4ff']);

	// Orbiting circles
	const orbitAngle = frame * 3;
	const orbitR = 50;

	// Scene entrance / exit
	const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [100, 115], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Background grid
	const gridLines = Array.from({ length: 20 }, (_, i) => i);

	return (
		<Fill>
			<div
				style={{
					width: '100%',
					height: '100%',
					background: '#080810',
					position: 'relative',
					overflow: 'hidden',
					opacity: fadeIn * fadeOut,
				}}
			>
				{/* Subtle grid */}
				{gridLines.map((i) => (
					<React.Fragment key={i}>
						<div style={{ position: 'absolute', left: 0, top: i * 54, width: '100%', height: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
						<div style={{ position: 'absolute', left: i * 96, top: 0, height: '100%', width: 1, backgroundColor: 'rgba(255,255,255,0.03)' }} />
					</React.Fragment>
				))}

				<div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: '100%', padding: '0 100px' }}>
					{/* Star stroke reveal */}
					<div style={{ textAlign: 'center' }}>
						<svg width={200} height={200} viewBox={star.viewBox}>
							<path
								d={star.d}
								fill="none"
								stroke="#6bd4ff"
								strokeWidth={2.5}
								strokeLinejoin="round"
								style={{
									strokeDasharray: reveal.strokeDasharray,
									strokeDashoffset: reveal.strokeDashoffset,
									filter: `drop-shadow(0 0 ${starGlow}px #6bd4ff)`,
								}}
							/>
						</svg>
						<p style={{ fontFamily: labelFont, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>strokeReveal</p>
					</div>

					{/* Morphing shape */}
					<div style={{ textAlign: 'center' }}>
						<svg width={200} height={200} viewBox={morphFrom.viewBox}>
							<path
								d={morphedPath}
								fill={`${morphColor}20`}
								stroke={morphColor}
								strokeWidth={2.5}
								strokeLinejoin="round"
								transform={`rotate(${morphRotation}, ${morphFrom.width / 2}, ${morphFrom.height / 2})`}
							/>
						</svg>
						<p style={{ fontFamily: labelFont, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>morphPath</p>
					</div>

					{/* Pie + orbiting dots */}
					<div style={{ textAlign: 'center', position: 'relative' }}>
						<svg width={200} height={200} viewBox={pie.viewBox}>
							<path
								d={pie.d}
								fill={`${pieColor}40`}
								stroke={pieColor}
								strokeWidth={2}
							/>
							<circle cx={pie.width / 2} cy={pie.height / 2} r={80} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={1} />
							{/* Orbiting dots */}
							{[0, 120, 240].map((offset, idx) => {
								const a = ((orbitAngle + offset) * Math.PI) / 180;
								const cx = pie.width / 2 + Math.cos(a) * orbitR;
								const cy = pie.height / 2 + Math.sin(a) * orbitR;
								return <circle key={idx} cx={cx} cy={cy} r={4} fill={['#ff6b6b', '#ffd06b', '#b06bff'][idx]} opacity={0.8} />;
							})}
						</svg>
						<p style={{ fontFamily: labelFont, fontSize: 13, color: 'rgba(255,255,255,0.4)', marginTop: 16 }}>shapePie</p>
					</div>
				</div>

				{/* Scene label */}
				<div style={{ position: 'absolute', bottom: 40, left: 0, right: 0, textAlign: 'center' }}>
					<span style={{ fontFamily: labelFont, fontSize: 16, color: 'rgba(255,255,255,0.25)', letterSpacing: 4 }}>
						SHAPES & PATHS
					</span>
				</div>
			</div>
		</Fill>
	);
}

// ─── Scene 3: Kinetic Typography ──────────────────────────────────────────────

function TypographyScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const bodyFont = useFont({ family: 'DM Sans', weight: '400' });
	const accentFont = useFont({ family: 'Bebas Neue', weight: '400' });

	const words = ['Animate', 'Compose', 'Render', 'Ship'];
	const wordColors = ['#ff6b6b', '#ffa06b', '#6bffa0', '#6bd4ff'];

	// Fade
	const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [110, 125], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Background hue shift
	const bgColor = blendColors(frame, [0, 125], ['#0a0a1a', '#1a0a0a']);

	return (
		<Fill>
			<div
				style={{
					width: '100%',
					height: '100%',
					background: bgColor,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					position: 'relative',
					overflow: 'hidden',
					opacity: fadeIn * fadeOut,
				}}
			>
				{/* Big staggered words */}
				<div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
					{words.map((word, i) => {
						const delay = 5 + i * 10;
						const s = spring({ frame: frame - delay, fps, config: { damping: 12, stiffness: 120, mass: 0.7 } });
						const x = interpolate(s, [0, 1], [i % 2 === 0 ? -300 : 300, 0]);
						const opacity = interpolate(s, [0, 1], [0, 1]);
						const scale = interpolate(s, [0, 1], [0.6, 1]);

						return (
							<div
								key={word}
								style={{
									fontFamily: accentFont,
									fontSize: 110,
									color: wordColors[i],
									opacity,
									transform: `translateX(${x}px) scale(${scale})`,
									lineHeight: 1,
									textShadow: `0 0 60px ${wordColors[i]}30`,
								}}
							>
								{word}
							</div>
						);
					})}
				</div>

				{/* Flowing subtitle */}
				<div
					style={{
						marginTop: 40,
						overflow: 'hidden',
					}}
				>
					{(() => {
						const subDelay = 50;
						const subS = spring({ frame: frame - subDelay, fps, config: { damping: 18, stiffness: 60 } });
						const subY = interpolate(subS, [0, 1], [40, 0]);
						const subOpacity = interpolate(subS, [0, 1], [0, 1]);
						return (
							<p
								style={{
									fontFamily: bodyFont,
									fontSize: 24,
									color: 'rgba(255,255,255,0.5)',
									margin: 0,
									letterSpacing: 6,
									textTransform: 'uppercase',
									opacity: subOpacity,
									transform: `translateY(${subY}px)`,
								}}
							>
								Videos as React Components
							</p>
						);
					})()}
				</div>

				{/* Decorative corner brackets */}
				<div style={{ position: 'absolute', top: 60, left: 80, width: 40, height: 40, borderLeft: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid rgba(255,255,255,0.15)' }} />
				<div style={{ position: 'absolute', top: 60, right: 80, width: 40, height: 40, borderRight: '2px solid rgba(255,255,255,0.15)', borderTop: '2px solid rgba(255,255,255,0.15)' }} />
				<div style={{ position: 'absolute', bottom: 60, left: 80, width: 40, height: 40, borderLeft: '2px solid rgba(255,255,255,0.15)', borderBottom: '2px solid rgba(255,255,255,0.15)' }} />
				<div style={{ position: 'absolute', bottom: 60, right: 80, width: 40, height: 40, borderRight: '2px solid rgba(255,255,255,0.15)', borderBottom: '2px solid rgba(255,255,255,0.15)' }} />
			</div>
		</Fill>
	);
}

// ─── Scene 4: Noise Field + Motion Trail ──────────────────────────────────────

function NoiseTrailScene(): React.ReactElement {
	const frame = useFrame();
	const labelFont = useFont({ family: 'Space Mono', weight: '400' });

	// Noise-driven grid
	const cols = 32;
	const rows = 18;
	const cellW = 1920 / cols;
	const cellH = 1080 / rows;

	// Moving orb with motion trail
	const orbX = 960 + Math.sin(frame * 0.06) * 400 + noise2D(0, frame * 0.03) * 100;
	const orbY = 540 + Math.cos(frame * 0.04) * 250 + noise2D(100, frame * 0.03) * 80;

	const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [110, 125], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	// Central pulse ring
	const pulseScale = 1 + Math.sin(frame * 0.08) * 0.2;
	const pulseOpacity = 0.1 + Math.sin(frame * 0.08) * 0.05;

	return (
		<Fill>
			<div
				style={{
					width: '100%',
					height: '100%',
					background: '#050510',
					position: 'relative',
					overflow: 'hidden',
					opacity: fadeIn * fadeOut,
				}}
			>
				{/* Noise field grid */}
				{Array.from({ length: cols * rows }, (_, idx) => {
					const col = idx % cols;
					const row = Math.floor(idx / cols);
					const n = noise3D(col * 0.15, row * 0.15, frame * 0.025);
					const brightness = Math.max(0, n);
					const hue = 200 + n * 60;
					return (
						<div
							key={idx}
							style={{
								position: 'absolute',
								left: col * cellW,
								top: row * cellH,
								width: cellW - 1,
								height: cellH - 1,
								backgroundColor: `hsla(${hue}, 70%, 50%, ${brightness * 0.35})`,
								borderRadius: 2,
							}}
						/>
					);
				})}

				{/* Pulsing ring */}
				<div
					style={{
						position: 'absolute',
						left: 960 - 200,
						top: 540 - 200,
						width: 400,
						height: 400,
						borderRadius: '50%',
						border: '1px solid rgba(107, 212, 255, 0.3)',
						transform: `scale(${pulseScale})`,
						opacity: pulseOpacity,
					}}
				/>

				{/* Motion-trailed orb */}
				<MotionTrail layers={8} offset={1} fadeRate={0.55}>
					<div
						style={{
							position: 'absolute',
							left: orbX - 20,
							top: orbY - 20,
							width: 40,
							height: 40,
							borderRadius: '50%',
							background: 'radial-gradient(circle, #6bd4ff, #6b6bff)',
							boxShadow: '0 0 30px rgba(107, 212, 255, 0.6), 0 0 60px rgba(107, 107, 255, 0.3)',
						}}
					/>
				</MotionTrail>

				{/* Secondary orb */}
				<MotionTrail layers={6} offset={1} fadeRate={0.5}>
					<div
						style={{
							position: 'absolute',
							left: (1920 - orbX) - 12,
							top: (1080 - orbY) - 12,
							width: 24,
							height: 24,
							borderRadius: '50%',
							background: 'radial-gradient(circle, #ff6b9d, #ff6b6b)',
							boxShadow: '0 0 20px rgba(255, 107, 157, 0.5)',
						}}
					/>
				</MotionTrail>

				{/* Labels */}
				<div style={{ position: 'absolute', bottom: 40, left: 80 }}>
					<span style={{ fontFamily: labelFont, fontSize: 14, color: 'rgba(255,255,255,0.3)', letterSpacing: 3 }}>
						NOISE FIELD + MOTION TRAIL
					</span>
				</div>

				{/* Frame counter */}
				<div style={{ position: 'absolute', top: 40, right: 80 }}>
					<span style={{ fontFamily: labelFont, fontSize: 14, color: 'rgba(255,255,255,0.2)' }}>
						F{String(frame).padStart(3, '0')}
					</span>
				</div>
			</div>
		</Fill>
	);
}

// ─── Scene 5: Feature Grid ────────────────────────────────────────────────────

function FeatureGridScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const headFont = useFont({ family: 'Space Grotesk', weight: '600' });
	const monoFont = useFont({ family: 'Fira Code', weight: '400' });

	const features = [
		{ icon: 'useFrame()', desc: 'Frame-driven rendering', color: '#ff6b6b' },
		{ icon: 'spring()', desc: 'Physics animation', color: '#ffa06b' },
		{ icon: '<Series>', desc: 'Sequence composition', color: '#ffd06b' },
		{ icon: 'interpolate()', desc: 'Value mapping', color: '#6bffa0' },
		{ icon: 'noise3D()', desc: 'Organic motion', color: '#6bd4ff' },
		{ icon: 'useFont()', desc: 'Google Fonts', color: '#b06bff' },
		{ icon: 'shapeStar()', desc: 'SVG primitives', color: '#ff6bcd' },
		{ icon: 'morphPath()', desc: 'Path animation', color: '#6bffeb' },
	];

	const fadeIn = interpolate(frame, [0, 10], [0, 1], { extrapolateRight: 'clamp' });
	const fadeOut = interpolate(frame, [100, 115], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<Fill>
			<div
				style={{
					width: '100%',
					height: '100%',
					background: '#080810',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					position: 'relative',
					overflow: 'hidden',
					opacity: fadeIn * fadeOut,
				}}
			>
				{/* Title */}
				{(() => {
					const ts = spring({ frame, fps, config: { damping: 14, stiffness: 100 } });
					const ty = interpolate(ts, [0, 1], [30, 0]);
					const to = interpolate(ts, [0, 1], [0, 1]);
					return (
						<h2
							style={{
								fontFamily: headFont,
								fontSize: 48,
								color: '#fff',
								margin: 0,
								marginBottom: 50,
								opacity: to,
								transform: `translateY(${ty}px)`,
								letterSpacing: -1,
							}}
						>
							Everything you need
						</h2>
					);
				})()}

				{/* Feature grid */}
				<div
					style={{
						display: 'grid',
						gridTemplateColumns: 'repeat(4, 1fr)',
						gap: 20,
						padding: '0 120px',
						width: '100%',
						maxWidth: 1400,
					}}
				>
					{features.map((feat, i) => {
						const delay = 8 + i * 4;
						const s = spring({ frame: frame - delay, fps, config: { damping: 14, stiffness: 120 } });
						const scale = interpolate(s, [0, 1], [0.7, 1]);
						const opacity = interpolate(s, [0, 1], [0, 1]);

						return (
							<div
								key={feat.icon}
								style={{
									background: 'rgba(255,255,255,0.04)',
									border: `1px solid ${feat.color}25`,
									borderRadius: 16,
									padding: '28px 24px',
									opacity,
									transform: `scale(${scale})`,
								}}
							>
								<p
									style={{
										fontFamily: monoFont,
										fontSize: 18,
										color: feat.color,
										margin: 0,
										marginBottom: 8,
									}}
								>
									{feat.icon}
								</p>
								<p
									style={{
										fontFamily: headFont,
										fontSize: 15,
										color: 'rgba(255,255,255,0.5)',
										margin: 0,
									}}
								>
									{feat.desc}
								</p>
							</div>
						);
					})}
				</div>
			</div>
		</Fill>
	);
}

// ─── Scene 6: Outro ───────────────────────────────────────────────────────────

function OutroScene(): React.ReactElement {
	const frame = useFrame();
	const { fps } = useCompositionConfig();

	const brandFont = useFont({ family: 'Space Grotesk', weight: '700' });
	const subFont = useFont({ family: 'Inter', weight: '300' });

	const logoSpring = spring({ frame, fps, config: { damping: 10, stiffness: 80, mass: 1.2 } });
	const logoScale = interpolate(logoSpring, [0, 1], [0.3, 1]);
	const logoOpacity = interpolate(logoSpring, [0, 1], [0, 1]);

	const tagDelay = 20;
	const tagSpring = spring({ frame: frame - tagDelay, fps, config: { damping: 16, stiffness: 60 } });
	const tagOpacity = interpolate(tagSpring, [0, 1], [0, 1]);
	const tagY = interpolate(tagSpring, [0, 1], [20, 0]);

	// Radiating rings
	const rings = [0, 1, 2].map((i) => {
		const delay = 10 + i * 8;
		const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 40 } });
		const scale = interpolate(s, [0, 1], [0.5, 1 + i * 0.4]);
		const opacity = interpolate(s, [0, 1], [0, 0.15 - i * 0.04]);
		return { scale, opacity };
	});

	// Stars orbiting
	const star = shapeStar({ innerRadius: 6, outerRadius: 14, points: 5 });
	const orbitFrame = frame * 2;

	const fadeOut = interpolate(frame, [75, 90], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

	return (
		<Fill>
			<div
				style={{
					width: '100%',
					height: '100%',
					background: 'radial-gradient(ellipse at center, #0d1b2a 0%, #050510 70%)',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					alignItems: 'center',
					position: 'relative',
					overflow: 'hidden',
					opacity: fadeOut,
				}}
			>
				{/* Radiating rings */}
				{rings.map((ring, i) => (
					<div
						key={i}
						style={{
							position: 'absolute',
							left: '50%',
							top: '50%',
							width: 300,
							height: 300,
							marginLeft: -150,
							marginTop: -150,
							borderRadius: '50%',
							border: '1px solid rgba(107, 212, 255, 0.5)',
							transform: `scale(${ring.scale})`,
							opacity: ring.opacity,
						}}
					/>
				))}

				{/* Orbiting mini stars */}
				{[0, 72, 144, 216, 288].map((offset, idx) => {
					const angle = ((orbitFrame + offset) * Math.PI) / 180;
					const r = 180;
					const x = 960 + Math.cos(angle) * r;
					const y = 540 + Math.sin(angle) * r;
					const starColors = ['#ff6b6b', '#ffa06b', '#6bffa0', '#6bd4ff', '#b06bff'];
					return (
						<svg
							key={idx}
							width={28}
							height={28}
							viewBox={star.viewBox}
							style={{
								position: 'absolute',
								left: x - 14,
								top: y - 14,
								opacity: logoOpacity * 0.6,
							}}
						>
							<path d={star.d} fill={starColors[idx]} />
						</svg>
					);
				})}

				{/* Logo text */}
				<div
					style={{
						fontFamily: brandFont,
						fontSize: 96,
						color: '#fff',
						opacity: logoOpacity,
						transform: `scale(${logoScale})`,
						letterSpacing: 4,
						textShadow: '0 0 80px rgba(107, 212, 255, 0.3)',
					}}
				>
					RENDIV
				</div>

				{/* Tagline */}
				<p
					style={{
						fontFamily: subFont,
						fontSize: 20,
						color: 'rgba(255,255,255,0.4)',
						opacity: tagOpacity,
						transform: `translateY(${tagY}px)`,
						margin: 0,
						marginTop: 16,
						letterSpacing: 6,
					}}
				>
					OPEN SOURCE MOTION GRAPHICS
				</p>
			</div>
		</Fill>
	);
}

// ─── Main Composition ─────────────────────────────────────────────────────────

/**
 * A cinematic showcase that demonstrates every Rendiv capability:
 * - Google Fonts (@rendiv/google-fonts)
 * - Spring & interpolation animation (@rendiv/core)
 * - SVG shapes & path morphing (@rendiv/shapes, @rendiv/paths)
 * - Simplex noise fields (@rendiv/noise)
 * - Motion trail effects (@rendiv/motion-blur)
 * - Color blending, easing, Series sequencing
 *
 * Total: 600 frames = 20s at 30fps
 */
export function ShowcaseDemo(): React.ReactElement {
	return (
		<Series>
			<Series.Sequence durationInFrames={120}>
				<TitleScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={115}>
				<GeometryScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={125}>
				<TypographyScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={125}>
				<NoiseTrailScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={115}>
				<FeatureGridScene />
			</Series.Sequence>
			<Series.Sequence durationInFrames={90}>
				<OutroScene />
			</Series.Sequence>
		</Series>
	);
}
