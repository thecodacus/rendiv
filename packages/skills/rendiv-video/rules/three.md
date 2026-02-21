# 3D Scenes — @rendiv/three

Embed frame-accurate 3D scenes in rendiv compositions using
[React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (R3F) and
[Three.js](https://threejs.org/).

## Installation

```bash
pnpm add @rendiv/three three @react-three/fiber
```

Peer dependencies: `react`, `react-dom`, `@rendiv/core`, `three`, `@react-three/fiber`.

## Basic Usage

```tsx
import React, { useRef } from 'react';
import { useFrame, interpolate, Fill } from '@rendiv/core';
import { ThreeCanvas } from '@rendiv/three';
import * as THREE from 'three';

function SpinningCube(): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null);
  const frame = useFrame(); // rendiv's useFrame — returns the frame number

  if (meshRef.current) {
    meshRef.current.rotation.y = interpolate(frame, [0, 90], [0, Math.PI * 2]);
  }

  return (
    <mesh ref={meshRef}>
      <boxGeometry args={[2, 2, 2]} />
      <meshStandardMaterial color="#6bd4ff" />
    </mesh>
  );
}

export function My3DScene(): React.ReactElement {
  return (
    <Fill style={{ backgroundColor: '#0a0a1a' }}>
      <ThreeCanvas camera={{ position: [0, 2, 5], fov: 50 }} style={{ width: 1920, height: 1080 }}>
        <ambientLight intensity={0.5} />
        <directionalLight position={[5, 5, 5]} />
        <SpinningCube />
      </ThreeCanvas>
    </Fill>
  );
}
```

## `<ThreeCanvas>` Props

| Prop | Type | Default | Description |
|---|---|---|---|
| `children` | `ReactNode` | (required) | R3F scene graph (meshes, lights, helpers, etc.) |
| `style` | `CSSProperties` | — | Container style. Set `width`/`height` to match composition dimensions. |
| `className` | `string` | — | Container class name. |
| `camera` | R3F camera config | — | Pass-through to R3F `<Canvas camera={...}>`. |
| `gl` | R3F gl config | — | Pass-through to R3F `<Canvas gl={...}>`. |

## Critical: `useFrame` Naming Conflict

Both rendiv and R3F export a hook called `useFrame`, but they do completely
different things:

| Hook | Source | Returns | Use in rendiv? |
|---|---|---|---|
| `useFrame()` | `@rendiv/core` | Current frame number (`number`) | **YES** — use this one |
| `useFrame()` | `@react-three/fiber` | Callback-based animation loop | **NO** — runs on wall-clock time, will desync during rendering |

**Always import `useFrame` from `@rendiv/core`** inside rendiv compositions.
Never use R3F's `useFrame` — it is time-based and does not respect rendiv's
frame-by-frame rendering pipeline.

```tsx
// CORRECT
import { useFrame } from '@rendiv/core';

// WRONG — will desync during rendering
import { useFrame } from '@react-three/fiber';
```

## How It Works

### Context bridging

R3F's `<Canvas>` creates a **separate React reconciler** (its own React tree).
This means rendiv's contexts (`TimelineContext`, `SequenceContext`, etc.) are not
automatically available inside the Canvas.

`<ThreeCanvas>` solves this by:
1. Reading all rendiv contexts **outside** the Canvas.
2. Re-providing them **inside** the Canvas via `<RendivContextBridge>`.

This means `useFrame()`, `useCompositionConfig()`, and all other rendiv hooks
work normally inside `<ThreeCanvas>` children.

### Render mode

During rendering (`rendiv render`):
- `frameloop` is set to `"never"` — R3F does not run its own animation loop.
- An internal `<FrameAdvancer>` component calls `advance()` whenever the rendiv
  frame changes, ensuring the 3D scene updates exactly once per captured frame.
- `holdRender()` is called on mount and released once the Canvas is created.

During preview/studio:
- `frameloop` is set to `"always"` for smooth interactive playback.

## Animating 3D Objects

Drive all animations from `useFrame()` (rendiv) + `interpolate()` / `spring()`:

```tsx
import { useRef } from 'react';
import { useFrame, useCompositionConfig, interpolate, spring } from '@rendiv/core';
import * as THREE from 'three';

function AnimatedSphere(): React.ReactElement {
  const meshRef = useRef<THREE.Mesh>(null);
  const frame = useFrame();
  const { fps } = useCompositionConfig();

  const y = interpolate(frame, [0, 60], [-2, 2]);
  const scale = spring({ frame, fps, config: { damping: 10, stiffness: 80 } });

  if (meshRef.current) {
    meshRef.current.position.y = y;
    meshRef.current.scale.setScalar(scale);
  }

  return (
    <mesh ref={meshRef}>
      <sphereGeometry args={[1, 32, 32]} />
      <meshStandardMaterial color="#ff6b6b" />
    </mesh>
  );
}
```

## Using With Sequences

```tsx
import { Sequence } from '@rendiv/core';
import { ThreeCanvas } from '@rendiv/three';

export function Staged3D(): React.ReactElement {
  return (
    <ThreeCanvas camera={{ position: [0, 0, 10] }} style={{ width: 1920, height: 1080 }}>
      <ambientLight />
      <Sequence from={0} durationInFrames={60}>
        <SpinningCube />
      </Sequence>
      <Sequence from={60} durationInFrames={60}>
        <AnimatedSphere />
      </Sequence>
    </ThreeCanvas>
  );
}
```

Sequences work inside `<ThreeCanvas>` because the context bridge ensures
`SequenceContext` is available to children.

## Tips

- **Set explicit dimensions** on `<ThreeCanvas>` via `style` to match your composition's `width`/`height`.
- **Mutate refs directly** instead of using React state for per-frame updates — this avoids re-renders for every frame.
- **Use `@react-three/drei`** for additional helpers (OrbitControls, Text3D, etc.) — install as a separate dependency.
- **Avoid R3F's time-based hooks** (`useFrame` from fiber, `Clock`). Derive all motion from rendiv's frame number.
