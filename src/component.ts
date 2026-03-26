import { createEffect } from './effect';

const ENTITY_MAP: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
};

/**
 * Escapes HTML special characters to prevent XSS.
 */
function escapeHtml(str: string): string {
  return str.replace(/[&<>"']/g, (char) => ENTITY_MAP[char]);
}

/** Event delegation entry */
interface DelegatedEvent {
  eventName: string;
  selector: string;
  handler: (event: Event, target: Element) => void;
}

/** Helpers passed to the component setup function */
export interface ComponentHelpers {
  /** Tagged template literal for safe HTML rendering. Escapes string values. */
  html: (strings: TemplateStringsArray, ...values: unknown[]) => string;
  /** Register a delegated event listener that survives re-renders. */
  on: (
    eventName: string,
    selector: string,
    handler: (event: Event, target: Element) => void,
  ) => void;
}

/** Setup function for a component */
type SetupFn = (helpers: ComponentHelpers) => () => string;

/**
 * Mounts a reactive component into a DOM container.
 * Re-renders automatically when reactive state dependencies change.
 *
 * @param setup - Setup function receiving `html` and `on` helpers. Must return a render function.
 * @param container - DOM element to mount into.
 * @returns An unmount/dispose function.
 *
 * @example
 * ```ts
 * createComponent(({ html, on }) => {
 *   const count = createState(0);
 *
 *   on('click', '[data-action="increment"]', () => {
 *     count.set(v => v + 1);
 *   });
 *
 *   return () => html`
 *     <div>
 *       <p>Count: ${count.get()}</p>
 *       <button data-action="increment">+1</button>
 *     </div>
 *   `;
 * }, document.getElementById('app')!);
 * ```
 */
export function createComponent(setup: SetupFn, container: HTMLElement): () => void {
  const delegatedEvents: DelegatedEvent[] = [];

  function html(strings: TemplateStringsArray, ...values: unknown[]): string {
    return strings.reduce((result, str, i) => {
      const value = i < values.length ? values[i] : '';
      const safe =
        typeof value === 'string' ? escapeHtml(value) : String(value ?? '');
      return result + str + safe;
    }, '');
  }

  function on(
    eventName: string,
    selector: string,
    handler: (event: Event, target: Element) => void,
  ): void {
    delegatedEvents.push({ eventName, selector, handler });
  }

  const render = setup({ html, on });

  let isMounted = false;

  const dispose = createEffect(() => {
    const htmlString = render();
    container.innerHTML = htmlString;

    // Bind delegated events only once (they survive re-renders via event delegation)
    if (!isMounted) {
      for (const { eventName, selector, handler } of delegatedEvents) {
        container.addEventListener(eventName, (e: Event) => {
          const target = (e.target as Element).closest(selector);
          if (target && container.contains(target)) {
            handler(e, target);
          }
        });
      }
      isMounted = true;
    }
  });

  return (): void => {
    dispose();
    container.innerHTML = '';
  };
}
