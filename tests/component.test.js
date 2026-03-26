import { describe, it, expect } from 'vitest';
import { createComponent } from '../src/component';
import { createState } from '../src/state';

describe('createComponent', () => {
  it('should render into container', () => {
    const container = document.createElement('div');

    createComponent(({ html }) => {
      return () => html`<p>Hello World</p>`;
    }, container);

    expect(container.innerHTML).toContain('Hello World');
  });

  it('should render reactive state', () => {
    const container = document.createElement('div');
    const count = createState(42);

    createComponent(({ html }) => {
      return () => html`<span>${count.get()}</span>`;
    }, container);

    expect(container.innerHTML).toContain('42');
  });

  it('should re-render when state changes', async () => {
    const container = document.createElement('div');
    const count = createState(0);

    createComponent(({ html }) => {
      return () => html`<span>${count.get()}</span>`;
    }, container);

    expect(container.innerHTML).toContain('0');

    count.set(99);
    await new Promise((r) => setTimeout(r, 10));
    expect(container.innerHTML).toContain('99');
  });

  it('should return unmount function', () => {
    const container = document.createElement('div');

    const unmount = createComponent(({ html }) => {
      return () => html`<p>Content</p>`;
    }, container);

    expect(container.innerHTML).toContain('Content');
    unmount();
    expect(container.innerHTML).toBe('');
  });

  it('should escape HTML in values (XSS protection)', () => {
    const container = document.createElement('div');
    const text = createState('<script>alert("xss")</script>');

    createComponent(({ html }) => {
      return () => html`<p>${text.get()}</p>`;
    }, container);

    expect(container.innerHTML).not.toContain('<script>');
    expect(container.innerHTML).toContain('&lt;script&gt;');
  });

  it('should handle number values', () => {
    const container = document.createElement('div');
    const num = createState(3.14);

    createComponent(({ html }) => {
      return () => html`<span>${num.get()}</span>`;
    }, container);

    expect(container.innerHTML).toContain('3.14');
  });

  it('should handle null/undefined values gracefully', () => {
    const container = document.createElement('div');

    createComponent(({ html }) => {
      return () => html`<span>${null}</span>`;
    }, container);

    expect(container.innerHTML).toContain('<span></span>');
  });
});
