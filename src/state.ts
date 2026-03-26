import { scheduleEffect } from './scheduler';

/** Function that can be used as an effect runner */
type EffectRunner = () => void;

/** Updater can be a direct value or a function receiving the previous value */
type Updater<T> = T | ((prev: T) => T);

/** Reactive state container returned by createState */
export interface State<T> {
  /** Get the current value. Auto-tracks if called inside an effect. */
  get(): T;
  /** Set a new value. Accepts a value or updater function. Skips if Object.is(old, new). */
  set(value: Updater<T>): void;
  /** Manually subscribe to state changes. Returns an unsubscribe function. */
  subscribe(fn: EffectRunner): () => void;
  /** @internal — Subscriber set for internal use by effects */
  _subscribers: Set<EffectRunner>;
}

/** Currently running effect for auto-tracking */
let currentEffect: EffectRunner | null = null;

/**
 * Sets the currently running effect for auto-tracking.
 * @internal
 */
export function setCurrentEffect(effect: EffectRunner | null): void {
  currentEffect = effect;
}

/**
 * Returns the currently running effect.
 * @internal
 */
export function getCurrentEffect(): EffectRunner | null {
  return currentEffect;
}

/**
 * Creates a reactive state container.
 *
 * @template T - The type of the state value.
 * @param initialValue - The initial state value.
 * @returns A reactive state object with get, set, and subscribe methods.
 *
 * @example
 * ```ts
 * const count = createState(0);
 * count.get();           // 0
 * count.set(5);          // updates to 5
 * count.set(v => v + 1); // updates to 6
 *
 * const unsub = count.subscribe(() => console.log('changed!'));
 * unsub(); // stop listening
 * ```
 */
export function createState<T>(initialValue: T): State<T> {
  let value: T = initialValue;
  const subscribers = new Set<EffectRunner>();

  function get(): T {
    if (currentEffect) {
      subscribers.add(currentEffect);
    }
    return value;
  }

  function set(nextValue: Updater<T>): void {
    const newValue =
      typeof nextValue === 'function'
        ? (nextValue as (prev: T) => T)(value)
        : nextValue;
    if (Object.is(value, newValue)) return;
    value = newValue;
    for (const subscriber of subscribers) {
      scheduleEffect(subscriber);
    }
  }

  function subscribe(fn: EffectRunner): () => void {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  return { get, set, subscribe, _subscribers: subscribers };
}
