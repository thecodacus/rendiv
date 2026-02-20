let handleCounter = 0;
const pendingHandles = new Map<number, string>();

export function holdRender(label?: string): number {
  const handle = ++handleCounter;
  pendingHandles.set(handle, label ?? `Handle ${handle}`);
  return handle;
}

export function releaseRender(handle: number): void {
  if (!pendingHandles.has(handle)) {
    throw new Error(
      `releaseRender() was called with handle ${handle}, but no corresponding holdRender() exists.`
    );
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
  return Array.from(pendingHandles.values());
}
