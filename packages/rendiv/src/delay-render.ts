export interface HoldRenderOptions {
  timeoutInMilliseconds?: number;
}

interface HoldEntry {
  label: string;
  timeoutId: ReturnType<typeof setTimeout> | null;
}

let handleCounter = 0;
const pendingHandles = new Map<number, HoldEntry>();

export function holdRender(
  label?: string,
  options?: HoldRenderOptions,
): number {
  const handle = ++handleCounter;
  const resolvedLabel = label ?? `Handle ${handle}`;
  const { timeoutInMilliseconds } = options ?? {};

  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  if (timeoutInMilliseconds !== undefined && timeoutInMilliseconds > 0) {
    timeoutId = setTimeout(() => {
      if (pendingHandles.has(handle)) {
        pendingHandles.delete(handle);
        throw new Error(
          `holdRender() timed out after ${timeoutInMilliseconds}ms (label: "${resolvedLabel}"). ` +
            `You can increase the timeout by passing a larger timeoutInMilliseconds to holdRender().`,
        );
      }
    }, timeoutInMilliseconds);
  }

  pendingHandles.set(handle, { label: resolvedLabel, timeoutId });
  return handle;
}

export function releaseRender(handle: number): void {
  const entry = pendingHandles.get(handle);
  if (!entry) {
    throw new Error(
      `releaseRender() was called with handle ${handle}, but no corresponding holdRender() exists.`,
    );
  }
  if (entry.timeoutId !== null) {
    clearTimeout(entry.timeoutId);
  }
  pendingHandles.delete(handle);
}

export function abortRender(message: string): void {
  throw new Error(`Render cancelled: ${message}`);
}

export function getPendingHoldCount(): number {
  return pendingHandles.size;
}

export function getPendingHoldLabels(): string[] {
  return Array.from(pendingHandles.values()).map((entry) => entry.label);
}

/** Reset all pending holds. For testing only. */
export function _resetPendingHolds(): void {
  for (const [, entry] of pendingHandles) {
    if (entry.timeoutId !== null) {
      clearTimeout(entry.timeoutId);
    }
  }
  pendingHandles.clear();
  handleCounter = 0;
}
