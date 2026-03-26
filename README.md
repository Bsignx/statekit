# ⚡ StateKit

Lightweight TypeScript reactivity library inspired by React hooks with a built-in pub/sub event system.

**Zero dependencies · < 2KB minified · Full TypeScript support · ESM/CJS**

---

## 📦 Installation

```bash
npm install statekit
```

Or via CDN:

```html
<script src="https://unpkg.com/statekit/dist/index.js"></script>
```

---

## 🚀 Quick Start

```ts
import { createState, createEffect, createEventBus } from 'statekit';

// Create reactive state (fully typed!)
const count = createState(0);

// React to changes
createEffect(() => {
  console.log('Count:', count.get());
}, [count]);

// Update state
count.set(1);           // logs: "Count: 1"
count.set(v => v + 1);  // logs: "Count: 2"
```

---

## 📖 API Reference

### `createState<T>(initialValue: T): State<T>`

Creates a reactive state container. Notifies subscribers when value changes.

```ts
import { createState, type State } from 'statekit';

const name: State<string> = createState('Bruno');

name.get();              // 'Bruno' (typed as string)
name.set('John');        // updates value, notifies subscribers
name.set(v => v + '!'); // updater function

// Manual subscription
const unsubscribe = name.subscribe(() => {
  console.log('Name changed!');
});
unsubscribe(); // stop listening
```

**`State<T>` interface:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `() => T` | Returns the current value. Auto-tracks if called inside an effect. |
| `set` | `(value: T \| (prev: T) => T) => void` | Sets a new value. Skips if `Object.is(old, new)`. |
| `subscribe` | `(fn: () => void) => () => void` | Manually subscribe. Returns unsubscribe function. |

---

### `createEffect(fn, deps?): () => void`

