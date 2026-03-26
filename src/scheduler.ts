type EffectFn = () => void;

const pendingEffects = new Set<EffectFn>();
let isFlushing = false;

/**
 * Schedules an effect to run in the next microtask.
 * Batches multiple state changes into a single flush.
 */
export function scheduleEffect(effect: EffectFn): void {
  pendingEffects.add(effect);
  if (!isFlushing) {
    isFlushing = true;
    queueMicrotask(flush);
  }
}

function flush(): void {
  for (const effect of pendingEffects) {
    effect();
  }
  pendingEffects.clear();
  isFlushing = false;
}
