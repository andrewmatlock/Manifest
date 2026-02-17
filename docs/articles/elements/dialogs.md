# Dialogs

---

## Setup

Dialog styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.dialog.css" />
```

</x-code-group>

---

## Default

Dialogs are supported in pure HTML using the `<dialog>` element as a <a href="https://developer.mozilla.org/en-US/docs/Web/API/Popover_API" target="_blank">popover</a>. The `<button>` that opens the dialog requires the `popovertarget="ID"` attribute, matching the dialog ID.

::: frame
<button popovertarget="dialog-default-preview">Open Empty Dialog</button>
<dialog popover id="dialog-default-preview"></dialog>
:::

```html copy
<button popovertarget="dialog-default">Open Empty Dialog</button>
<dialog popover id="dialog-default"></dialog>
```

::: brand icon="lucide:info"
Browser versions from 2023 and earlier require a polyfill script like <a href="https://github.com/oddbird/popover-polyfill" target="_blank">OddBird</a> to mimic HTML popover behaviour.
:::

---

## Light Dismiss

Popovers operate by default as lightboxes, and clicking anywhere outside the dialog or pressing <kbd>esc</kbd> will close it, know as "light dismiss". Prevent this with the `popover="manual"` attribute.

::: frame
<button popovertarget="dialog-manual">Open Dialog</button>
<dialog popover="manual" id="dialog-manual" class="col center gap-2">
    <p>Click outside, I dare you.<p>
    <button popovertarget="dialog-manual" popoveraction="hide">Close</button>
</dialog>
:::

```html copy
<button popovertarget="dialog-manual">Open Dialog</button>
<dialog popover="manual" id="dialog-manual" class="col center gap-2">
    <p>Click outside, I dare you.<p>
    <button popovertarget="dialog-manual" popoveraction="hide">Close</button>
</dialog>
```

Manual popovers require internal close buttons, with a `popovertarget` ID'ing the dialog and `popoveraction="hide"` to close it.

---

## Layout

Use the `<header>`, `<main>`, and/or `<footer>` elements as direct children of the dialog element for a typical dialog layout.

::: frame
<button popovertarget="dialog-formatted">Open Formatted Dialog</button>

<dialog popover id="dialog-formatted">
    <header>
        <span class="h2">Dialog Title</span>
        <button popovertarget="dialog-formatted" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
    </main>
    <footer>
        <button popovertarget="dialog-formatted">Cancel</button>
        <button popovertarget="dialog-formatted" class="brand">Confirm</button>
    </footer>
</dialog>
:::

```html copy
<button popovertarget="dialog-formatted">Open Formatted Dialog</button>

<dialog popover id="dialog-formatted">

    <header>
        <h2>Dialog Title</h2>
        <button popovertarget="dialog-formatted" aria-label="Close" x-icon="lucide:x"></button>
    </header>

    <main>
        <p>Lorem ipsum dolor sit amet consectetur adipisicing elit. Quisquam, quos.</p>
    </main>

    <footer>
        <button popovertarget="dialog-formatted">Cancel</button>
        <button popovertarget="dialog-formatted" class="brand">Confirm</button>
    </footer>

</dialog>
```

The layout containers have default styles for padding, and the header will spread its content while the footer aligns it to the end.

---

## Nesting

Dialogs can open or close from each other in a visual stack. [Dropdowns](/core-plugins/dropdowns) are also popovers that can control dialogs and exist within them.

::: frame
<button popovertarget="dialog-first">Open First Dialog</button>

<!-- Open dialog from dropdown -->
<button x-dropdown="dropdown-start">Dropdown</button>
<menu id="dropdown-start">
    <button popovertarget="dialog-first">Open First Dialog</button>
</menu>

<!-- First dialog -->
<dialog popover id="dialog-first">
    <header>
        <span class="h3">First Dialog</span>
        <button popovertarget="dialog-first" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>This dialog can open another.</p>
        <p>Dropdowns will close when a dialog is opened.</p>
        <p>Buttons can be used to switch or close dialogs.</p>
    </main>
    <footer>
        <button popovertarget="dialog-second">Open Second Dialog</button>

        <!-- Nested Dropdown -->
        <button x-dropdown="dropdown-internal">Dropdown</button>
        <menu id="dropdown-internal">
            <button popovertarget="dialog-second">Open Second Dialog</button>
        </menu>
        <button popovertarget="dialog-first">Close</button>
    </footer>
</dialog>

<!-- Nested second dialog -->
<dialog popover id="dialog-second">
    <header>
        <span class="h3">Second Dialog</span>
        <button popovertarget="dialog-second" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>This dialog opens above the first one. The Close All button targets the first dialog, automatically closing both.</p>
    </main>
    <footer>
        <button popovertarget="dialog-second" popoveraction="hide">Go Back</button>
        <button popovertarget="dialog-first" popoveraction="hide">Close All</button>
    </footer>
</dialog>
:::

```html numbers copy
<button popovertarget="dialog-first">Open First Dialog</button>

