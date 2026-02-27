/**
 * Compute the start frame for every loop iteration that a media component
 * should register audio for.  When the component is not inside a Loop,
 * returns a single-element array with the base offset.
 *
 * For nested Loops the result is the Cartesian product of all layers'
 * iteration offsets, capped at the composition duration.
 */
export function computeLoopStartFrames(
  baseOffset: number,
  loopStack: Array<{ durationInFrames: number; iterations: number }> | undefined,
  compositionDuration: number,
): number[] {
  if (!loopStack || loopStack.length === 0) return [baseOffset];

  let offsets = [0];
  for (const layer of loopStack) {
    const iter = layer.iterations === Infinity
      ? Math.ceil(compositionDuration / layer.durationInFrames)
      : layer.iterations;
    const newOffsets: number[] = [];
    for (const existing of offsets) {
      for (let i = 0; i < iter; i++) {
        const offset = existing + i * layer.durationInFrames;
        if (baseOffset + offset >= compositionDuration) break;
        newOffsets.push(offset);
      }
    }
    offsets = newOffsets;
  }

  return offsets.map((o) => baseOffset + o);
}
