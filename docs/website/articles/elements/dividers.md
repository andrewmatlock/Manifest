# Dividers

---

## Setup

Divider styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.divider.css" />
```

</x-code-group>

---

## Default

Dividers in Manifest are horizontal or vertical dividing lines, which can optionally display inline text or icons.

### Horizontal Rule

For a basic horizontal line, use the `<hr>` element.

::: frame
<hr class="w-full">
:::

```html copy
<hr>
```

---

### With Content

All other divider configurations use the `divider` class, which automatically creates lines around content. This is best suited for a `<div>` or `<span>`, but will work with any text-supporting element.

::: frame
<div class="divider">Default Divider</div>
:::

```html copy
<div class="divider">Default Divider</div>
```

Dividers can include [icons](/core-plugins/icons) for enhanced visual separation.

::: frame col gap-4
<div class="divider"><span x-icon="lucide:star"></span></div>
<div class="divider"><span x-icon="lucide:shopping-basket"></span>Shopping List</div>
:::

```html copy
<!-- Icon only -->
<div class="divider"><span x-icon="lucide:star"></span></div>

<!-- Icon with text -->
<div class="divider"><span x-icon="lucide:shopping-basket"></span>Shopping List</div>
```

---

## Utilities

Dividers accept utility classes for different layouts and positioning.

### Alignment

The `start` and `end` classes will align content to one side or the other depending on text direction.

::: frame col gap-4
<div class="divider start">Start Aligned</div>
<div class="divider">Center Aligned</div>
<div class="divider end">End Aligned</div>
:::

```html copy
<!-- Start aligned (no line before) -->
<div class="divider start">Start Aligned</div>

<!-- Center aligned (default) -->
<div class="divider">Center Aligned</div>

<!-- End aligned (no line after) -->
<div class="divider end">End Aligned</div>
```

---

### Vertical

The `vertical` class changes the axis, and can be stacked with alignment classes. The divider requires a taller parent container for its lines to be visible.

::: frame
<div class="row gap-3 h-40">
    <div class="divider vertical"></div>
    <div class="divider vertical" x-icon="lucide:star"></div>
    <div class="divider vertical start">Start</div>
    <div class="divider vertical">Center</div>
    <div class="divider vertical end">End</div>
</div>
:::

```html copy
<div class="row gap-3 h-40">
    <div class="divider vertical"></div>
    <div class="divider vertical" x-icon="lucide:star"></div>
    <div class="divider vertical start">Start</div>
    <div class="divider vertical">Center</div>
    <div class="divider vertical end">End</div>
</div>
```

---

## Styles

### Theme

Default dividers use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|----------|
| `--color-line` | Line color (fallback: semi-transparent gray) |
| `--color-content-neutral` | Text color for divider labels |
| `--spacing-field-padding` | Spacing between lines and content |

---

### Customization

Modify base divider styles with custom CSS for the `.divider` selector.

::: frame
<style>
.divider.custom {
    color: #ff6b6b;

    &::before,
    &::after {
        background-color: #ff6b6b;
        height: 2px;
    }

    &.vertical {
        &::before,
        &::after {
            width: 2px;
        }
    }
}
</style>

<div class="divider custom">Custom Divider</div>
:::

```css copy
.divider {
    color: #ff6b6b;

    /* Lines */
    &::before,
    &::after {
        background-color: #ff6b6b;
        height: 2px;
    }

    &.vertical {
        &::before,
        &::after {
            width: 2px;
        }
    }
}
```

