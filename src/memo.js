import { createEffect } from './effect.js';
import { createState } from './state.js';

/**
 * Creates a memoized computed value that only recalculates when dependencies change.
 *
 * @template T
 * @param {() => T} fn - Computation function.
 * @param {Array<{ get: Function }>} deps - Reactive dependencies.
 * @returns {{ get: () => T, subscribe: Function, _subscribers: Set<Function> }}
 *
 * @example
 * const count = createState(2);
 * const doubled = createMemo(() => count.get() * 2, [count]);
 * doubled.get(); // 4
 */
export function createMemo(fn, deps) {
  const internal = createState(fn());

  createEffect(() => {
    internal.set(fn());
  }, deps);

  return {
    get: internal.get,
    subscribe: internal.subscribe,
    _subscribers: internal._subscribers,
  };
}
