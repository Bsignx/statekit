/** A mutable reference container that does NOT trigger reactivity. */
export interface Ref<T> {
  current: T;
}

/**
 * Creates a mutable reference that does NOT trigger reactivity.
 * Useful for storing DOM elements or mutable values that shouldn't cause re-renders.
 *
 * @template T - The type of the referenced value.
 * @param initialValue - The initial value.
 * @returns A ref object with a `current` property.
 *
 * @example
 * ```ts
 * const inputRef = createRef<HTMLInputElement | null>(null);
 * inputRef.current = document.querySelector('input');
 *
 * const timerRef = createRef<number>(0);
 * timerRef.current = setInterval(() => console.log('tick'), 1000);
 * ```
 */
export function createRef<T>(initialValue: T): Ref<T> {
  return { current: initialValue };
}
