declare global {
  interface Window {
    __RENDIV_INPUT_PROPS__?: Record<string, unknown>;
  }
}

export function getInputProps<T = Record<string, unknown>>(): T {
  if (typeof window !== 'undefined' && window.__RENDIV_INPUT_PROPS__) {
    return window.__RENDIV_INPUT_PROPS__ as T;
  }
  return {} as T;
}
