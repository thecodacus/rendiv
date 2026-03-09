/**
 * Calculates the total extra frames needed to stagger `count` units
 * with `delayFrames` between each.
 *
 * Useful for computing durationInFrames of a Sequence containing AnimatedText.
 */
export function stagger(count: number, delayFrames: number): number {
  return (count - 1) * delayFrames;
}
