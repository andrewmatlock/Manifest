# Toasts

---

## Setup

Toast styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

Toast functionality is included in `manifest.js` with all core plugins, or it can be selectively loaded.

<x-code-group copy>

```html "Manifest CSS / JS"
<!-- Manifest CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.code.min.css" />

<!-- Manifest JS -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Standalone"
<!-- Toast styles only -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.code.min.css" />

<!-- Manifest JS: toast plugin only -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
  data-plugin="toasts"></script>
```

</x-code-group>

---

## Default

Toasts can be triggered from any element using the `x-toast` directive, with its value being the content. They automatically disappear after 3 seconds, though the timer will pause on hover. Toasts will stack if multiple are triggered concurrently.

::: frame
<button x-toast="This is a basic toast notification">Show Toast</button>
:::

```html copy
<button x-toast="This is a basic toast notification">Show Toast</button>
```

---

## Modifiers

### Colors

Color modifiers provide unique visual context.

::: frame
<button x-toast="Default toast notification">Default</button>
<button x-toast.brand="Brand toast notification">Brand</button>
<button x-toast.accent="Accent toast notification">Accent</button>
<button x-toast.positive="Operation completed successfully">Positive</button>
<button x-toast.negative="Something went wrong">Negative</button>
:::

```html copy
<button x-toast="Default toast notification">Default</button>
<button x-toast.brand="Brand toast notification">Brand</button>
<button x-toast.accent="Accent toast notification">Accent</button>
<button x-toast.positive="Operation completed successfully">Positive</button>
<button x-toast.negative="Something went wrong">Negative</button>
```

---

### Duration

A number sets how long the toast remains visible in milliseconds.

::: frame
<button x-toast.1000="Dismisses after 1 second">1 Second</button>
<button x-toast="Default 3 seconds">Default</button>
<button x-toast.5000="Dismisses after 5 seconds">5 Seconds</button>
:::

```html copy
<button x-toast.1000="Dismisses after 1 second">1 Second</button>
<button x-toast="Default 3 seconds">Default</button>
<button x-toast.5000="Dismisses after 5 seconds">5 Seconds</button>
```

---

### Dismiss

The dismiss modifier enables manual closing.

::: frame
<button x-toast.dismiss="Can be manually dismissed">Dismissible</button>
<button x-toast.positive.dismiss="Positive with dismiss button">Positive Dismissible</button>
<button x-toast.negative.dismiss="Negative with dismiss button">Negative Dismissible</button>
:::

```html copy
<button x-toast.dismiss="Can be manually dismissed">Dismissible</button>
<button x-toast.positive.dismiss="Positive with dismiss button">Positive Dismissible</button>
<button x-toast.negative.dismiss="Negative with dismiss button">Negative Dismissible</button>
```

---

### Fixed

The fixed modifier prevents the default auto-dismiss behaviour and adds the dismiss button by default.

::: frame
<button x-toast.fixed="Stays until manually closed">Fixed</button>
<button x-toast.positive.fixed="Fixed positive notification">Fixed Positive</button>
<button x-toast.negative.fixed="Fixed negative notification">Fixed Negative</button>
:::

```html copy
<button x-toast.fixed="Stays until manually closed">Fixed</button>
<button x-toast.positive.fixed="Fixed positive notification">Fixed Positive</button>
<button x-toast.negative.fixed="Fixed negative notification">Fixed Negative</button>
```

---

### Combined

Combine different modifiers for complex toast behaviors.

::: frame
<button x-toast.negative.dismiss.2000="Negative toast with 2s duration and dismiss button">Negative + Dismiss + 2s</button>
<button x-toast.positive.fixed="Positive toast that stays until dismissed">Positive + Fixed</button>
:::

```html copy
<button x-toast.negative.dismiss.2000="Negative toast with 2s duration and dismiss button">Negative + Dismiss + 2s</button>
<button x-toast.positive.fixed="Positive toast that stays until dismissed">Positive + Fixed</button>
```

---

## Magic Method

Use the `$toast` magic method for programmatic toast creation.

