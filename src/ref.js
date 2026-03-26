/**
 * Creates a mutable reference that does NOT trigger reactivity.
 * Useful for storing DOM elements or mutable values that shouldn't cause re-renders.
 *
 * @template T
 * @param {T} initialValue
 * @returns {{ current: T }}
 *
 * @example
 * const inputRef = createRef(null);
 * inputRef.current = document.getElementById('input');
 */
export function createRef(initialValue) {
  return { current: initialValue };
}