<!-- Open dialog from dropdown -->
<button x-dropdown="dropdown-start">Dropdown</button>
<menu id="dropdown-start">
    <button popovertarget="dialog-first">Open First Dialog</button>
</menu>

<!-- First dialog -->
<dialog popover id="dialog-first">
    <header>
        <h3>First Dialog</h3>
        <button popovertarget="dialog-first" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>This dialog can open another.</p>
        <p>Dropdowns will close when a dialog is opened.</p>
        <p>Buttons can be used to switch or close dialogs.</p>
    </main>
    <footer>
        <button popovertarget="dialog-second">Open Second Dialog</button>

        <!-- Nested Dropdown -->
        <button x-dropdown="dropdown-internal">Dropdown</button>
        <menu id="dropdown-internal">
            <button popovertarget="dialog-second">Open Second Dialog</button>
        </menu>
        <button popovertarget="dialog-first">Close</button>
    </footer>
</dialog>

<!-- Nested second dialog -->
<dialog popover id="dialog-second">
    <header>
        <h3>Second Dialog</h3>
        <button popovertarget="dialog-second" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>This dialog opens above the first one. The Close All button targets the first dialog, automatically closing both.</p>
    </main>
    <footer>
        <button popovertarget="dialog-second" popoveraction="hide">Go Back</button>
        <button popovertarget="dialog-first" popoveraction="hide">Close All</button>
    </footer>
</dialog>
```

---

## Templating

HTML IDs must identify single elements on a page, and generating multiple dialogs in a <a href="https://alpinejs.dev/essentials/templating#looping-elements" target="_blank">template loop</a> requires each dialog be assigned a unique ID. These can be generated with Alpine using template literals like `${i}`.

::: frame
<template x-for="i in 3" :key="i">
    <div">
        <button :popovertarget="`dialog-template-${i}`" x-text="`Dialog ${i}`"></button>
        <dialog popover :id="`dialog-template-${i}`">
            <header>
                <span class="h3" x-text="`Template Dialog ${i}`"></span>
                <button :popovertarget="`dialog-template-${i}`" aria-label="Close" x-icon="lucide:x"></button>
            </header>
            <main>
                <p x-text="`This is dialog number ${i} generated from a template.`"></p>
            </main>
            <footer>
                <button :popovertarget="`dialog-template-${i}`">Close</button>
            </footer>
        </dialog>
    </div>
</template>
:::

```html numbers copy
<template x-for="i in 3" :key="i">

    <!-- Multiple elements need to be wrapped in a container, since template tags only recognize their first child. -->
    <div>

        <!-- Button template -->
        <button :popovertarget="`dialog-template-${i}`" x-text="`Dialog ${i}`"></button>
        
        <!-- Dialog template -->
        <dialog popover :id="`dialog-template-${i}`">
            <header>
                <h3 x-text="`Template Dialog ${i}`"></h3>
                <button :popovertarget="`dialog-template-${i}`" aria-label="Close" x-icon="lucide:x"></button>
            </header>
            <main>
                <p x-text="`This is dialog number ${i} generated from a template.`"></p>
            </main>
            <footer>
                <button :popovertarget="`dialog-template-${i}`">Close</button>
            </footer>
        </dialog>

    </div>

</template>
```

---

## Utility Class

The `dialog` utility class will apply a dialog element's styles to other elements.

::: frame
<div x-data="{ reveal: false }">
    <button @click="reveal = true">Open Fake Dialog</button>
    <div class="dialog" x-show="reveal">
        <header>
            <span class="h3">Fake it to make it</span>
        </header>
        <main>
            <p>If a fake dialog is not a popover like this one, it does not have native lightbox behaviour and requires a custom close button to dismiss.</p>
        </main>
        <footer>
            <button @click="reveal = false">Close</button>
        </footer>
    </div>
</div>
:::

```html numbers copy
<!-- Alpine can be used to open/close a fake dialog if it's not a popover -->
<div x-data="{ reveal: false }">

    <!-- Open button -->
    <button @click="reveal = true">Open Fake Dialog</button>

    <!-- Fake dialog -->
    <div class="dialog" x-show="reveal">
        <header>
            <span class="h3">Fake it to make it</span>
        </header>
        <main>
            <p>If a fake dialog is not a popover like this one, it does not have native lightbox behaviour and requires a custom close button to dismiss.</p>
        </main>
        <footer>

            <!-- Close button -->
            <button @click="reveal = false">Close</button>

        </footer>
    </div>

