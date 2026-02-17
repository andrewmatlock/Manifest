# Checkboxes

---

## Setup

Checkboxes styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.checkbox.css" />

<!-- Required for label support -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.form.css" />
```

</x-code-group>

---

## Default

::: frame
<input type="checkbox" checked />
<input type="checkbox" />
:::

```html copy
<input type="checkbox" />
```

---

## Utilities

Checkboxes accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors

::: frame
<input type="checkbox" class="brand" checked />
<input type="checkbox" class="accent" checked />
<input type="checkbox" class="positive" checked />
<input type="checkbox" class="negative" checked />
:::

```html copy
<!-- Brand variant -->
<input type="checkbox" class="brand" checked />

<!-- Accent variant -->
<input type="checkbox" class="accent" checked />

<!-- Positive variant -->
<input type="checkbox" class="positive" checked />

<!-- Negative variant -->
<input type="checkbox" class="negative" checked />
```

---

### Size

::: frame
<input class="sm" type="checkbox" checked />
<input class="lg" type="checkbox" checked />
:::

```html copy
<!-- Small variant -->
<input class="sm" type="checkbox" checked />

<!-- Large variant -->
<input class="lg" type="checkbox" checked />
```

---

### Outlined

::: frame
<input class="outlined" type="checkbox" checked />
<input class="outlined brand" type="checkbox" checked />
<input class="outlined accent" type="checkbox" checked />
<input class="outlined positive" type="checkbox" checked />
<input class="outlined negative" type="checkbox" checked />
:::

```html copy
<!-- Border variant -->
<input class="outlined" type="checkbox" checked />

<!-- Combined with colors -->
<input class="outlined brand" type="checkbox" checked />
<input class="outlined accent" type="checkbox" checked />
<input class="outlined positive" type="checkbox" checked />
<input class="outlined negative" type="checkbox" checked />
```

---

## Form Layouts

::: brand icon="lucide:info"
These styles are included in `manifest.css`, or the standalone `manifest.form.css`.
:::

### Labels

Placing the checkbox and text inside a `<label>` automatically arranges them in a row.

::: frame
<label>
    <input type="checkbox" />
    Lorem ipsum
</label>
:::

```html copy
<label>
    <input type="checkbox" />
    Lorem ipsum
</label>
```

---

### Groups

Placing labelled checkboxes inside a `<fieldset>` automatically arranges them in a column with gaps.

::: frame
<fieldset>
    <label>
        <input type="checkbox" />
        Lorem ipsum
    </label>
    <label>
        <input type="checkbox" />
        Dolar sit amet
    </label>
    <label>
        <input type="checkbox" />
        Consectetur adipiscing elit
    </label>
</fieldset>
:::

```html copy
<fieldset>
    <label>
        <input type="checkbox" />
        Lorem ipsum
    </label>
    <label>
        <input type="checkbox" />
        Dolar sit amet
    </label>
    <label>
        <input type="checkbox" />
        Consectetur adipiscing elit
    </label>
</fieldset>
```

---

## Styles

### Theme

Default checkboxes use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--spacing-field-height` | Checkbox size |
| `--color-field-surface` | Checkbox background |
| `--color-field-surface-hover` | Checkbox background on hover |
| `--color-field-inverse` | Checkmark icon color |
| `--transition` | Transition for interactive states |

---

### Icon

The checkbox icon is an encoded SVG in the checkbox style's `--icon-checkbox` variable. To modify it:
1. Choose a desired icon from <a href="https://icon-sets.iconify.design/" target="_blank">Iconify</a> or other SVG icon source.
2. Copy the encoded SVG string (in Iconify, go to an icon's CSS tab and find the `--svg` value). Otherwise, use an <a href="https://yoksel.github.io/url-encoder/" target="_blank">SVG encoder</a>.
3. Overwrite the `--icon-checkbox` variable value with the encoded SVG string.

```css "Default checkmark icon" copy
:root {
    --icon-checkbox: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='currentColor' d='m0 11l2-2l5 5L18 3l2 2L7 18z'/%3E%3C/svg%3E")
}
```

---

### Customization

Modify base checkbox styles with custom CSS for the `input[type=checkbox]` selector.

::: frame
<style>
input[type=checkbox].custom {
    color: white;
    background-color: aqua;
    border-radius: 0;
}
</style>

<input type="checkbox" class="custom" checked />
:::

```css copy
input[type=checkbox] {
    color: white;
    background-color: aqua;
    border-radius: 0;
}
```