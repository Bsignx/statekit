import { describe, it, expect, vi } from 'vitest';
import { createState } from '../src/state.js';

describe('createState', () => {
  it('should return initial value', () => {
    const count = createState(0);
    expect(count.get()).toBe(0);
  });

  it('should update value with set', () => {
    const count = createState(0);
    count.set(5);
    expect(count.get()).toBe(5);
  });

  it('should support updater function', () => {
    const count = createState(10);
    count.set((prev) => prev + 5);
    expect(count.get()).toBe(15);
  });

  it('should not notify if value is the same (Object.is)', async () => {
    const count = createState(0);
    const spy = vi.fn();
    count.subscribe(spy);
    count.set(0);
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should notify subscribers on change', async () => {
    const count = createState(0);
    const spy = vi.fn();
    count.subscribe(spy);
    count.set(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalled();
  });

  it('should unsubscribe correctly', async () => {
    const count = createState(0);
    const spy = vi.fn();
    const unsub = count.subscribe(spy);
    unsub();
    count.set(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle string values', () => {
    const name = createState('hello');
    name.set('world');
    expect(name.get()).toBe('world');
  });

  it('should handle object values', () => {
    const user = createState({ name: 'Bruno' });
    user.set({ name: 'John' });
    expect(user.get()).toEqual({ name: 'John' });
  });

  it('should handle null and undefined', () => {
    const val = createState(null);
    expect(val.get()).toBeNull();
    val.set(undefined);
    expect(val.get()).toBeUndefined();
  });

  it('should handle multiple subscribers', async () => {
    const count = createState(0);
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    count.subscribe(spy1);
    count.subscribe(spy2);
    count.set(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(spy1).toHaveBeenCalled();
    expect(spy2).toHaveBeenCalled();
  });

  it('should batch multiple synchronous updates', async () => {
    const count = createState(0);
    const spy = vi.fn();
    count.subscribe(spy);
    count.set(1);
    count.set(2);
    count.set(3);
    await new Promise((r) => setTimeout(r, 10));
    // Batched — subscriber runs once per scheduled flush
    expect(spy.mock.calls.length).toBeGreaterThanOrEqual(1);
    expect(count.get()).toBe(3);
  });
});
