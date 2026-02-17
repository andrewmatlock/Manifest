# Inputs

---

## Setup

Inputs styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.input.css" />
```

</x-code-group>

---

## Default

::: frame
<input placeholder="Type here" />
:::

```html copy
<input placeholder="Type here" />
```

---

## Utilities

Inputs accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors

::: frame
<input class="brand" placeholder="Brand" />
<input class="accent" placeholder="Accent" />
<input class="positive" placeholder="Positive" />
<input class="negative" placeholder="Negative" />
:::

```html copy
<!-- Brand variant -->
<input class="brand" placeholder="Brand" />

<!-- Accent variant -->
<input class="accent" placeholder="Accent" />

<!-- Positive variant -->
<input class="positive" placeholder="Positive" />

<!-- Negative variant -->
<input class="negative" placeholder="Negative" />
```

---

### Size

::: frame
<input class="sm" placeholder="Small" />
<input class="lg" placeholder="Large" />
:::

```html copy
<!-- Small variant -->
<input class="sm" placeholder="Small" />

<!-- Large variant -->
<input class="lg" placeholder="Large" />
```

---

### Appearance

::: frame
<input class="ghost" placeholder="Ghost" />
<input class="outlined" placeholder="Outlined" />
<input class="transparent" placeholder="Transparent" />
:::

```html copy
<!-- No background until hover -->
<input class="ghost" placeholder="Ghost" />

<!-- Border included -->
<input class="outlined" placeholder="Outlined" />

<!-- No background at all -->
<input class="transparent" placeholder="Transparent" />
```

---

## Search

Inputs of `type="search"` work on their own, or can be placed in a label to faciliate a search icon.

::: frame
<label role="button">
    <span x-icon="lucide:search"></span>
    <input type="search" placeholder="Search" />
</label>
:::

```html copy
<label role="button">
    <span x-icon="lucide:search"></span>
    <input type="search" placeholder="Search" />
</label>
```

---

## File Uploads

Inputs of `type="file"` work on their own, or can be placed in a label to faciliate an upload icon.

::: frame justify-start
<label role="button">
    <input type="file" />
    <span x-icon="lucide:upload"></span>
    Upload
</label>
:::

```html copy
<label role="button">
    <input type="file" />
    <span x-icon="lucide:upload"></span>
    Upload
</label>
```

---

## Form Layouts

::: brand icon="lucide:info"
These styles are included in `manifest.css`, or the standalone `manifest.form.css`.
:::

### Labels

Placing the input and text inside a `<label>` automatically stacks them with spacing.

::: frame
<label>
    Email
    <input placeholder="Enter your email" />
</label>
:::

```html copy
<label>
    Email
    <input placeholder="Enter your email" />
</label>
```

To horizontally inline the label text with the input, place the text in a `<data>` element. This is used as a CSS hook with no semantic impact.

::: frame
<label>
    <data>Email</data>
    <input placeholder="Enter your email" />
</label>
:::

```html copy
<label>
    <data>Email</data>
    <input placeholder="Enter your email" />
</label>
```

---

### Groups

Horizontally group inputs, buttons, or selects together with a `role="group"` attribute on the parent container.

::: frame
<div role="group">
    <input placeholder="Insert email" />
    <button class="brand">Signup</button>
</div>
:::

```html copy
<div role="group">
    <input placeholder="Insert email" />
    <button class="brand">Signup</button>
</div>
```

When these elements are grouped, only the outer elements' outer corners retain their border radii for a seamless appearance.

---

## Styles

### Theme

Default inputs use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-field-surface` | Input background color |
| `--color-field-surface-hover` | Input hover/active background color |
| `--color-field-inverse` | Text and selection highlight color |
| `--spacing-field-height` | Input height |
| `--spacing-field-padding` | Horizontal padding for input content |
| `--radius` | Border radius for input corners |
| `--transition` | Transition for interactive states |

---

### Customization

Modify base input styles with custom CSS for the `input` selector.

::: frame
<style>
input.custom {
    background-color: #f0f8ff;
    border: 2px solid #3b82f6;
    border-radius: 8px;
    color: #1e40af;
}

input.custom::placeholder {
    color: #60a5fa;
}

input.custom:focus-visible {
    border-color: #1d4ed8;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
}
</style>

<input class="custom" placeholder="Custom Input" />
:::

```css copy
input {
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

