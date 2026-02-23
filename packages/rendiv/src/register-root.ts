import type { ComponentType } from 'react';

let rootComponent: ComponentType | null = null;
let version = 0;

const listeners = new Set<() => void>();

export function setRootComponent(component: ComponentType): void {
  rootComponent = component;
  version++;
  listeners.forEach((fn) => fn());
}

export function getRootComponent(): ComponentType | null {
  return rootComponent;
}

/** Returns a monotonically increasing version that bumps on each setRootComponent call. */
export function getRootComponentVersion(): number {
  return version;
}

/** Subscribe to root component changes. Returns an unsubscribe function. */
export function onRootComponentChange(fn: () => void): () => void {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
