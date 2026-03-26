import { describe, it, expect, vi } from 'vitest';
import { createState } from '../src/state.js';
import { createEffect } from '../src/effect.js';

describe('createEffect', () => {
  it('should run immediately', () => {
    const spy = vi.fn();
    createEffect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should re-run when dependency changes', async () => {
    const count = createState(0);
    const spy = vi.fn();
    createEffect(() => {
      spy(count.get());
    }, [count]);

    expect(spy).toHaveBeenCalledWith(0);

    count.set(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalledWith(1);
  });

  it('should run cleanup before re-running', async () => {
    const count = createState(0);
    const cleanupSpy = vi.fn();

    createEffect(() => {
      count.get();
      return () => cleanupSpy();
    }, [count]);

    count.set(1);
    await new Promise((r) => setTimeout(r, 10));
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  it('should dispose and run cleanup', () => {
    const cleanupSpy = vi.fn();
    const dispose = createEffect(() => {
      return () => cleanupSpy();
    });

    dispose();
    expect(cleanupSpy).toHaveBeenCalledTimes(1);
  });

  it('should stop reacting after dispose', async () => {
    const count = createState(0);
    const spy = vi.fn();

    const dispose = createEffect(() => {
      spy(count.get());
    }, [count]);

    dispose();
    count.set(1);
    await new Promise((r) => setTimeout(r, 10));
    // Only the initial call
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should support multiple dependencies', async () => {
    const a = createState(1);
    const b = createState(2);
    const spy = vi.fn();

    createEffect(() => {
      spy(a.get() + b.get());
    }, [a, b]);

    expect(spy).toHaveBeenCalledWith(3);

    a.set(10);
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalledWith(12);

    b.set(20);
    await new Promise((r) => setTimeout(r, 10));
    expect(spy).toHaveBeenCalledWith(30);
  });

  it('should handle effect with no deps (runs once)', () => {
    const spy = vi.fn();
    createEffect(spy);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should handle effect with empty deps array', () => {
    const spy = vi.fn();
    createEffect(spy, []);
    expect(spy).toHaveBeenCalledTimes(1);
  });

  it('should not throw if cleanup is not a function', () => {
    expect(() => {
      const dispose = createEffect(() => {
        return undefined;
      });
      dispose();
    }).not.toThrow();
  });
});
