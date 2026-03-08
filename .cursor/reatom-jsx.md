# @reatom/jsx — API Reference

> JSX-рантайм без виртуального DOM. Компоненты — обычные функции, возвращающие реальные DOM-элементы.
> Вычисляются один раз при монтировании. Реактивность — через атомы в пропсах.

---

## Props

JSX-пропсы обрабатываются в зависимости от префикса:

| Префикс  | Поведение                                 |
| -------- | ----------------------------------------- |
| _(без)_  | DOM property или attribute (по контексту) |
| `prop:`  | DOM property                              |
| `attr:`  | DOM attribute                             |
| `on:`    | Event listener (авто-`wrap` для Reatom)   |
| `style:` | Отдельное CSS-свойство                    |
| `css:`   | CSS-переменная для `css` пропа            |
| `model:` | Two-way binding для input-элементов       |

Значения пропсов:

- `null` / `undefined` — убирает атрибут / сбрасывает property
- `string`, `number`, `boolean` — устанавливает
- `Atom` / `() => value` — реактивно отслеживается, обновляется при изменении

```tsx
const enabled = atom(true)
const value = atom('')

<input
  value={value}
  attr:type="text"
  prop:disabled={() => !enabled()}
  on:input={(event) => value.set(event.currentTarget.value)}
/>
```

---

## Children

- `boolean`, `null`, `undefined` — ничего не рендерит
- `string`, `number` — текстовый узел
- `Node` — вставляется как есть
- `Atom` / `() => Node` — реактивное содержимое

```tsx
<div>{count}</div>
```

---

## model:\* — Two-Way Binding

| Проп                  | Привязка         |
| --------------------- | ---------------- |
| `model:value`         | `.value`         |
| `model:valueAsNumber` | `.valueAsNumber` |
| `model:checked`       | `.checked`       |

```tsx
const value = atom("");
const Input = () => <input model:value={value} />;
```

Компоненты вычисляются один раз — можно создавать атомы внутри:

```tsx
const Input = () => {
  const value = atom("");
  return <input model:value={value} />;
};
```

---

## style — Inline-стили

Объект стилей. Falsy-значения (`false`, `null`, `undefined`) удаляют свойство:

```tsx
<div style={{ top: 0, display: hidden() && "none" }} />
```

Не заменяйте весь объект — обновляйте по ключам:

```tsx
// BAD
<div style={() => (flag() ? { top: 0 } : { bottom: 0 })} />

// GOOD
<div
  style={() =>
    flag() ? { top: 0, bottom: undefined } : { top: undefined, bottom: 0 }
  }
/>
```

---

## style:\* — Отдельные CSS-свойства

```tsx
<div
  style:top={atom("10px")}
  style:right={0}
  style:bottom={undefined}
  style:left={null}
/>
```

Числа передаются как есть (без автоматического `px`).

---

## class / className

Принимает строки, массивы и объекты (как `clsx`). Внутри использует `reatomClassName`:

```tsx
<button
  class={[
    "button",
    `button--size-${props.size}`,
    `button--theme-${props.theme}`,
    {
      "button--is-disabled": props.isDisabled,
      "button--is-active": props.isActive() && !props.isDisabled(),
    },
  ]}
/>
```

---

## css — CSS-in-JS

Стили через tagged template literal. Динамические значения — через `css:*` переменные:

```tsx
const Component = () => (
  <input css:size={size} css="font-size: calc(1em + var(--size) * 0.1em);" />
);
```

Компилируется в:

```html
<div data-reatom-style="1" data-reatom-name="Component" style="--size: 3"></div>
```

Рантайм: генерирует уникальный `data-reatom-style`, вставляет CSS-правило по selector `[data-reatom-style="1"]`, динамические значения — inline CSS-переменные.

### CSS-миксины

Стили — просто строки, можно компоновать:

```tsx
// styles.ts
export const colors = {
  primary: "#3b82f6",
  surface: "#f8fafc",
  text: "#1e293b",
};
export const space = [0, 4, 8, 16, 24, 32, 48] as const;

export const flex = "display: flex;";
export const rounded = "border-radius: 8px;";
export const p = (n: number) => `padding: ${space[n]}px;`;
export const bg = (color: string) => `background: ${color};`;

export const card = bg(colors.surface) + rounded + p(4);
```

```tsx
<main css={center}>
  <article css={card}>
    <h1 css={text(colors.text)}>Hello</h1>
  </article>
</main>
```

### Условные стили через атрибуты

Используйте нативные/ARIA-атрибуты как селекторы — одновременно стилизация и доступность:

```tsx
<details
  open={open}
  css={`
    article {
      display: grid;
      grid-template-rows: 0fr;
      transition: grid-template-rows 0.2s;
    }
    &[open] article {
      grid-template-rows: 1fr;
    }
  `}
>
  <summary on:click={open.toggle}>{title}</summary>
  <article>
    <div css="overflow: hidden;">{children}</div>
  </article>
</details>
```

```tsx
<nav aria-busy={loading} css="&[aria-busy='true'] { opacity: 0.5; }">
  {children}
</nav>

<input
  aria-invalid={hasError}
  css="&[aria-invalid='true'] { border-color: red; }"
/>
```

---

## Components

Компоненты — обычные функции, возвращающие DOM-элементы. Вычисляются **один раз** при монтировании. Нет virtual DOM, нет diffing.

### Реактивные списки

