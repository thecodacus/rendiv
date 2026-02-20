import type { ComponentType } from 'react';

let rootComponent: ComponentType | null = null;

export function setRootComponent(component: ComponentType): void {
  if (rootComponent !== null) {
    throw new Error('setRootComponent() can only be called once.');
  }
  rootComponent = component;
}

export function getRootComponent(): ComponentType | null {
  return rootComponent;
}
