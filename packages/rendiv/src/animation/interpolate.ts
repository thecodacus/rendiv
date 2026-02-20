import type { EasingFunction } from './easing';

export type ExtrapolationType = 'extend' | 'clamp' | 'identity';

export interface InterpolateOptions {
  easing?: EasingFunction;
  extrapolateLeft?: ExtrapolationType;
  extrapolateRight?: ExtrapolationType;
}

function findSegment(
  input: number,
  inputRange: readonly number[]
): number {
  for (let i = 1; i < inputRange.length; i++) {
    if (input <= inputRange[i]) return i - 1;
  }
  return inputRange.length - 2;
}

function interpolateSegment(
  input: number,
  inputMin: number,
  inputMax: number,
  outputMin: number,
  outputMax: number,
  easing: EasingFunction | undefined
): number {
  let t: number;
  if (inputMin === inputMax) {
    t = 0;
  } else {
    t = (input - inputMin) / (inputMax - inputMin);
  }

  if (easing) {
    t = easing(t);
  }

  return outputMin + t * (outputMax - outputMin);
}

export function interpolate(
  input: number,
  inputRange: readonly number[],
  outputRange: readonly number[],
  options?: InterpolateOptions
): number {
  if (inputRange.length !== outputRange.length) {
    throw new Error(
      `inputRange (${inputRange.length}) and outputRange (${outputRange.length}) must have the same length.`
    );
  }
  if (inputRange.length < 2) {
    throw new Error('inputRange and outputRange must have at least 2 elements.');
  }
  for (let i = 1; i < inputRange.length; i++) {
    if (inputRange[i] < inputRange[i - 1]) {
      throw new Error('inputRange must be monotonically non-decreasing.');
    }
  }

  const {
    easing,
    extrapolateLeft = 'extend',
    extrapolateRight = 'extend',
  } = options ?? {};

  // Handle values below the input range
  if (input < inputRange[0]) {
    if (extrapolateLeft === 'clamp') {
      return outputRange[0];
    }
    if (extrapolateLeft === 'identity') {
      return input;
    }
    // extend: extrapolate from the first segment
    return interpolateSegment(
      input,
      inputRange[0],
      inputRange[1],
      outputRange[0],
      outputRange[1],
      easing
    );
  }

  // Handle values above the input range
  if (input > inputRange[inputRange.length - 1]) {
    if (extrapolateRight === 'clamp') {
      return outputRange[outputRange.length - 1];
    }
    if (extrapolateRight === 'identity') {
      return input;
    }
    // extend: extrapolate from the last segment
    const last = inputRange.length - 1;
    return interpolateSegment(
      input,
      inputRange[last - 1],
      inputRange[last],
      outputRange[last - 1],
      outputRange[last],
      easing
    );
  }

  // Find the correct segment and interpolate
  const seg = findSegment(input, inputRange);
  return interpolateSegment(
    input,
    inputRange[seg],
    inputRange[seg + 1],
    outputRange[seg],
    outputRange[seg + 1],
    easing
  );
}
