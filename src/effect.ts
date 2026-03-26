import { setCurrentEffect, type State } from './state';

/** Cleanup function returned by an effect */
type CleanupFn = () => void;

/** Effect function that optionally returns a cleanup */
type EffectFn = () => CleanupFn | void;

/** A reactive dependency (anything with subscribe and _subscribers) */
type Dependency = Pick<State<unknown>, 'subscribe' | '_subscribers'>;

/**
 * Creates a reactive side-effect that re-runs when dependencies change.
 * Supports cleanup functions (like React's useEffect).
 *
 * @param fn - Effect function. May return a cleanup function.
 * @param deps - Optional array of reactive states to watch.
 * @returns A dispose function to stop the effect and run final cleanup.
 *
 * @example
 * ```ts
 * const count = createState(0);
 *
 * const dispose = createEffect(() => {
 *   console.log('Count:', count.get());
 *   return () => console.log('cleanup');
 * }, [count]);
 *
 * count.set(1); // triggers re-run
 * dispose();    // stop listening, run cleanup
 * ```
 */
export function createEffect(fn: EffectFn, deps?: Dependency[]): () => void {
  let cleanup: CleanupFn | void = undefined;

  function run(): void {
    if (typeof cleanup === 'function') {
      cleanup();
      cleanup = undefined;
    }
    setCurrentEffect(run);
    try {
      cleanup = fn();
    } finally {
      setCurrentEffect(null);
    }
  }

  // Subscribe to explicit dependencies
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
  return (): void => {
    if (typeof cleanup === 'function') {
      cleanup();
      cleanup = undefined;
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
