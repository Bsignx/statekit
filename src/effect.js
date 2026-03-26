import { setCurrentEffect } from './state.js';

/**
 * Creates a reactive side-effect that re-runs when dependencies change.
 *
 * @param {() => (() => void) | void} fn - Effect function. May return a cleanup function.
 * @param {Array<{ get: Function, subscribe?: Function, _subscribers?: Set }>} [deps] - Reactive states to track.
 * @returns {() => void} Dispose function to stop the effect.
 *
 * @example
 * const count = createState(0);
 * const dispose = createEffect(() => {
 *   console.log('Count:', count.get());
 *   return () => console.log('cleanup');
 * }, [count]);
 *
 * // Later: stop listening
 * dispose();
 */
export function createEffect(fn, deps) {
  let cleanup = null;

  function run() {
    if (typeof cleanup === 'function') {
      cleanup();
      cleanup = null;
    }
    setCurrentEffect(run);
    try {
      cleanup = fn();
    } finally {
      setCurrentEffect(null);
    }
  }

  if (deps && deps.length > 0) {
    for (const dep of deps) {
      if (dep && dep.subscribe) {
        dep.subscribe(run);
      }
    }
  }

  // Run immediately
  run();

  // Return dispose function
  return () => {
    if (typeof cleanup === 'function') {
      cleanup();
      cleanup = null;
    }
    if (deps) {
      for (const dep of deps) {
        if (dep && dep._subscribers) {
          dep._subscribers.delete(run);
        }
      }
    }
  };
}
