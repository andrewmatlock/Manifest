# Theme
Easy and scalable global style management.

---

## Overview

Manifest centralizes project theme management with a curated set of CSS variables, sometimes referred to as design tokens. These variables are referenced throughout Manifest's base HTML styles, utility classes, and can be compiled as custom utility classes—establishing your project's attractive and consistent visual identity with minimal code.

::: brand icon="lucide:info"
Many Manifest styles reference the theme. If the theme file or a variable within is unavailable, affected styles use a static fallback value.
:::

---

## Setup

Apply the theme alongside `manifest.css` or standalone sheets. The default version is available through CDN for previewing:

<x-code-group copy>

```html "Manifest CSS"
<!-- Theme -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.theme.css">

<!-- manifest.css -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css">
```

```html "Standalone"
<!-- Theme -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.theme.css">

<!-- Examples of standalone styles with theme references -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.buttons.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.utilities.css">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.typography.css">
```

</x-code-group>

Modify the theme by saving it as a local file from <a href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.theme.css" target="_blank">jsDelivr</a> or <a href="https://github.com/andrewmatlock/Manifest/tree/master/dist/manifest.theme.css" target="_blank">GitHub</a>, or copy it here:

```css "manifest.theme.css" copy numbers
:root,
::selection {
    
    /* Default palette */
    --color-50: oklch(100% 0 0);
    --color-100: oklch(98.17% 0.0005 95.87);
    --color-200: oklch(96.27% 0.0026 252.34);
    --color-300: oklch(91.79% 0.0029 264.26);
    --color-400: oklch(89.24% 0.0024 12.48);
    --color-500: oklch(67.4% 0.0318 251.27);
    --color-600: oklch(48.26% 0.0365 255.09);
    --color-700: oklch(28.7% 0.030787 270.1);
    --color-800: oklch(20.7% 0.026326 268.7);
    --color-900: oklch(16.6% 0.026 267);
    --color-950: oklch(3.89% 0.0181 262.25);

    /* Light theme */
    --color-page: var(--color-50);
    --color-surface-1: var(--color-100);
    --color-surface-2: var(--color-200);
    --color-surface-3: var(--color-300);
    --color-content-stark: var(--color-900);
    --color-content-neutral: var(--color-600);
    --color-content-subtle: var(--color-500);
    --color-field-surface: var(--color-300);
    --color-field-surface-hover: var(--color-400);
    --color-field-inverse: var(--color-content-stark);
    --color-popover-surface: var(--color-page);
    --color-line: color-mix(in oklch, var(--color-content-stark) 11%, transparent);
    --color-brand-surface: #f6c07b;
    --color-brand-surface-hover: #f19b46;
    --color-brand-inverse: #763518;
    --color-brand-content: #de6618;
    --color-accent-surface: #ffccd3;
    --color-accent-surface-hover: #ffa1ad;
    --color-accent-inverse: #a50036;
    --color-accent-content: #ff637e;
    --color-positive-surface: #16a34a;
    --color-positive-surface-hover: #166534;
    --color-positive-inverse: white;
    --color-positive-content: var(--color-positive-surface);
    --color-negative-surface: #ef4444;
    --color-negative-surface-hover: #dc2626;
    --color-negative-inverse: white;
    --color-negative-content: var(--color-negative-surface);

    /* Sizes */
    --radius: 0.5rem;
    --spacing: 0.25rem;
    --spacing-content-width: 68.75rem;
    --spacing-field-padding: calc(var(--spacing) * 2.5);
    --spacing-field-height: calc(var(--spacing) * 9);
    --spacing-popover-offset: calc(var(--spacing) * 2);
    --spacing-resize-handle: 1rem;
    --spacing-viewport-padding: 5vw;

    /* Effects */
    --transition: all .05s ease-in-out;
    --tooltip-hover-delay: 1s;

    /* Fonts */
    --font-sans: ui-sans-serif, system-ui, sans-serif, 'Apple Color Emoji', 'Segoe UI Emoji', 'Segoe UI Symbol', 'Noto Color Emoji';

    /* Icons */
    --icon-accordion: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1em' height='1em' viewBox='0 0 256 256'%3E%3Cpath fill='%23000' d='m184.49 136.49l-80 80a12 12 0 0 1-17-17L159 128L87.51 56.49a12 12 0 1 1 17-17l80 80a12 12 0 0 1-.02 17'/%3E%3C/svg%3E");
    --icon-checkbox: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 20 20'%3E%3Cpath fill='currentColor' d='m0 11l2-2l5 5L18 3l2 2L7 18z'/%3E%3C/svg%3E");
    --icon-toast-dismiss: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='currentColor' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M18 6L6 18M6 6l12 12'/%3E%3C/svg%3E");
}

/* Dark theme overrides */
.dark {
    --color-page: var(--color-950);
    --color-surface-1: var(--color-900);
    --color-surface-2: var(--color-800);
    --color-surface-3: var(--color-700);
    --color-field-surface: var(--color-700);
    --color-field-surface-hover: var(--color-600);
    --color-popover-surface: var(--color-700);
    --color-content-stark: var(--color-50);
    --color-content-neutral: var(--color-400);
    --color-content-subtle: var(--color-500);
    --color-brand-content: #f6c07b;
    --color-accent-content: #ffa1ad;
}

@layer base {

    /* Default font and colors */
    :where(html),
    :host {
        line-height: 1.5;
        font-family: var(--font-sans);
        color: var(--color-content-stark, inherit);
        background-color: var(--color-page, inherit)
    }

    /* Text selection */
    ::selection {
        background-color: color-mix(in oklch, var(--color-surface-1) 92%, var(--color-content-stark))
    }

    /* Focus state */
    :where(:focus-visible),
    :where(label:has(input, button, [role=button], [type=button], select, textarea):focus-within) {
        outline: none;
        box-shadow: 0 0 0 2px color-mix(in oklch, var(--color-content-stark) 35%, transparent);
    }
}
```