```tsx
const list = atom([<li>1</li>, <li>2</li>])

const add = () => list.set((state) => [...state, <li>{state.length + 1}</li>])

<div>
  <button on:click={add}>Add</button>
  {computed(() => <ul>{list().map((item) => item)}</ul>)}
</div>
```

### Не переиспользуйте элементы!

JSX-элементы — реальные DOM-ноды. Один элемент нельзя вставить в два места:

```tsx
// BAD — shared отобразится только в последнем месте
const shared = <span>{valueAtom}</span>
<>
  <div>{shared}</div>
  <p>{shared}</p>
</>

// GOOD — каждый вызов создаёт уникальный элемент
const Shared = () => <span>{valueAtom}</span>
<>
  <div><Shared /></div>
  <p><Shared /></p>
</>
```

---

## $spread

Декларативная привязка нескольких пропсов. Объект может быть реактивным:

```tsx
<div
  $spread={computed(() =>
    valid()
      ? { disabled: true, readonly: true }
      : { disabled: false, readonly: false }
  )}
/>
```

Всегда включайте все ключи при обновлении, чтобы не оставлять «зависшие» значения.

---

## SVG

Используйте `svg:` префикс:

```tsx
<svg:svg viewBox="0 0 24 24">
  <svg:path d="..." />
</svg:svg>
```

Для вставки raw SVG:

```tsx
// Вариант 1: парсинг из строки
const SvgIcon = ({ svg }: { svg: string }) =>
  new DOMParser()
    .parseFromString(svg, "image/svg+xml")
    .children.item(0) as SVGElement;

// Вариант 2: через prop:outerHTML
const SvgIcon = ({ svg }: { svg: string }) => <svg:svg prop:outerHTML={svg} />;
```

---

## ref

Доступ к DOM-элементу и регистрация mount/unmount эффектов:

```tsx
<button
  ref={(el) => {
    el.focus();
    return (el) => el.blur();
  }}
/>
```

Unmount вызывается в обратном порядке (child → parent).

---

## Утилиты

### reatomClassName

Реактивный аналог `clsx` / `classnames`:

```tsx
reatomClassName("my-class"); // Computed<'my-class'>
reatomClassName(["first", atom("second")]); // Computed<'first second'>
reatomClassName({ active: isActiveAtom }); // Computed<'active' | ''>
reatomClassName(() => (isActiveAtom() ? "active" : undefined)); // Computed<'active' | ''>
```

### css (функция)

Tagged template для CSS с поддержкой falsy-значений:

```tsx
import { css } from "@reatom/jsx";

const styles = css`
  color: red;
  background: blue;
  ${somePredicate && "border: 0;"}
`;
```

### Bind

Добавляет реактивные пропсы к существующему DOM-элементу:

```tsx
import { Bind } from "@reatom/jsx";

const MyComponent = () => {
  const container = new SomeLibrary();
  return (
    <Bind
      element={container}
      class={computed(() => (visible() ? "active" : "disabled"))}
    />
  );
};
```

### mount

```tsx
import { mount } from "@reatom/jsx";

mount(document.getElementById("root")!, <App />);
// Возвращает { unmount: Unsubscribe }
```

---

## TypeScript

### Типизация пропсов компонента

```tsx
import { type JSX } from "@reatom/jsx";

// Только plain-значения
interface InputProps extends JSX.InputHTMLAttributes {
  defaultValue?: string;
}

// Plain + атомы
type InputProps = JSX.IntrinsicElements["input"] & {
  defaultValue?: string;
};

const Input = ({ defaultValue, ...props }: InputProps) => {
  props.value ??= defaultValue;
  return <input {...props} />;
};
```

### Типизация event handlers

```tsx
const handleInput = (event: JSX.InputEvent) => {
  const value: number = event.currentTarget.valueAsNumber;
};

const handleSelect = (event: JSX.TargetedEvent<HTMLSelectElement>) => {
  const value: string = event.currentTarget.value;
};
```

### Расширение JSX-типов

Кастомные элементы:

```tsx
// global.d.ts
declare global {
  namespace JSX {
    interface IntrinsicElements {
      "loading-bar": { showing?: boolean | null | undefined };
    }
  }
}
export {};
```

Кастомные HTML-атрибуты:

```tsx
// global.d.ts
declare global {
  namespace JSX {
    interface HTMLAttributes {
      custom?: string | null | undefined;
    }
  }
}
export {};
```

---

## Ограничения

- DOM-less SSR не поддерживается (нужен `linkedom` или аналог)
- Keyed lists не поддерживаются (используйте linked lists)

---

## Типы и экспорты

| Экспорт            | Тип                                       |
| ------------------ | ----------------------------------------- |
| `FC<Props>`        | `(props: Props) => JSXElement`            |
| `JSXElement`       | `JSX.Element`                             |
| `DEBUG`            | `Atom<boolean>`                           |
| `DOM`              | `Atom<Window & typeof globalThis>`        |
| `stylesheet`       | `Atom<CSSStyleSheet>`                     |
| `h(tag, props)`    | JSX factory                               |
| `hf()`             | Fragment                                  |
| `mount(el, child)` | `{ unmount: Unsubscribe }`                |
| `css\`...\``       | Tagged template → `string`                |
| `Bind`             | Привязка пропсов к существующему элементу |
| `reatomClassName`  | `(value) => Computed<string>`             |
