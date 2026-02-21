import { readPath, writePath } from './read-path';

/**
 * Morph between two SVG paths by interpolating their segment coordinates.
 *
 * Both paths must have the same number of segments and matching command types.
 * Use shapes from `@rendiv/shapes` that produce compatible segment structures
 * (e.g. two polygons with the same number of sides).
 *
 * @param progress - Value from 0 (fully `from`) to 1 (fully `to`)
 * @param from - Starting SVG path `d` string
 * @param to - Ending SVG path `d` string
 * @returns Interpolated SVG path `d` string
 */
export function morphPath(progress: number, from: string, to: string): string {
  const segA = readPath(from);
  const segB = readPath(to);

  if (segA.length !== segB.length) {
    throw new Error(
      `morphPath: paths must have the same number of segments. ` +
      `"from" has ${segA.length}, "to" has ${segB.length}.`,
    );
  }

  const p = Math.max(0, Math.min(1, progress));
  const result = segA.map((a, i) => {
    const b = segB[i];

    if (a.command !== b.command) {
      throw new Error(
        `morphPath: segment ${i} command mismatch: "${a.command}" vs "${b.command}".`,
      );
    }

    if (a.values.length !== b.values.length) {
      throw new Error(
        `morphPath: segment ${i} ("${a.command}") has mismatched value counts: ` +
        `${a.values.length} vs ${b.values.length}.`,
      );
    }

    const values = a.values.map((va, j) => va + (b.values[j] - va) * p);
    return { command: a.command, values };
  });

  return writePath(result);
}