---

## Theme Variables

::: brand icon="lucide:info"
Certain variable names use namespace prefixes like `--color-` to automatically generate utility classes in projects using [Tailwind v4+](https://tailwindcss.com/docs/theme#theme-variable-namespaces). Examples are provided below.
:::

### Color Palette

In the default theme, a color palette of variables is referenced by most other purpose-specific color variables. Consider grabbing <a href="https://tailwindcss.com/docs/colors" target="_blank" rel="noopener">alternate palettes</a> or <a href="https://uicolors.app/generate" target="_blank" rel="noopener">generating your own</a>.

| Variable | Purpose | Ex. Tailwind Utilities |
|----------|---------|-------------------|
| `--color-50` to<br/> `--color-950` | Base color scale from lightest to darkest | `bg-color-500`<br/>`text-color-700`<br/>`border-color-300` |

---

### Theme Colors
See [color themes](/core-plugins/color-themes) for more information on setting up light and dark themes. Light/default color variables are established in a `:root`, while equivalent dark variable values go in a standalone  `.dark` style.

| Variable | Purpose | Ex. Tailwind Utilities |
|----------|---------|-------------------|
| `--color-page` | Page background color | `bg-page`<br/>`text-page` |
| `--color-surface-1` | Initial surface background | `bg-surface-1` |
| `--color-surface-2` | Next surface background | `bg-surface-2` |
| `--color-surface-3` | Last surface background | `bg-surface-3` |
| `--color-content-stark` | High contrast text color | `text-content-stark` |
| `--color-content-neutral` | Medium contrast text color | `text-neutral` |
| `--color-content-subtle` | Low contrast text color | `text-content-subtle` |
| `--color-field-surface` | Background color for interactive elements | `bg-field-surface` |
| `--color-field-surface-hover` | Hover state background for interactive elements | `hover:bg-field-surface-hover` |
| `--color-field-inverse` | Content color for interactive elements | `text-field-inverse` |
| `--color-popover-surface` | Dialog and dropdown background | `bg-popover-surface` |
| `--color-line` | Border and divider color | `border-line` |

---

### Semantic Colors
These semantic colors are easily applied to text, backgrounds, and certain form elements using the Manifest [utility](/styles/utilities) classes `brand`, `accent`, `positive`, and `negative`.

| Variable | Purpose | Ex. Tailwind Utilities |
|----------|---------|-------------------|
| `--color-brand-surface` | Brand background color | `bg-brand`<br/>`border-brand` |
| `--color-brand-surface-hover` | Brand hover state background | `hover:bg-brand-surface-hover` |
| `--color-brand-inverse` | Content color on brand backgrounds | `text-brand-inverse` |
| `--color-brand-content` | Brand text color | `text-brand-content` |
| `--color-accent-surface` | Accent background color | `bg-accent`<br/>`border-accent` |
| `--color-accent-surface-hover` | Accent hover state background | `hover:bg-accent-hover` |
| `--color-accent-inverse` | Content color on accent backgrounds | `text-accent-inverse` |
| `--color-accent-content` | Accent text color | `text-accent-content` |
| `--color-positive-surface` | Positive background color | `bg-positive`<br/>`border-positive` |
| `--color-positive-surface-hover` | Positive hover state background | `hover:bg-positive-hover` |
| `--color-positive-inverse` | Content color on positive backgrounds | `text-positive-inverse` |
| `--color-positive-content` | Positive text color | `text-positive-content` |
| `--color-negative-surface` | Negative background color | `bg-negative`<br/>`border-negative` |
| `--color-negative-surface-hover` | Negative hover state background | `hover:bg-negative-hover` |
| `--color-negative-inverse` | Content color on negative backgrounds | `text-negative-inverse` |
| `--color-negative-content` | Negative text color | `text-negative-content` |

---

### Spacing & Sizing
| Variable | Purpose | Ex. Tailwind Utilities |
|----------|---------|-------------------|
| `--radius` | Default border radius | — |
| `--spacing` | Base spacing unit | `p-1` `m-1` `gap-1` |
| `--spacing-content-width` | Maximum content width in [utility](/styles/utilities) styles | `max-w-content-width` |
| `--spacing-field-padding` | Form field padding | `p-field-padding` |
| `--spacing-field-height` | Form field height | `h-field-height` |
| `--spacing-popover-offset` | Dropdown & tooltip positioning offset | `mt-dropdown-offset` |
| `--spacing-resize-handle` | [Resize](/plugin/resize) handle width | `w-resize-handle` |
| `--spacing-viewport-padding` | Viewport padding for responsive design  in [utility](/styles/utilities) styles | `px-viewport-padding` |

---

### Effects
| Variable | Purpose | Ex. Tailwind Utilities |
|----------|---------|-------------------|
| `--transition` | Default form element transition timing | — |
| `--tooltip-hover-delay` | [Tooltip](/styles/tooltips) hover delay timing | — |

---

### Fonts
| Variable | Purpose | Ex. Tailwind Utilities |
|----------|---------|-------------------|
| `--font-sans` | Default sans-serif font stack | `font-sans` |

---

### Icons
| Variable | Purpose | Ex. Tailwind Utilities |
|----------|---------|-------------------|
| `--icon-accordion` | [Accordion](/styles/accordions) expand/collapse icon | — |
| `--icon-checkbox` | [Checkbox](/styles/checkboxes) checked state icon | — |
| `--icon-toast-dismiss` | [Toast](/styles/toasts) notification dismiss icon | — |

---

## Custom Utilities

Theme variables can be compiled into Tailwind-style custom utility classes using Manifest's utilities plugin. It's included in `manifest.js` with all core plugins, or can be selectively loaded.

<x-code-group copy>

```html "All Plugins (default)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="utilities"></script>
```

</x-code-group>


### Application

Any declared CSS variables throughout your project can be compiled into utility classes, provided they use Tailwind <a href="https://tailwindcss.com/docs/theme#theme-variable-namespaces" target="_blank" rel="noopener">namespace</a> prefixes like `--color-` or `--spacing-`. For example:

```css
:root {
    --color-brand-surface: red;
}
```

...can compile into classes like:

```css
.bg-brand { background-color: red; }
.text-brand { color: red; }
.border-brand { border-color: red; }
```

The runtime compiler is highly optimized for performance. Running concurrent to other page load events, it only generates styles for classes used in the current DOM view, and leverages caching to avoid redundant work.

For performance optimization, any non-Manifest stylesheets served over CDN are ignored. As a result, updating the generated `<style>` tag in the head is nearly instantaneous, with average execution time being 30-60ms.

---

### Tailwind Integration

The utility plugin operates independently, but follows Tailwind naming patterns and is designed to pair well with <a href="https://tailwindcss.com/docs/installation/play-cdn" target="_blank" rel="noopener">Play CDN</a>, a client-side version of Tailwind.

While it's not advertised for production use, Play CDN aligns with Manifest's ethos of being plug-and-play with no build steps, and has a typically nelgible performance impact.

`manifest.js` can load a modifed version of Play CDN that removes Tailwind's Preflight styles in favour of our [reset](/styles/reset) styles. It also removes a console warning about using Play CDN in production. Add the `data-tailwind` attribute to access it.

<x-code-group copy>

```html "With Manifest"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-tailwind></script>
```

```html "With Play CDN"
<!-- Tailwind Play CDN -->
<script src="https://cdn.jsdelivr.net/npm/@tailwindcss/browser@4"></script>

<!-- Manifest -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

</x-code-group>

Alternatively, Tailwind can be <a href="https://tailwindcss.com/docs/installation/using-vite" target="_blank" rel="noopener">directly installed</a>. It uses a build step to compile CSS variables (from `@theme { ... }` rules) into CSS utility classes, making Manifest's utility plugin redundant.