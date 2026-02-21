# @rendiv/three

Embed frame-accurate 3D scenes in rendiv compositions using [React Three Fiber](https://docs.pmnd.rs/react-three-fiber) (R3F) and [Three.js](https://threejs.org/).

## Installation

```bash
npm install @rendiv/three three @react-three/fiber
```

Peer dependencies: `react`, `react-dom`, `@rendiv/core`, `three`, `@react-three/fiber` (v9+).

## Basic Usage

```tsx
import { useRef } from 'react';
import { useFrame, interpolate, Fill } from '@rendiv/core';
import { ThreeCanvas } from '@rendiv/three';
import * as THREE from 'three';

function SpinningCube() {
  const meshRef = useRef<THREE.Mesh>(null);
  const frame = useFrame();

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

export function My3DScene() {
  return (
    <Fill style={{ backgroundColor: '#0a0a1a' }}>
      <ThreeCanvas
        camera={{ position: [0, 2, 5], fov: 50 }}
        style={{ width: 1920, height: 1080 }}
      >
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
|------|------|---------|-------------|
| `children` | `ReactNode` | required | R3F scene graph (meshes, lights, helpers, etc.) |
| `style` | `CSSProperties` | — | Container style. Set `width`/`height` to match composition dimensions. |
| `className` | `string` | — | Container class name. |
| `camera` | R3F camera config | — | Pass-through to R3F `<Canvas camera={...}>`. |
| `gl` | R3F gl config | — | Pass-through to R3F `<Canvas gl={...}>`. |

## `useFrame` Naming Conflict

::: warning
Both rendiv and R3F export a hook called `useFrame`. They do completely different things.
:::

| Hook | Source | Returns | Use in rendiv? |
|------|--------|---------|----------------|
| `useFrame()` | `@rendiv/core` | Current frame number | **Yes** — use this one |
| `useFrame()` | `@react-three/fiber` | Callback-based animation loop | **No** — runs on wall-clock time |

**Always import `useFrame` from `@rendiv/core`** inside rendiv compositions. R3F's `useFrame` is time-based and will desync during rendering.

```tsx
// Correct
import { useFrame } from '@rendiv/core';

// Wrong — will desync during rendering
import { useFrame } from '@react-three/fiber';
```

## Context Bridging

R3F's `<Canvas>` creates a **separate React reconciler** (its own React tree). This means rendiv's contexts (`TimelineContext`, `SequenceContext`, etc.) are not automatically available inside the Canvas.

`<ThreeCanvas>` solves this by:
1. Reading all rendiv contexts **outside** the Canvas.
2. Re-providing them **inside** the Canvas via an internal `<RendivContextBridge>`.

This means `useFrame()`, `useCompositionConfig()`, and all other rendiv hooks work normally inside `<ThreeCanvas>` children.

## Rendering Behavior

During **rendering** (`rendiv render`):
- `frameloop` is set to `"never"` — R3F does not run its own animation loop.
- On each rendiv frame change, `advance()` is called to update the 3D scene exactly once per captured frame.
- `holdRender()` blocks frame capture until the Canvas is initialized and each frame advance completes.
- `preserveDrawingBuffer` is enabled so headless Chromium screenshots capture the WebGL canvas.

During **preview/studio**:
- `frameloop` is set to `"always"` for smooth interactive playback.

## Animating 3D Objects

Drive all animations from rendiv's `useFrame()` + `interpolate()` / `spring()`:

```tsx
import { useRef } from 'react';
import { useFrame, useCompositionConfig, interpolate, spring } from '@rendiv/core';
import * as THREE from 'three';

function AnimatedSphere() {
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

::: tip
**Mutate refs directly** instead of using React state for per-frame updates — this avoids re-renders for every frame.
:::

## Using With Sequences

```tsx
import { Sequence } from '@rendiv/core';
import { ThreeCanvas } from '@rendiv/three';

export function Staged3D() {
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

Sequences work inside `<ThreeCanvas>` because the context bridge ensures `SequenceContext` is available to children.

## Tips

- **Set explicit dimensions** on `<ThreeCanvas>` via `style` to match your composition's `width`/`height`.
- **Use `@react-three/drei`** for additional helpers (OrbitControls, Text3D, Environment, etc.) — install as a separate dependency.
- **Avoid R3F's time-based hooks** (`useFrame` from fiber, `Clock`). Derive all motion from rendiv's frame number.
- **Requires R3F v9+** for React 19 compatibility.
