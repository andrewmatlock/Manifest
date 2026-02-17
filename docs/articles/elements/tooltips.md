# Tooltips

---

## Setup

Tooltip styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

Tooltip functionality is included in `manifest.js` with all core plugins, or it can be selectively loaded.

<x-code-group copy>

```html "Manifest CSS / JS"
<!-- Manifest CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.code.min.css" />

<!-- Manifest JS -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Standalone"
<!-- Tooltip styles only -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.code.min.css" />

<!-- Manifest JS: tooltip plugin only -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
  data-plugin="dropdown"></script>
```

</x-code-group>

---

## Default

Apply tooltips to any element with the `x-tooltip` attribute.

::: frame
<button x-tooltip="Hello world">Hover me</button>
:::

```html copy
<button x-tooltip="Hello world">Hover me</button>
```

---

## Positioning

Tooltips have utility modifiers like `top` and `bottom` to position them in relation to their trigger element. If no modifier is set, tooltips default to `bottom` (centered below).

::: frame
<div class="col gap-4">
    <!-- Basic Directions -->
    <div>
        <small class="block mb-2">Basic</small>
        <div class="row-wrap gap-2">
            <button x-tooltip.top="Top tooltip">top</button>
            <button x-tooltip.bottom="Bottom tooltip">bottom</button>
            <button x-tooltip.start="Start tooltip">start</button>
            <button x-tooltip.end="End tooltip">end</button>
        </div>
    </div>
    
    <!-- Top/Bottom alignment -->
    <div>
        <small class="block mb-2">Top/Bottom alignment</small>
        <div class="row-wrap gap-2">
            <button x-tooltip.top.start="Top start tooltip">top-start</button>
            <button x-tooltip.top.end="Top end tooltip">top-end</button>
            <button x-tooltip.bottom.start="Bottom start tooltip">bottom-start</button>
            <button x-tooltip.bottom.end="Bottom end tooltip">bottom-end</button>
        </div>
    </div>
    
    <!-- Start/End alignment -->
    <div>
        <small class="block mb-2">Start/End alignment</small>
        <div class="row-wrap gap-2">
            <button x-tooltip.start.top="Start top tooltip">start-top</button>
            <button x-tooltip.start.bottom="Start bottom tooltip">start-bottom</button>
            <button x-tooltip.end.top="End top tooltip">end-top</button>
            <button x-tooltip.end.bottom="End bottom tooltip">end-bottom</button>
        </div>
    </div>

    <!-- Corner alignment -->
    <div>
        <small class="block mb-2">Corner alignment</small>
        <div class="row-wrap gap-2">
            <button x-tooltip.top.start.corner="Top start corner tooltip">top-start-corner</button>
            <button x-tooltip.top.end.corner="Top end corner tooltip">top-end-corner</button>
            <button x-tooltip.bottom.start.corner="Bottom start corner tooltip">bottom-start-corner</button>
            <button x-tooltip.bottom.end.corner="Bottom end corner tooltip">bottom-end-corner</button>
        </div>
    </div>
</div>
:::

```html "Examples" copy
<!-- Top -->
<button x-tooltip.top="Top tooltip">top</button>

<!-- Bottom with start alignment -->
<button x-tooltip.bottom.start="Bottom start tooltip">bottom-start</button>

<!-- Start with top alignment -->
<button x-tooltip.start.top="Start top tooltip">start-top</button>

<!-- Top start corner (either version works) -->
<button x-tooltip.top.start.corner="Top start corner tooltip">top-start-corner</button>
<button x-tooltip.start.top.corner="Start top corner tooltip">start-top-corner</button>
```

Regardless of a set modifier, tooltips overflowing the viewport will attempt to stay onscreen with default fallback positions.

---

## Rich Content

Tooltip content supports HTML including [icons](/elements/icons) for enhanced formatting.

::: frame
<button x-tooltip="<span x-icon='lucide:info'></span>Hello <b>bold</b> and <em>italic</em> world">Rich Content</button>
:::

```html copy
<button x-tooltip="<span x-icon='lucide:info'></span>Hello <b>bold</b> and <em>italic</em> world">Rich Content</button>
```

---

## Dynamic Content

Tooltips can display dynamic content using Alpine.js expressions.

::: frame
<div x-data="{ message: 'dynamic content', count: 42 }">
    <button x-tooltip="'Current count: ' + count">Count Tooltip</button>
    <button x-tooltip="`Template: ${message}`" @click="count++">Template Literal</button>
</div>
:::

```html copy
<div x-data="{ message: 'dynamic content', count: 42 }">
    <button x-tooltip="'Current count: ' + count">Count Tooltip</button>
    <button x-tooltip="`Template: ${message}`" @click="count++">Template Literal</button>
</div>
```

Note that tooltips with loop variables from `x-for` use template literals or string concatenation to ensure the expression is recognized as dynamic.

::: frame
<template x-for="item in $x.example.tooltipList">
    <span class="h4" x-tooltip="`${item.tooltip}`" x-text="item.name"></span>
</template>
:::

<x-code-group copy>

```html "HTML"
<template x-for="item in $x.content.list">
    <h4 x-tooltip="`${item.tooltip}`" x-text="item.name"></h4>
</template>
```

```yaml "content.yaml"
list:
    - name: "Mercury"
      tooltip: "The hottest planet"
    - name: "Venus"
      tooltip: "The second hottest planet"
    - name: "Earth"
      tooltip: "The planet with the hottest parties"
```

</x-code-group>

---

## Data Sources

Tooltips can retrieve content from [data sources](/core-plugins/local-data) using the `$x` syntax.

::: frame
<button x-tooltip="$x.example.tooltip">Data Source Tooltip</button>
:::

<x-code-group copy>

```html "HTML"
<button x-tooltip="$x.example.tooltip">Data Source Tooltip</button>
```

```json "example.json"
{
    "tooltip": "This content comes from a data source"
}
```

</x-code-group>

---

## Other Popovers

Although tooltips are popovers, they can coexist in buttons that trigger other popovers—like Manifest's [dropdowns](/elements/dropdowns) and [dialogs](/elements/dialogs), or your custom popovers.

::: frame
<button x-tooltip="Tooltip" x-dropdown="dropdown">Dropdown</button>
<menu popover id="dropdown" class="bottom-start">
    <li>Item 1</li>
    <li>Item 2</li>
    <li>Item 3</li>
</menu>

<button x-tooltip="Tooltip" popovertarget="dialog">Dialog</button>
<dialog popover id="dialog">
    <header>Dialog</header>
</dialog>

<button x-tooltip="Tooltip" popovertarget="custom">Custom Popover</button>
<div popover id="custom" class="m-auto p-10 border">Custom Popover</div>
:::

::: brand icon="lucide:info"
Avoid mixing `x-dropdown.hover` and `x-tooltip` on the same trigger button, since they both use the hover state.
:::

---

## Styles

### Theme

Default tooltips use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|----------|
| `--color-popover-surface` | Tooltip background color |
| `--color-content-stark` | Tooltip text color |
| `--spacing-popover-offset` | Distance from trigger element |

---

### Delay

Tooltips appear after a default 500ms hover delay, and disappear immediately when the mouse leaves the trigger element. They're automatically dismissed when the trigger is clicked or pressed. Change the duration in the [theme](/styles/theme) or with custom CSS that overwrites the `--tooltip-hover-delay` value:

```css copy
:root {
    --tooltip-hover-delay: 500ms;
}
```

---

### Customization

Modify styles with custom CSS for the `.tooltip` classes.

```css copy
.tooltip { 
    background: red;
}
```