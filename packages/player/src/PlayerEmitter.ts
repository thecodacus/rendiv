export type PlayerEventMap = {
  play: void;
  pause: void;
  ended: void;
  frameupdate: { frame: number };
  error: { error: Error };
  fullscreenchange: { isFullscreen: boolean };
};

type Listener<T> = (data: T) => void;

export class PlayerEmitter {
  private listeners = new Map<string, Set<Listener<unknown>>>();

  addEventListener<K extends keyof PlayerEventMap>(
    event: K,
    callback: Listener<PlayerEventMap[K]>
  ): void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback as Listener<unknown>);
  }

  removeEventListener<K extends keyof PlayerEventMap>(
    event: K,
    callback: Listener<PlayerEventMap[K]>
  ): void {
    this.listeners.get(event)?.delete(callback as Listener<unknown>);
  }

  emit<K extends keyof PlayerEventMap>(
    event: K,
    ...args: PlayerEventMap[K] extends void ? [] : [PlayerEventMap[K]]
  ): void {
    const listeners = this.listeners.get(event);
    if (!listeners) return;
    const data = args[0] as PlayerEventMap[K];
    for (const listener of listeners) {
      listener(data);
    }
  }
}
