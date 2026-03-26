# ⚡ StateKit

Lightweight vanilla JS reactivity library inspired by React hooks with a built-in pub/sub event system.

**Zero dependencies · < 5KB gzipped · ESM/CJS/UMD**

---

## 📦 Installation

```bash
npm install statekit
```

Or via CDN:

```html
<script src="https://unpkg.com/statekit/dist/statekit.umd.js"></script>
<script>
  const { createState, createEffect } = StateKit;
</script>
```

---

## 🚀 Quick Start

```js
import { createState, createEffect, createEventBus } from 'statekit';

// Create reactive state
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

### `createState(initialValue)`

Creates a reactive state container. Notifies subscribers when value changes.

```js
const name = createState('Bruno');

name.get();              // 'Bruno'
name.set('John');        // updates value, notifies subscribers
name.set(v => v + '!'); // updater function

// Manual subscription
const unsubscribe = name.subscribe((value) => {
  console.log('Name changed!');
});
unsubscribe(); // stop listening
```

**Returns:** `{ get, set, subscribe }`

| Method | Description |
|--------|-------------|
| `get()` | Returns the current value. Auto-tracks if called inside an effect. |
| `set(value)` | Sets a new value. Accepts a value or an updater function `(prev) => next`. Skips if `Object.is(old, new)`. |
| `subscribe(fn)` | Manually subscribe to changes. Returns an unsubscribe function. |

---

### `createEffect(fn, deps?)`

Creates a reactive side-effect. Re-runs when dependencies change. Supports cleanup functions (like React's `useEffect`).

```js
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

dispose(); // stop the effect, run final cleanup
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `fn` | `() => (() => void) \| void` | Effect function. May return a cleanup function. |
| `deps` | `Array` | Optional array of reactive states to watch. |

**Returns:** `() => void` — Dispose function.

---

### `createMemo(fn, deps)`

Creates a memoized computed value. Only recalculates when dependencies change.

```js
const price = createState(100);
const tax = createState(0.1);

const total = createMemo(() => {
  return price.get() * (1 + tax.get());
}, [price, tax]);

total.get(); // 110
price.set(200);
// After microtask flush:
total.get(); // 220
```

**Returns:** `{ get }` — Object with a `get()` method.

---

### `createRef(initialValue)`

Creates a mutable reference that does **NOT** trigger reactivity. Similar to React's `useRef`.

```js
const timerRef = createRef(null);

timerRef.current = setInterval(() => {
  console.log('tick');
}, 1000);

// Later:
clearInterval(timerRef.current);
```

**Returns:** `{ current: T }`

---

### `createEventBus()`

Creates a pub/sub event bus for decoupled communication.

```js
const bus = createEventBus();

// Subscribe
const unsubscribe = bus.on('user:login', (data) => {
  console.log('User logged in:', data.name);
});

// Emit
bus.emit('user:login', { name: 'Bruno' });

// One-time listener
bus.once('app:ready', () => {
  console.log('App is ready!');
});

// Unsubscribe
unsubscribe();
// or: bus.off('user:login', handler);

// Clear all
bus.clear();
```

**Returns:**

| Method | Description |
|--------|-------------|
| `on(event, handler)` | Subscribe. Returns unsubscribe function. |
| `off(event, handler)` | Unsubscribe a specific handler. |
| `emit(event, data?)` | Emit event with optional data. |
| `once(event, handler)` | Subscribe, auto-remove after first call. |
| `clear()` | Remove all listeners for all events. |

---

### `createComponent(setup, container)`

Mounts a reactive component into a DOM element. Re-renders automatically when reactive state changes.

```js
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
}, document.getElementById('app'));
```

**Parameters:**
| Param | Type | Description |
|-------|------|-------------|
| `setup` | `({ html, on }) => () => string` | Setup function. Receives `html` (tagged template) and `on` (event delegation). Must return a render function. |
| `container` | `HTMLElement` | DOM element to mount into. |

**Returns:** `() => void` — Unmount function.

**Helpers:**
- **`html`** — Tagged template literal with auto XSS escaping.
- **`on(eventName, selector, handler)`** — Delegated event listener that survives re-renders.

---

## 🎯 Batch Updates

StateKit automatically batches synchronous state changes using `queueMicrotask`. Multiple `set()` calls in the same synchronous block result in a single re-render.

```js
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

## 🧪 Testing

```bash
npm test              # Run all tests
npm run test:watch    # Watch mode
npm run test:coverage # With coverage report
```

---

## 🔨 Building

```bash
npm run build
```

Outputs:
- `dist/statekit.esm.js` — ES Modules
- `dist/statekit.cjs.js` — CommonJS
- `dist/statekit.umd.js` — UMD (browser global `StateKit`)

---

## 📁 Project Structure

```
statekit/
├── src/
│   ├── index.js        # Barrel exports
│   ├── state.js        # createState
│   ├── effect.js       # createEffect
│   ├── memo.js         # createMemo
│   ├── ref.js          # createRef
│   ├── event-bus.js    # createEventBus
│   ├── component.js    # createComponent
│   └── scheduler.js    # Batch update scheduler
├── tests/
│   ├── state.test.js
│   ├── effect.test.js
│   ├── memo.test.js
│   ├── ref.test.js
│   ├── event-bus.test.js
│   └── component.test.js
├── demo/               # Pokémon Explorer demo app
├── dist/               # Built output
├── package.json
├── rollup.config.js
├── vitest.config.js
└── README.md
```

---

## 📄 License

MIT © Bruno Mariano
