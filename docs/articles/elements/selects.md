# Selects

---

## Setup

Selects styles are included in Manifest CSS or the standalone [buttons](/elements/buttons) stylesheet. Both reference [theme](/styles/theme) variables.

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
<select>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
:::

```html copy
<select>
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
```

---

## Utilities

Selects accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors
::: frame
<select class="brand">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
<select class="accent">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
<select class="positive">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
<select class="negative">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
:::

```html copy
<!-- Brand variant -->
<select class="brand">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>

<!-- Accent variant -->
<select class="accent">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>

<!-- Positive variant -->
<select class="positive">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>

<!-- Negative variant -->
<select class="negative">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
```

---

### Size

::: frame
<select class="sm">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
<select class="lg">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
:::

```html copy
<!-- Small variant -->
<select class="sm">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>

<!-- Large variant -->
<select class="lg">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
```

---

### Appearance

::: frame items-center
<select class="ghost">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
<select class="outlined">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
<select class="transparent">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
<select class="hug transparent">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
:::

```html copy
<!-- No background until hover -->
<select class="ghost">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>

<!-- Border variant -->
<select class="outlined">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>

<!-- No background at all -->
<select class="transparent">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>

<!-- No padding for minimal target area, best paired with transparency -->
<select class="hug transparent">
    <option value="1">Option 1</option>
    <option value="2">Option 2</option>
    <option value="3">Option 3</option>
</select>
```

---

## Form Layouts

::: brand icon="lucide:info"
These styles are included in `manifest.css`, or the standalone `manifest.form.css`.
:::

### Labels

Placing the select and text inside a `<label>` automatically stacks them with spacing.

::: frame
<label>
    Category
    <select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
    </select>
</label>
:::

```html copy
<label>
    Category
    <select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
    </select>
</label>
```

To horizontally inline the label text with the select, place the text in a `<data>` element. This is used as a CSS hook with no semantic impact.

::: frame
<label>
    <data>Category</data>
    <select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
    </select>
</label>
:::

```html copy
<label>
    <data>Category</data>
    <select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
    </select>
</label>
```

---

### Groups

Horizontally group buttons, inputs, or selects together with a `role="group"` attribute added to the parent container.

::: frame
<div role="group">
    <select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
    </select>
    <button class="brand">Confirm</button>
</div>
:::

```html copy
<div role="group">
    <select>
        <option value="1">Option 1</option>
        <option value="2">Option 2</option>
        <option value="3">Option 3</option>
    </select>
    <button class="brand">Confirm</button>
</div>
```

When these elements are grouped, only the outer elements' outer corners retain their border radii for a seamless appearance.

---

## Style

### Theme

Default selects use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-field-surface` | Select background color |
| `--color-field-surface-hover` | Select hover/active background color |
| `--color-field-inverse` | Select text color |
| `--spacing-field-height` | Select height and min-width |
| `--spacing-field-padding` | Horizontal padding for select content |
| `--radius` | Border radius for select corners |
| `--transition` | Transition for interactive states |

---

### Customization

Modify base select styles with custom CSS for the `select` selector.

::: frame
<style>
select.custom {
    color: white;
    background-color: black;
    border: 1px solid white;
    border-radius: 100px;

    &::picker-icon {
        content: "›";
        transform: scaleY(1);
        font-size: 20px;
        line-height: 0.7;
    }
}
</style>

<select class="custom">
    <option value="1">Custom Option 1</option>
    <option value="2">Custom Option 2</option>
    <option value="3">Custom Option 3</option>
</select>
:::

```css copy
select {
    color: white;
    background-color: black;
    border: 1px solid white;
    border-radius: 100px;

    /* Icon */
    &::picker-icon {
        content: "›";
        transform: scaleY(1);
        font-size: 20px;
        line-height: 0.7;
    }
}
```