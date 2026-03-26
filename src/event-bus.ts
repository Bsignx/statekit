/** Handler function for event bus listeners */
type EventHandler<T = unknown> = (data: T) => void;

/** Event bus instance for pub/sub communication */
export interface EventBus {
  /** Subscribe to an event. Returns an unsubscribe function. */
  on<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  /** Unsubscribe a specific handler from an event. */
  off<T = unknown>(event: string, handler: EventHandler<T>): void;
  /** Emit an event with optional data to all subscribers. */
  emit<T = unknown>(event: string, data?: T): void;
  /** Subscribe to an event, auto-remove after first call. Returns an unsubscribe function. */
  once<T = unknown>(event: string, handler: EventHandler<T>): () => void;
  /** Remove all listeners for all events. */
  clear(): void;
}

/**
 * Creates an event bus for pub/sub communication between decoupled parts of an app.
 *
 * @returns An EventBus instance with on, off, emit, once, and clear methods.
 *
 * @example
 * ```ts
 * const bus = createEventBus();
 *
 * // Type-safe events
 * bus.on<{ name: string }>('user:login', (data) => {
 *   console.log(data.name); // typed!
 * });
 *
 * bus.emit('user:login', { name: 'Bruno' });
 *
 * // One-time listener
 * bus.once('app:ready', () => console.log('Ready!'));
 *
 * // Clean up everything
 * bus.clear();
 * ```
 */
export function createEventBus(): EventBus {
  const listeners = new Map<string, Set<EventHandler>>();

  function on<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event)!.add(handler as EventHandler);
    return () => off(event, handler);
  }

  function off<T = unknown>(event: string, handler: EventHandler<T>): void {
    const handlers = listeners.get(event);
    if (handlers) {
      handlers.delete(handler as EventHandler);
      if (handlers.size === 0) listeners.delete(event);
    }
  }

  function emit<T = unknown>(event: string, data?: T): void {
    const handlers = listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }

  function once<T = unknown>(event: string, handler: EventHandler<T>): () => void {
    const wrapper: EventHandler<T> = (data: T) => {
      handler(data);
      off(event, wrapper);
    };
    return on(event, wrapper);
  }

  function clear(): void {
    listeners.clear();
  }

  return { on, off, emit, once, clear };
}
