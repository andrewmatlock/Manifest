# Badges

---

## Setup

Badge styles are included in Manifest CSS or the standalone [typography](/elements/typography) stylesheet. Both reference [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.typography.css" />
```

</x-code-group>

---

## Default

Badges use the `<mark>` tag for styling without a class required.

::: frame
<mark>Badge</mark>
:::

```html copy
<mark>Badge</mark>
```

---

## Utilities

Badges accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors
::: frame
<mark class="brand">Primary</mark>
<mark class="accent">Accent</mark>
<mark class="positive">Positive</mark>
<mark class="negative">Negative</mark>
:::

```html copy
<!-- Brand variant -->
<mark class="brand">Primary</mark>

<!-- Accent variant -->
<mark class="accent">Accent</mark>

<!-- Positive variant -->
<mark class="positive">Positive</mark>

<!-- Negative variant -->
<mark class="negative">Negative</mark>
```

---

### Size

::: frame
<mark class="sm">Small</mark>
<mark class="lg">Large</mark>
:::

```html copy
<!-- Small variant -->
<mark class="sm">Small</mark>

<!-- Large variant -->
<mark class="lg">Large</mark>
```

---

### Appearance

::: frame items-center
<mark class="ghost">Ghost</mark>
<mark class="outlined">Outlined</mark>
<mark class="transparent">Transparent</mark>
<mark class="hug transparent">Hug</mark>
:::

```html copy
<!-- No background until hover -->
<mark class="ghost">Ghost</mark>

<!-- Border included -->
<mark class="outlined">Outlined</mark>

<!-- No background at all -->
<mark class="transparent">Transparent</mark>

<!-- No padding for minimal target area, best paired with transparency -->
<mark class="hug transparent">Hug</mark>
```

---

## Icons

### Solo Icon

Badges containing a single [icon](/core-plugins/icons) are automatically squared.

::: frame
<mark x-icon="lucide:heart"></mark>
:::

```html copy
<mark x-icon="lucide:heart"></mark>
```

---

### Icon & Text

Any number of icons and text can be nested in any order. Place icons in `<span>` tags, and any sibling elements will auto-space.

::: frame
<mark><span x-icon="lucide:heart"></span> 79</mark>
<mark><span x-icon="lucide:thumbs-down"></span><span>21</span></mark>
:::

```html copy
<mark><span x-icon="lucide:heart"></span> 79</mark>
<mark><span x-icon="lucide:thumb-down"></span><span>21</span></mark>
```

---

## Styles

### Theme

Default badges use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-content-stark` | High contrast text color |
| `--spacing` | Padding and margin factor in various elements |
| `--radius` | Border radius for `<pre>` corners |

---

### Customization

Modify base badge styles with custom CSS for the `<mark>` selector.

::: frame
<style>
mark.custom {
    color: blue;
    background: lightblue;
}
</style>

<mark class="custom">Custom Badge</mark>
:::

```css copy
mark {
    color: blue;
    background: lightblue;
}
```