::: frame row-wrap
<button @click="$toast('Programmatic toast')">Basic Magic</button>
<button @click="$toast.brand('Brand via magic method')">Brand Magic</button>
<button @click="$toast.positive('Positive via magic method')">Positive Magic</button>
<button @click="$toast.negative('Negative via magic method')">Negative Magic</button>
<button @click="$toast.negative.fixed('Fixed negative toast')">Fixed Negative Magic</button>
:::

```html copy
<button @click="$toast('Programmatic toast')">Basic Magic</button>
<button @click="$toast.brand('Brand via magic method')">Brand Magic</button>
<button @click="$toast.positive('Positive via magic method')">Positive Magic</button>
<button @click="$toast.negative('Negative via magic method')">Negative Magic</button>
<button @click="$toast.negative.fixed('Fixed negative toast')">Fixed Negative Magic</button>
```

---

## Rich Content

Rich content supports HTML including [icons](/elements/icons) for enhanced formatting.

::: frame
<button x-toast.fixed="<span x-icon='lucide:info'></span>Hello <b>bold</b> and <em>italic</em> world">Rich Content</button>
:::

```html copy
<button x-toast="<span x-icon='lucide:info'></span>Hello <b>bold</b> and <em>italic</em> world">Rich Content</button>
```

---

## Dynamic Expressions

Toast content can include dynamic expressions and variables.

::: frame
<button x-data="{ count: 0 }" @click="count++; $toast(`Button clicked ${count} times`)">
    Dynamic Count (<span x-text="count"></span>)
</button>

<button x-toast="`Current time: ${new Date().toLocaleTimeString()}`">
    Current Time
</button>
:::

```html copy
<button x-data="{ count: 0 }" @click="count++; $toast(`Button clicked ${count} times`)">
    Dynamic Count (<span x-text="count"></span>)
</button>

<button x-toast="`Current time: ${new Date().toLocaleTimeString()}`">
    Current Time
</button>on>
</div>
```

---

## Dynamic Data

Toasts can retrieve content from [data sources](/core-plugins/local-data) using the `$x` syntax.

::: frame
<button x-toast="$x.example.toast">Data Source Toast</button>
:::

<x-code-group copy>

```html "HTML"
<button x-toast="$x.example.toast">Data Source Toast</button>
```

```json "example.json"
{
    "toast": "This content comes from a data source"
}
```

</x-code-group>

---

## Styles

### Theme

Default toasts use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|----------|
| `--color-popover-surface` | Default toast background color |
| `--color-content-stark` | Default toast text color |
| `--spacing` | Base spacing unit for gaps and padding |
| `--radius` | Border radius for toast corners |

---

### Dismiss Button Icon

The dismiss button icon is an encoded SVG in the toast style's `--icon-toast-dismiss` variable. To modify it:
1. Choose a desired icon from <a href="https://icon-sets.iconify.design/" target="_blank">Iconify</a> or other SVG icon source.
2. Copy the encoded SVG string (in Iconify, go to an icon's CSS tab and find the `--svg` value). Otherwise, use an <a href="https://yoksel.github.io/url-encoder/" target="_blank">SVG encoder</a>.
3. Overwrite the `--icon-toast-dismiss` variable value with the encoded SVG string.

```css "Default toast dismiss icon" copy
:root {
    --icon-toast-dismiss: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M18 6L6 18M6 6l12 12'/%3E%3C/svg%3E")
}
```

---

### Customization

Modify styles with custom CSS for various toast classes.

```css numbers copy
/* Parent wrapper for multiple toasts */
.toast-container { 
    position: fixed;
    top: 3rem;
    left: auto;
    right: 3rem;
}

/* Toast */
.toast { 
    background: white;

    /* Content area */
    .toast-content { 
        font-size: 1rem; 
    }

    /* Dismiss button */
    .toast-dismiss-button { 
        color: gray; 
    }
}

/* Entry animation */
.toast-entry { 
    opacity: 1; 
}

/* Exit animation */
.toast-exit { 
    opacity: 0; 
}
```