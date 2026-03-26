import { describe, it, expect } from 'vitest';
import { createState } from '../src/state';
import { createMemo } from '../src/memo';

describe('createMemo', () => {
  it('should compute initial value', () => {
    const count = createState(5);
    const doubled = createMemo(() => count.get() * 2, [count]);
    expect(doubled.get()).toBe(10);
  });

  it('should recompute when dependency changes', async () => {
    const count = createState(3);
    const doubled = createMemo(() => count.get() * 2, [count]);

    expect(doubled.get()).toBe(6);

    count.set(10);
    await new Promise((r) => setTimeout(r, 10));
    expect(doubled.get()).toBe(20);
  });

  it('should work with multiple dependencies', async () => {
    const a = createState(2);
    const b = createState(3);
    const sum = createMemo(() => a.get() + b.get(), [a, b]);

    expect(sum.get()).toBe(5);

    a.set(10);
    await new Promise((r) => setTimeout(r, 10));
    expect(sum.get()).toBe(13);
  });

  it('should work with string concatenation', () => {
    const first = createState('Hello');
    const last = createState('World');
    const full = createMemo(() => `${first.get()} ${last.get()}`, [first, last]);
    expect(full.get()).toBe('Hello World');
  });

  it('should work with complex computations', () => {
    const items = createState([1, 2, 3, 4, 5]);
    const total = createMemo(() => items.get().reduce((a, b) => a + b, 0), [items]);
    expect(total.get()).toBe(15);
  });
});
