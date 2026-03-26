const pendingEffects = new Set();
let isFlushing = false;

/**
 * Schedules an effect to run in the next microtask.
 * Batches multiple state changes into a single flush.
 * @param {Function} effect
 */
export function scheduleEffect(effect) {
  pendingEffects.add(effect);
  if (!isFlushing) {
    isFlushing = true;
    queueMicrotask(flush);
  }
}

function flush() {
  for (const effect of pendingEffects) {
    effect();
  }
  pendingEffects.clear();
  isFlushing = false;
}
