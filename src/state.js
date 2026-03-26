import { scheduleEffect } from './scheduler.js';

/** @type {Function|null} */
let currentEffect = null;

/**
 * Sets the currently running effect for auto-tracking.
 * @param {Function|null} effect
 */
export function setCurrentEffect(effect) {
  currentEffect = effect;
}

/**
 * Returns the currently running effect.
 * @returns {Function|null}
 */
export function getCurrentEffect() {
  return currentEffect;
}

/**
 * Creates a reactive state container.
 *
 * @template T
 * @param {T} initialValue - The initial state value.
 * @returns {{
 *   get: () => T,
 *   set: (value: T | ((prev: T) => T)) => void,
 *   subscribe: (fn: (value: T) => void) => () => void,
 *   _subscribers: Set<Function>
 * }}
 *
 * @example
 * const count = createState(0);
 * count.get();           // 0
 * count.set(5);          // updates to 5
 * count.set(v => v + 1); // updates to 6
 */
export function createState(initialValue) {
  let value = initialValue;
  const subscribers = new Set();

  function get() {
    if (currentEffect) {
      subscribers.add(currentEffect);
    }
    return value;
  }

  function set(nextValue) {
    const newValue = typeof nextValue === 'function' ? nextValue(value) : nextValue;
    if (Object.is(value, newValue)) return;
    value = newValue;
    for (const subscriber of subscribers) {
      scheduleEffect(subscriber);
    }
  }

  function subscribe(fn) {
    subscribers.add(fn);
    return () => subscribers.delete(fn);
  }

  return { get, set, subscribe, _subscribers: subscribers };
}
