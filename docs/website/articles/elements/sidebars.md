# Sidebars

---

## Setup

Sidebar styles are included in Manifest CSS or as a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.sidebar.css" />
```

</x-code-group>

::: brand icon="lucide:info"
Browser versions from 2023 and earlier require a polyfill script like <a href="https://github.com/oddbird/popover-polyfill" target="_blank">OddBird</a> to mimic HTML popover behaviour.
:::

---

## Default

Sidebars use the `<aside>` element as a <a href="https://developer.mozilla.org/en-US/docs/Web/API/Popover_API" target="_blank">popover</a>. The `<button>` that opens the sidebar requires the `popovertarget="ID"` attribute, matching the aside ID.

::: frame
<button popovertarget="sidebar-default-preview">Open Sidebar</button>
<aside popover id="sidebar-default-preview" class="col gap-4 p-4 border-s border-line">
    <span class="h4">Sidebar</span>
    <p>This sidebar slides in from the right by default.</p>
</aside>
:::

```html copy
<button popovertarget="sidebar-default">Open Sidebar</button>
<aside popover id="sidebar-default" class="col gap-4 p-4 border-s border-line">
    <h4>Sidebar</h4>
    <p>This sidebar slides in from the right by default.</p>
</aside>
```

---

## Positioning

By default, sidebars slide in from the inline-end (right in LTR, left in RTL). Add the `appear-start` class to make the sidebar originate from the inline-start (left in LTR, right in RTL).

::: frame
<button popovertarget="sidebar-start-preview">Open Start Sidebar</button>
<aside popover id="sidebar-start-preview" class="appear-start col gap-4 p-4 border-e border-line">
    <span class="h4">Start Sidebar</span>
    <p>This sidebar slides in from the left in LTR screens.</p>
</aside>
:::

```html copy
<button popovertarget="sidebar-start">Open Start Sidebar</button>

<aside popover id="sidebar-start" class="appear-start col gap-4 p-4 border-e border-line">
    <h4>Start Sidebar</h4>
    <p>This sidebar slides in from the left in LTR screens.</p>
</aside>
```

---

## Styles

### Theme

Default sidebars use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|----------|
| `--color-popover-surface` | Sidebar background color |
| `--spacing` | Sidebar padding and gaps |
| `--spacing-content-width` | Maximum content width |

---

### Tailwind CSS

If using Tailwind, individual sidebars can be customized with utility classes.

::: frame
<button popovertarget="sidebar-tailwind-preview">Custom Sidebar</button>
<aside popover id="sidebar-tailwind-preview" class="w-100 bg-surface-2/80 border-s border-line rounded-s-2xl backdrop-blur">
    <div class="col gap-4 p-4">
        <h4>Tailwind Sidebar</h4>
        <p>This sidebar uses Tailwind utility classes with theme-aware colors.</p>
    </div>
</aside>
:::

```html copy
<button popovertarget="sidebar">Custom Sidebar</button>
<aside popover id="sidebar" class="w-100 bg-surface-2/80 border-s border-line rounded-s-2xl backdrop-blur">
    <div class="col gap-4 p-4">
        <h4>Tailwind Sidebar</h4>
        <p>This sidebar uses Tailwind utility classes with theme-aware colors.</p>
    </div>
</aside>
```

---

### Transitions

Sidebars use custom transform animations for sliding effects. Opacity and scale are set to overwrite defaults in [reset styles](/styles/reset).

```css
aside[popover] {
    transition: opacity .15s ease-in, transform .15s ease-in, display .15s ease-in;
    transition-behavior: allow-discrete;

    /* Opening state - slide in from inline-end */
    @starting-style {
        transform: translateX(100%);
        opacity: 1;
        scale: 1;
    }

    /* Closing state - slide out to inline-end */
    &:not(:popover-open) {
        transform: translateX(100%);
        opacity: 1;
        scale: 1;
    }

    /* RTL support - slide from left in RTL context */
    [dir=rtl] & {
        @starting-style {
            transform: translateX(-100%);
        }

        &:not(:popover-open) {
            transform: translateX(-100%);
        }
    }

    /* Modifier class to originate sidebar from inline-start */
    &.start {

        @starting-style {
            transform: translateX(-100%);
        }

        &:not(:popover-open) {
            transform: translateX(-100%);
        }
    }
}
```

::: brand icon="lucide:info"
Modifying `display` properties can result in popovers not working properly.
Remember to update `transition` with any new properties.
:::

---

### Customization

Modify base sidebar styles with custom CSS for the `aside[popover]` selector.

::: frame
<style>
aside[popover].custom {
    display: flex;
    flex-flow: column;
    gap: 1rem;
    width: 400px;
    padding: 1rem;
    background-color: color-mix(in oklch, var(--color-surface-2) 90%, transparent);
    backdrop-filter: blur(4px);
    border-start-start-radius: 1rem;
    border-end-start-radius: 1rem;
    box-shadow: 0 0 2rem rgba(0, 0, 0, 0.1);

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.2);
    }
}
</style>

<button popovertarget="sidebar-custom-preview">Custom Sidebar</button>
<aside popover id="sidebar-custom-preview" class="custom">
    <h4>Custom Sidebar</h4>
    <p>This sidebar has custom styling with CSS variables and backdrop color.</p>
</aside>
:::

```css copy
aside[popover] {
    display: flex;
    flex-flow: column;
    gap: 1rem;
    width: 400px;
    padding: 1rem;
    background-color: color-mix(in oklch, var(--color-surface-2) 90%, transparent);
    backdrop-filter: blur(4px);
    border-start-start-radius: 1rem;
    border-end-start-radius: 1rem;
    box-shadow: 0 0 2rem rgba(0, 0, 0, 0.1);

    &::backdrop {
        background-color: rgba(0, 0, 0, 0.2);
    }
}
```