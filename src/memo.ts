import { createEffect } from './effect';
import { createState, type State } from './state';

/** Read-only reactive computed value returned by createMemo */
export interface Memo<T> {
  /** Get the current computed value. */
  get(): T;
  /** Subscribe to changes of the computed value. */
  subscribe: State<T>['subscribe'];
  /** @internal */
  _subscribers: State<T>['_subscribers'];
}

/** A reactive dependency */
type Dependency = Pick<State<unknown>, 'subscribe' | '_subscribers'>;

/**
 * Creates a memoized computed value that only recalculates when dependencies change.
 *
 * @template T - The type of the computed value.
 * @param fn - Computation function.
 * @param deps - Reactive dependencies to watch.
 * @returns A read-only reactive memo with a `get()` method.
 *
 * @example
 * ```ts
 * const count = createState(2);
 * const doubled = createMemo(() => count.get() * 2, [count]);
 * doubled.get(); // 4
 *
 * count.set(10);
 * // after microtask:
 * doubled.get(); // 20
 * ```
 */
export function createMemo<T>(fn: () => T, deps: Dependency[]): Memo<T> {
  const internal = createState<T>(fn());

  createEffect(() => {
    internal.set(fn());
  }, deps);

  return {
    get: internal.get,
    subscribe: internal.subscribe,
    _subscribers: internal._subscribers,
  };
}
