export interface SpringConfig {
  damping?: number;
  mass?: number;
  stiffness?: number;
  clampOvershoot?: boolean;
}

export interface SpringOptions {
  frame: number;
  fps: number;
  config?: SpringConfig;
  from?: number;
  to?: number;
  durationInFrames?: number;
  durationRestThreshold?: number;
}

function springStep(
  position: number,
  velocity: number,
  target: number,
  stiffness: number,
  damping: number,
  mass: number,
  dt: number
): { position: number; velocity: number } {
  // Damped harmonic oscillator using semi-implicit Euler integration
  const springForce = -stiffness * (position - target);
  const dampingForce = -damping * velocity;
  const acceleration = (springForce + dampingForce) / mass;

  const newVelocity = velocity + acceleration * dt;
  const newPosition = position + newVelocity * dt;

  return { position: newPosition, velocity: newVelocity };
}

export function spring(options: SpringOptions): number {
  const {
    frame,
    fps,
    config = {},
    from = 0,
    to = 1,
    durationInFrames,
    durationRestThreshold = 0.005,
  } = options;

  const {
    damping = 10,
    mass = 1,
    stiffness = 100,
    clampOvershoot = false,
  } = config;

  if (frame < 0) return from;

  if (durationInFrames !== undefined && frame >= durationInFrames) {
    return to;
  }

  // Simulate the spring from frame 0 up to the requested frame
  // Using sub-steps for accuracy (4 sub-steps per frame)
  const dt = 1 / fps;
  const subSteps = 4;
  const subDt = dt / subSteps;

  let position = from;
  let velocity = 0;

  for (let f = 0; f < frame; f++) {
    for (let s = 0; s < subSteps; s++) {
      const result = springStep(position, velocity, to, stiffness, damping, mass, subDt);
      position = result.position;
      velocity = result.velocity;
    }

    if (clampOvershoot) {
      if (from < to) {
        position = Math.min(position, to);
      } else {
        position = Math.max(position, to);
      }
      if (position === to) velocity = 0;
    }

    // Early termination if settled
    if (
      Math.abs(position - to) < durationRestThreshold &&
      Math.abs(velocity) < durationRestThreshold
    ) {
      return to;
    }
  }

  return position;
}
