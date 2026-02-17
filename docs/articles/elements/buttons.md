# Buttons

---

## Setup

Buttons styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.button.css" />
```

</x-code-group>

---

## Default

::: frame
<button>Button</button>
:::

```html copy
<button>Button</button>
```

The buttons appearance is determined by these top-level factors:
- **Sizing:** Buttons horizontally size to their content unless overriden, with the minimum size being a square.
- **Content alignment:** Buttons use `display: inline-flex` with centered content by default. Flexbox properties like Tailwind's `justify-start` modify content alignment.
- **Truncation:** To truncate overflowing text with ellipsis, place it in an internal `<span>`.

::: frame
<button>!</button>
<button class="flex-1 justify-start">Starting Alignment</button>
<button class="flex-1">
    <span> Truncated lorem ipsum dolar sit amet</span>
</button>
:::

```html copy
<!-- Fit to content, or square -->
<button>!</button>

<!-- Modify alignment -->
<button class="flex-1 justify-start">Starting Alignment</button>

<!-- Truncate text -->
<button class="flex-1">
    <span> Truncated lorem ipsum dolar sit amet</span>
</button>
```

---

## Utilities

Buttons accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors
::: frame
<button class="brand">Brand</button>
<button class="accent">Accent</button>
<button class="positive">Positive</button>
<button class="negative">Negative</button>
:::

```html copy
<!-- Brand variant -->
<button class="brand">Brand</button>

<!-- Accent variant -->
<button class="accent">Accent</button>

<!-- Positive variant -->
<button class="positive">Positive</button>

<!-- Negative variant -->
<button class="negative">Negative</button>
```

---

### Size

::: frame
<button class="sm">Small</button>
<button class="lg">Large</button>
:::

```html copy
<!-- Small variant -->
<button class="sm">Small</button>

<!-- Large variant -->
<button class="lg">Large</button>
```

---

### Appearance

::: frame items-center
<button class="ghost">Ghost</button>
<button class="outlined">Outlined</button>
<button class="selected">Selected</button>
<button class="transparent">Transparent</button>
<button class="hug transparent">Hug</button>
:::

```html copy
<!-- No background until hover -->
<button class="ghost">Ghost</button>

<!-- Border included -->
<button class="outlined">Outlined</button>

<!-- Currently selected state -->
<button class="selected">Selected</button>

<!-- No background at all -->
<button class="transparent">Transparent</button>

<!-- No padding for minimal target area, best paired with transparency -->
<button class="hug transparent">Hug</button>
```

---

## Icons

### Solo Icon

Buttons containing a single [icon](/elements/icons) are automatically squared.

::: frame
<button x-icon="ph:house"></button>
:::

```html copy
<button x-icon="ph:house"></button>
```

---

### Icon & Text

Any number of icons and text can be nested in any order. Place icons in `<span>` tags and any sibling elements will auto-space.

::: frame
<button><span x-icon="ph:house"></span> Home</button>
<button><span x-icon="ph:house"></span><span>Home</span></button>
:::

```html copy
<button><span x-icon="ph:house"></span> Home</button>
<button><span x-icon="ph:house"></span><span>Home</span></button>
```

---

## Links

For button links, use `<a role="button">`. Modifier classes above can also be applied.

::: frame
<a role="button" href="#">Learn more</a>
<a role="button" href="#" class="brand">Try now</a>
:::

```html copy
<a role="button" href="#">Learn more</a>
<a role="button" href="#" class="brand">Try now</a>
```

---

## File Uploads

Manifest hides the `type="file"` input since its lack modern style control. To visualize it as a button, place it inside a label with `role="button"` alongside any icons or text.

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

Placing the button and text inside a `<label>` automatically stacks them with spacing.

::: frame
<label>
    Action
    <button>Submit</button>
</label>
:::

```html copy
<label>
    Action
    <button>Submit</button>
</label>
```

To horizontally inline the label text with the button, place the text in a `<data>` element. This is used as a CSS hook with no semantic impact.

::: frame
<label>
    <data>Action</data>
    <button>Submit</button>
</label>
:::

```html copy
<label>
    <data>Action</data>
    <button>Submit</button>
</label>
```

---

### Groups

Horizontally group buttons, inputs, or selects together with a `role="group"` attribute added to the parent container.

::: frame
<div role="group">
    <input placeholder="Insert email"/>
    <button class="brand">Signup</button>
</div>
:::

```html copy
<div role="group">
    <input placeholder="Insert email"/>
    <button class="brand">Signup</button>
</div>
```

When these elements are grouped, only the outer elements' outer corners retain their border radii for a seamless appearance.

---

## Styles

### Theme

Default buttons use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-field-surface` | Button background color |
| `--color-field-surface-hover` | Button hover/active background color |
| `--color-field-inverse` | Button text color |
| `--spacing-field-height` | Button height and min-width |
| `--spacing-field-padding` | Horizontal padding for button content |
| `--radius` | Border radius for button corners |
| `--transition` | Transition for interactive states |

---

### Customization

Modify base button styles with custom CSS for the `button` selector.

::: frame
<style>
button.custom {
    color: white;
    background-color: black;
    border: 1px solid white;
    border-radius: 100px;
}
</style>

<button class="custom">Custom Button</button>
:::

```css copy
button {
    color: white;
    background-color: black;
    border: 1px solid white;
    border-radius: 100px;
}
```