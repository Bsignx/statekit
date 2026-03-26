import { describe, it, expect } from 'vitest';
import { createRef } from '../src/ref';

describe('createRef', () => {
  it('should store initial value', () => {
    const ref = createRef(42);
    expect(ref.current).toBe(42);
  });

  it('should be mutable', () => {
    const ref = createRef('hello');
    ref.current = 'world';
    expect(ref.current).toBe('world');
  });

  it('should handle null', () => {
    const ref = createRef(null);
    expect(ref.current).toBeNull();
  });

  it('should store objects', () => {
    const ref = createRef({ name: 'Bruno' });
    expect(ref.current).toEqual({ name: 'Bruno' });
    ref.current.name = 'John';
    expect(ref.current.name).toBe('John');
  });

  it('should store DOM-like elements', () => {
    const el = document.createElement('div');
    const ref = createRef(null);
    ref.current = el;
    expect(ref.current).toBe(el);
    expect(ref.current.tagName).toBe('DIV');
  });

  it('should store arrays', () => {
    const ref = createRef([1, 2, 3]);
    expect(ref.current).toEqual([1, 2, 3]);
    ref.current.push(4);
    expect(ref.current).toEqual([1, 2, 3, 4]);
  });

  it('should store booleans', () => {
    const ref = createRef(false);
    expect(ref.current).toBe(false);
    ref.current = true;
    expect(ref.current).toBe(true);
  });
});