</div>
```

---

## Styles

### Theme

Default dialogs use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|----------|
| `--color-content-stark` | Dialog text color |
| `--color-popover-surface` | Dialog background color |
| `--radius` | Dialog border radius (doubled for dialogs) |
| `--spacing` | Dialog layout gaps and padding |

---

### Backdrop

Dialog <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/::backdrop" target="_blank">backdrops</a> (the light dismiss area) have arbitrary background colors with transparency. They can be styled with custom CSS in light and dark modes.

::: frame
<div>
<style>
dialog[popover].override::backdrop {
    background-color: rgba(255, 0, 0, 0.2);
}

/* Dark theme backdrop */
.dark dialog[popover].override::backdrop {
    background-color: rgba(0, 0, 255, 0.2);
}
</style>
<button popovertarget="dialog-backdrop-preview">Open Custom Backdrop Dialog</button>

<dialog popover id="dialog-backdrop-preview" class="override"></dialog>
</div>
:::

```css copy
/* Light theme backdrop */
dialog[popover]::backdrop {
    background-color: rgba(255, 0, 0, 0.2);
}

/* Dark theme backdrop */
.dark dialog[popover]::backdrop {
    background-color: rgba(0, 0, 255, 0.2);
}
```

---

### Transitions

Default open/close transitions for all popovers—including dialogs—are defined in [reset](/styles/reset) styles. Override them with custom CSS.

<x-code-group numbers copy>

```css "All Popovers"
[popover] {
    display: none;
    transition: opacity .15s ease-in, scale .15s ease-in, display .15s ease-in;
    transition-behavior: allow-discrete;

    &:popover-open {
        display: flex
    }

    /* Opening state */
    @starting-style {
        scale: .9;
        opacity: 0
    }

    /* Closing state */
    &:not(:popover-open) {
        display: none !important;
        scale: 1;
        opacity: 0;
        transition-duration: .15s;
        transition-timing-function: ease-out
    }
}
```

```css "Dialogs Only"
dialog[popover] {
    display: none;
    transition: opacity .15s ease-in, scale .15s ease-in, display .15s ease-in;
    transition-behavior: allow-discrete;

    &:popover-open {
        display: flex
    }

    /* Opening state */
    @starting-style {
        scale: .9;
        opacity: 0
    }

    /* Closing state */
    &:not(:popover-open) {
        display: none !important;
        scale: 1;
        opacity: 0;
        transition-duration: .15s;
        transition-timing-function: ease-out
    }
}
```

</x-code-group>

::: brand icon="lucide:info"
Modifying `display` properties can result in popovers not working properly.
Remember to update `transition` with any new properties.
:::

---

### Tailwind CSS

If using Tailwind, individual dialogs can be customized with utility classes. Dialogs will automatically adjust their size and positioning based on content.

::: frame
<button popovertarget="dialog-tailwind-preview">Custom Size & Position</button>
<dialog popover id="dialog-tailwind-preview" class="w-96 h-80 mt-20">
    <header>
        <span class="h3">Tailwind Dialog</span>
        <button popovertarget="dialog-tailwind-preview" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>This dialog uses Tailwind utility classes for custom sizing and positioning.</p>
    </main>
    <footer>
        <button popovertarget="dialog-tailwind-preview">Close</button>
    </footer>
</dialog>
:::

```html copy
<button popovertarget="dialog-tailwind-preview">Custom Size & Position</button>
<dialog popover id="dialog-tailwind-preview" class="w-96 h-80 mt-20">
    <header>
        <h3>Tailwind Dialog</h3>
        <button popovertarget="dialog-tailwind-preview" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>This dialog uses Tailwind utility classes for custom sizing and positioning.</p>
    </main>
    <footer>
        <button popovertarget="dialog-tailwind-preview">Close</button>
    </footer>
</dialog>
```

---

### Customization

Modify base dialog styles with custom CSS for the `dialog[popover]` selector.

::: frame
<style>
dialog[popover].custom {
    background-color: #f0f8ff;
    border: 2px solid #3b82f6;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.25);
}

dialog[popover].custom::backdrop {
    background-color: rgba(59, 130, 246, 0.1);
}

dialog[popover].custom :where(header, main, footer) {
    padding: 2rem;
}
</style>

<button popovertarget="custom-dialog-preview">Custom Dialog</button>
<dialog popover id="custom-dialog-preview" class="custom">
    <header>
        <span class="h3">Custom Dialog</span>
        <button popovertarget="custom-dialog-preview" aria-label="Close" x-icon="lucide:x"></button>
    </header>
    <main>
        <p>This dialog has custom styling.</p>
    </main>
    <footer>
        <button popovertarget="custom-dialog-preview">Close</button>
    </footer>
</dialog>
:::

```css copy
dialog[popover], .dialog {
    background-color: #f0f8ff;
    border: 2px solid #3b82f6;
    border-radius: 16px;
    box-shadow: 0 25px 50px -12px rgba(59, 130, 246, 0.25);

    &::backdrop {
        background-color: rgba(59, 130, 246, 0.1);
    }

    & :where(header, main, footer) {
        padding: 2rem;
    }
}
```