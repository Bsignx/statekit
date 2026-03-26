import { describe, it, expect, vi } from 'vitest';
import { createEventBus } from '../src/event-bus.js';

describe('createEventBus', () => {
  it('should emit and receive events', () => {
    const bus = createEventBus();
    const spy = vi.fn();
    bus.on('test', spy);
    bus.emit('test', { value: 42 });
    expect(spy).toHaveBeenCalledWith({ value: 42 });
  });

  it('should support multiple listeners on same event', () => {
    const bus = createEventBus();
    const spy1 = vi.fn();
    const spy2 = vi.fn();
    bus.on('test', spy1);
    bus.on('test', spy2);
    bus.emit('test', 'data');
    expect(spy1).toHaveBeenCalledWith('data');
    expect(spy2).toHaveBeenCalledWith('data');
  });

  it('should unsubscribe with off', () => {
    const bus = createEventBus();
    const spy = vi.fn();
    bus.on('test', spy);
    bus.off('test', spy);
    bus.emit('test', {});
    expect(spy).not.toHaveBeenCalled();
  });

  it('should unsubscribe with returned function', () => {
    const bus = createEventBus();
    const spy = vi.fn();
    const unsub = bus.on('test', spy);
    unsub();
    bus.emit('test', {});
    expect(spy).not.toHaveBeenCalled();
  });

  it('should handle once - fire only once', () => {
    const bus = createEventBus();
    const spy = vi.fn();
    bus.once('test', spy);
    bus.emit('test', 'first');
    bus.emit('test', 'second');
    expect(spy).toHaveBeenCalledTimes(1);
    expect(spy).toHaveBeenCalledWith('first');
  });

  it('should clear all listeners', () => {
    const bus = createEventBus();
    const spy = vi.fn();
    bus.on('a', spy);
    bus.on('b', spy);
    bus.clear();
    bus.emit('a', {});
    bus.emit('b', {});
    expect(spy).not.toHaveBeenCalled();
  });

  it('should not throw when emitting event with no listeners', () => {
    const bus = createEventBus();
    expect(() => bus.emit('nonexistent', {})).not.toThrow();
  });

  it('should not throw when removing non-existent handler', () => {
    const bus = createEventBus();
    expect(() => bus.off('nonexistent', () => {})).not.toThrow();
  });

  it('should support different event names independently', () => {
    const bus = createEventBus();
    const spyA = vi.fn();
    const spyB = vi.fn();
    bus.on('a', spyA);
    bus.on('b', spyB);
    bus.emit('a', 'dataA');
    expect(spyA).toHaveBeenCalledWith('dataA');
    expect(spyB).not.toHaveBeenCalled();
  });

  it('should handle emit with no data', () => {
    const bus = createEventBus();
    const spy = vi.fn();
    bus.on('test', spy);
    bus.emit('test');
    expect(spy).toHaveBeenCalledWith(undefined);
  });
});