Creates a reactive side-effect. Re-runs when dependencies change. Supports cleanup functions (like React's `useEffect`).

```ts
import { createState, createEffect } from 'statekit';

const count = createState(0);

const dispose = createEffect(() => {
  const value = count.get();
  console.log('Count is:', value);

  // Optional cleanup (runs before next execution or on dispose)
  return () => {
    console.log('Cleaning up for:', value);
  };
}, [count]);

count.set(1); // triggers re-run
dispose();    // stop the effect, run final cleanup
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `fn` | `() => (() => void) \| void` | Effect function. May return a cleanup function. |
| `deps` | `Dependency[]` | Optional array of reactive states to watch. |

**Returns:** `() => void` — Dispose function.

---

### `createMemo<T>(fn, deps): Memo<T>`

Creates a memoized computed value. Only recalculates when dependencies change.

```ts
import { createState, createMemo, type Memo } from 'statekit';

const price = createState(100);
const tax = createState(0.1);

const total: Memo<number> = createMemo(() => {
  return price.get() * (1 + tax.get());
}, [price, tax]);

total.get(); // 110
price.set(200);
// After microtask flush:
total.get(); // 220
```

**`Memo<T>` interface:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `get` | `() => T` | Returns the current computed value. |

---

### `createRef<T>(initialValue: T): Ref<T>`

Creates a mutable reference that does **NOT** trigger reactivity. Similar to React's `useRef`.

```ts
import { createRef, type Ref } from 'statekit';

const timerRef: Ref<number> = createRef(0);
timerRef.current = setInterval(() => console.log('tick'), 1000);

// With DOM elements
const inputRef = createRef<HTMLInputElement | null>(null);
inputRef.current = document.querySelector('input');
```

**`Ref<T>` interface:**

| Property | Type | Description |
|----------|------|-------------|
| `current` | `T` | The mutable value. Changes don't trigger reactivity. |

---

### `createEventBus(): EventBus`

Creates a pub/sub event bus for decoupled communication. Supports generic types for type-safe events.

```ts
import { createEventBus, type EventBus } from 'statekit';

const bus: EventBus = createEventBus();

// Type-safe events!
interface User {
  name: string;
  email: string;
}

bus.on<User>('user:login', (data) => {
  console.log(data.name);  // ✅ typed as string
  console.log(data.email); // ✅ typed as string
});

bus.emit<User>('user:login', { name: 'Bruno', email: 'bruno@test.com' });

// One-time listener
bus.once('app:ready', () => console.log('Ready!'));

// Unsubscribe
const unsub = bus.on('event', handler);
unsub();

// Clear all
bus.clear();
```

**`EventBus` interface:**

| Method | Signature | Description |
|--------|-----------|-------------|
| `on` | `<T>(event, handler) => () => void` | Subscribe. Returns unsubscribe function. |
| `off` | `<T>(event, handler) => void` | Unsubscribe a specific handler. |
| `emit` | `<T>(event, data?) => void` | Emit event with optional data. |
| `once` | `<T>(event, handler) => () => void` | Subscribe, auto-remove after first call. |
| `clear` | `() => void` | Remove all listeners for all events. |

---

### `createComponent(setup, container): () => void`

Mounts a reactive component into a DOM element. Re-renders automatically when reactive state changes.

```ts
import { createComponent, createState } from 'statekit';

createComponent(({ html, on }) => {
  const count = createState(0);

  // Delegated event — survives re-renders
  on('click', '[data-action="increment"]', () => {
    count.set(v => v + 1);
  });

  on('click', '[data-action="decrement"]', () => {
    count.set(v => v - 1);
  });

  return () => html`
    <div class="counter">
      <h2>Count: ${count.get()}</h2>
      <button data-action="decrement">-</button>
      <button data-action="increment">+</button>
    </div>
  `;
}, document.getElementById('app')!);
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `setup` | `(helpers: ComponentHelpers) => () => string` | Setup function. Must return a render function. |
| `container` | `HTMLElement` | DOM element to mount into. |

**Returns:** `() => void` — Unmount function.

**`ComponentHelpers`:**
- **`html`** — Tagged template literal with auto XSS escaping.
- **`on(eventName, selector, handler)`** — Delegated event listener that survives re-renders.

---

## 🎯 Batch Updates

StateKit automatically batches synchronous state changes using `queueMicrotask`. Multiple `set()` calls in the same synchronous block result in a single re-render.

```ts
const a = createState(0);
const b = createState(0);

createEffect(() => {
  console.log(a.get(), b.get()); // Only logs once per batch
}, [a, b]);

// Both updates batched into one effect run
a.set(1);
b.set(2);
```

---

## 🔧 TypeScript Support

StateKit is written in TypeScript and ships with full type declarations. All APIs are fully typed with generics:

```ts
import type { State, Memo, Ref, EventBus, ComponentHelpers } from 'statekit';

// State type is inferred
const count = createState(0);        // State<number>
const name = createState('Bruno');   // State<string>
const user = createState<User | null>(null); // State<User | null>

// Memo type is inferred
const doubled = createMemo(() => count.get() * 2, [count]); // Memo<number>

// Ref type is inferred or explicit
const ref = createRef<HTMLDivElement | null>(null); // Ref<HTMLDivElement | null>
```

---

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
npm run typecheck     # TypeScript type checking
```

---

## 🔨 Building

```bash
npm run build
```

Outputs:
- `dist/index.js` — ES Modules (minified)
- `dist/index.cjs` — CommonJS (minified)
- `dist/*.d.ts` — TypeScript declarations

---

## 📁 Project Structure

```
statekit/
├── src/
│   ├── index.ts        # Barrel exports + type re-exports
│   ├── state.ts        # createState
│   ├── effect.ts       # createEffect
│   ├── memo.ts         # createMemo
│   ├── ref.ts          # createRef
│   ├── event-bus.ts    # createEventBus
│   ├── component.ts    # createComponent
│   └── scheduler.ts    # Batch update scheduler
├── tests/
│   ├── state.test.js
│   ├── effect.test.js
│   ├── memo.test.js
│   ├── ref.test.js
│   ├── event-bus.test.js
│   └── component.test.js
├── demo/               # Pokémon Explorer demo app
├── dist/               # Built output (JS + .d.ts)
├── package.json
├── tsconfig.json
├── tsup.config.ts
├── vitest.config.js
└── README.md
```

---

## 📄 License

MIT © Bruno Mariano
