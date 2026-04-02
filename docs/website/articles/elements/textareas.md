# Textareas

---

## Setup

Textareas styles are included in Manifest CSS or the standalone [inputs](/elements/inputs) stylesheet. Both reference [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.theme.css" />
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.input.css" />
```

</x-code-group>

---

## Default

::: frame
<textarea placeholder="Type here"></textarea>
:::

```html copy
<textarea placeholder="Type here"></textarea>
```

---

## Utilities

Textareas accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors

::: frame
<textarea class="brand" placeholder="Brand"></textarea>
<textarea class="accent" placeholder="Accent"></textarea>
<textarea class="positive" placeholder="Positive"></textarea>
<textarea class="negative" placeholder="Negative"></textarea>
:::

```html copy
<!-- Brand variant -->
<textarea class="brand" placeholder="Brand"></textarea>

<!-- Accent variant -->
<textarea class="accent" placeholder="Accent"></textarea>

<!-- Positive variant -->
<textarea class="positive" placeholder="Positive"></textarea>

<!-- Negative variant -->
<textarea class="negative" placeholder="Negative"></textarea>
```

---

### Size

::: frame
<textarea class="sm" placeholder="Small"></textarea>
<textarea class="lg" placeholder="Large"></textarea>
:::

```html copy
<!-- Small variant -->
<textarea class="sm" placeholder="Small"></textarea>

<!-- Large variant -->
<textarea class="lg" placeholder="Large"></textarea>
```

---

### Appearance

::: frame
<textarea class="ghost" placeholder="Ghost"></textarea>
<textarea class="outlined" placeholder="Outlined"></textarea>
<textarea class="transparent" placeholder="Transparent"></textarea>
:::

```html copy
<!-- No background until hover -->
<textarea class="ghost" placeholder="Ghost"></textarea>

<!-- Border included -->
<textarea class="outlined" placeholder="Outlined"></textarea>

<!-- No background at all -->
<textarea class="transparent" placeholder="Transparent"></textarea>
```

---

## Resizing

### Drag Handle

The CSS <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/resize" target="_blank">resize</a> property or Tailwind's <a href="https://tailwindcss.com/docs/resize" target="_blank">resize</a> utility can be used to control the textarea's resizing behavior with a manual drag handle.

::: frame
<textarea placeholder="Resize in any direction" class="resize"></textarea>
:::

```html copy
<textarea placeholder="Resize in any direction" class="resize"></textarea>
```

---

### Automatic

The CSS property <a href="https://developer.mozilla.org/en-US/docs/Web/CSS/field-sizing" target="_blank">field-sizing: content</a> or Tailwind's <a href="https://tailwindcss.com/docs/field-sizing" target="_blank">field-sizing-content</a> utility allow a textarea to auto-resize from its minimum height to fit all content.

::: frame
<textarea placeholder="Type to resize" class="field-sizing-content"></textarea>
:::

```html copy
<textarea placeholder="Type to resize" class="field-sizing-content"></textarea>
```

If a resize drag handle is applied and interacted with, the manually-set height will override automatic resizing.

---

## Labels

::: brand icon="lucide:info"
These styles are included in `manifest.css`, or the standalone `manifest.form.css`.
:::

Placing the textarea and text inside a `<label>` automatically stacks them with spacing.

::: frame
<label>
    Message
    <textarea placeholder="Enter your message"></textarea>
</label>
:::

```html copy
<label>
    Message
    <textarea placeholder="Enter your message"></textarea>
</label>
```

To horizontally inline the label text with the textarea, place the text in a `<data>` element. This is used as a CSS hook with no semantic impact.

::: frame
<label>
    <data>Message</data>
    <textarea placeholder="Enter your message"></textarea>
</label>
:::

```html copy
<label>
    <data>Message</data>
    <textarea placeholder="Enter your message"></textarea>
</label>
```

---

## Styles

### Theme

Default textareas use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-field-surface` | Textarea background color |
| `--color-field-surface-hover` | Textarea hover/active background color |
| `--color-field-inverse` | Text and selection highlight color |
| `--spacing-field-padding` | Padding for textarea content |
| `--radius` | Border radius for textarea corners |
| `--transition` | Transition for interactive states |

---

### Customization

Modify base textarea styles with custom CSS for the `textarea` selector.

::: frame
<style>
textarea.custom {
    background-color: #f0f8ff;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    color: #1e40af;
}

textarea.custom::placeholder {
    color: #60a5fa;
}

textarea.custom:focus-visible {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>

<textarea class="custom" placeholder="Custom Textarea"></textarea>
:::

```css copy
textarea {
    background-color: #f0f8ff;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    color: #1e40af;

    &::placeholder {
        color: #60a5fa;
    }

    &:focus-visible {
        border-color: #1d4ed8;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
    }
}
```

