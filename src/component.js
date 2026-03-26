import { createEffect } from './effect.js';

const ENTITY_MAP = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

/**
 * Escapes HTML special characters to prevent XSS.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  return str.replace(/[&<>"']/g, (char) => ENTITY_MAP[char]);
}

/**
 * Mounts a reactive component into a DOM container.
 * Re-renders automatically when reactive state dependencies change.
 *
 * @param {(helpers: { html: Function, on: Function }) => () => string} setup
 *   Setup function receiving `html` (tagged template) and `on` (event delegation helper).
 *   Must return a render function that produces an HTML string.
 * @param {HTMLElement} container - DOM element to mount into.
 * @returns {() => void} Unmount/dispose function.
 *
 * @example
 * createComponent(({ html, on }) => {
 *   const count = createState(0);
 *   on('click', '[data-action="increment"]', () => count.set(v => v + 1));
 *   return () => html`
 *     <div>
 *       <p>Count: ${count.get()}</p>
 *       <button data-action="increment">+1</button>
 *     </div>
 *   `;
 * }, document.getElementById('app'));
 */
export function createComponent(setup, container) {
  const delegatedEvents = [];

  /**
   * Tagged template literal for HTML rendering.
   * Escapes string values by default for XSS protection.
   * @param {TemplateStringsArray} strings
   * @param {...any} values
   * @returns {string}
   */
  function html(strings, ...values) {
    return strings.reduce((result, str, i) => {
      const value = i < values.length ? values[i] : '';
      const safe = typeof value === 'string' ? escapeHtml(value) : String(value ?? '');
      return result + str + safe;
    }, '');
  }

  /**
   * Register a delegated event listener for this component.
   * Uses event delegation on the container so listeners survive re-renders.
   * @param {string} eventName - DOM event name (click, input, change, etc.)
   * @param {string} selector - CSS selector to match the target element.
   * @param {(event: Event, target: Element) => void} handler - Event handler.
   */
  function on(eventName, selector, handler) {
    delegatedEvents.push({ eventName, selector, handler });
  }

  const render = setup({ html, on });

  let isMounted = false;

  const dispose = createEffect(() => {
    const htmlString = render();
    container.innerHTML = htmlString;

    // Bind delegated events only once (they survive re-renders via delegation)
    if (!isMounted) {
      for (const { eventName, selector, handler } of delegatedEvents) {
        container.addEventListener(eventName, (e) => {
          const target = e.target.closest(selector);
          if (target && container.contains(target)) {
            handler(e, target);
          }
        });
      }
      isMounted = true;
    }
  });

  return () => {
    dispose();
    container.innerHTML = '';
  };
}
