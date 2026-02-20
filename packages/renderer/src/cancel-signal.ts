export interface CancelSignal {
  signal: AbortSignal;
  cancel: () => void;
}

export function makeCancelSignal(): CancelSignal {
  const controller = new AbortController();
  return {
    signal: controller.signal,
    cancel: () => controller.abort(),
  };
}
