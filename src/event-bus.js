/**
 * Creates an event bus for pub/sub communication between decoupled parts of an app.
 *
 * @returns {{
 *   on: (event: string, handler: Function) => () => void,
 *   off: (event: string, handler: Function) => void,
 *   emit: (event: string, data?: any) => void,
 *   once: (event: string, handler: Function) => () => void,
 *   clear: () => void
 * }}
 *
 * @example
 * const bus = createEventBus();
 * bus.on('user:login', (data) => console.log(data));
 * bus.emit('user:login', { name: 'Bruno' });
 */
export function createEventBus() {
  /** @type {Map<string, Set<Function>>} */
  const listeners = new Map();

  /**
   * Subscribe to an event.
   * @param {string} event - Event name.
   * @param {Function} handler - Callback function.
   * @returns {() => void} Unsubscribe function.
   */
  function on(event, handler) {
    if (!listeners.has(event)) {
      listeners.set(event, new Set());
    }
    listeners.get(event).add(handler);
    return () => off(event, handler);
  }

  /**
   * Unsubscribe from an event.
   * @param {string} event - Event name.
   * @param {Function} handler - The handler to remove.
   */
  function off(event, handler) {
    const handlers = listeners.get(event);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) listeners.delete(event);
    }
  }

  /**
   * Emit an event with optional data.
   * @param {string} event - Event name.
   * @param {*} [data] - Data to pass to handlers.
   */
  function emit(event, data) {
    const handlers = listeners.get(event);
    if (handlers) {
      for (const handler of handlers) {
        handler(data);
      }
    }
  }

  /**
   * Subscribe to an event, but only fire once.
   * @param {string} event - Event name.
   * @param {Function} handler - Callback function.
   * @returns {() => void} Unsubscribe function.
   */
  function once(event, handler) {
    const wrapper = (data) => {
      handler(data);
      off(event, wrapper);
    };
    return on(event, wrapper);
  }

  /**
   * Remove all listeners for all events.
   */
  function clear() {
    listeners.clear();
  }

  return { on, off, emit, once, clear };
}
