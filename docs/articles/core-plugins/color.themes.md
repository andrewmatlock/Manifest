# Color Themes

Apply light, dark, and system themes.

---

## Setup

Color themes are included in `manifest.js` with all core plugins, or can be selectively loaded.

<x-code-group copy>

```html "All Plugins (default)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="theme"></script>
```

</x-code-group>

---

## Themes

### Light/Default

The light theme is the default color mode, picking up all variable and static colors not in a `.dark` declaration.

<x-code-group>

```css "Variable"
:root {
    --color-page: #efefef;
}

.card {
    background-color: var(--color-page);
}
```

```css "Static"
.card {
    background-color: white;
}
```

</x-code-group>

See [theme](/styles/theme) styles for Manifest's suggested color variables.

---

### Dark

Use the `.dark` class to override light/default color values. The plugin operates by adding or removing the `dark` class in the `<html>` tag.

<x-code-group>

```css "Variable"
/* Light theme */
:root {
    --color-page: #efefef;
}

/* Dark theme */
.dark {
    --color-page: #000000;
}

/* Card will adjust background for current theme */
.card {
    background-color: var(--color-page);
}
```

```css "Static"
/* Light theme element */
.card {
    background-color: #eee;
}

/* Dark theme element */
.dark .card {
    background-color: #222;
}
```

</x-code-group>

Using Tailwind, dark colors can also be set in HTML using the `dark:` variant on color utility classes.

```html
<div class="bg-page dark:bg-surface-1">We're going dark</div>
```

---

### System

The system theme follows the user's system preference for light or dark mode, including automatic switching at dawn and dusk. No additional configuration is required.

---

## UI Toggles

Allow users to toggle color themes with the `x-theme` directive, using the following values:
- `'light'` sets to light theme
- `'dark'` sets to dark theme
- `'system'` sets to system theme
- `'toggle'` toggles between light and dark themes

### Buttons

::: frame
<button x-theme="'light'"><span x-icon="lucide:sun"></span><span>Light</span></button>
<button x-theme="'dark'"><span x-icon="lucide:moon"></span><span>Dark</span></button>
<button x-theme="'system'"><span x-icon="lucide:sun-moon"></span><span>System</span></button>
:::

```html copy
<button x-theme="'light'"><span x-icon="lucide:sun"></span><span>Light</span></button>
<button x-theme="'dark'"><span x-icon="lucide:moon"></span><span>Dark</span></button>
<button x-theme="'system'"><span x-icon="lucide:sun-moon"></span><span>System</span></button>
```

See [buttons](/elements/buttons) for details on the element.

---

### Toggle

::: frame
<button x-theme="'toggle'" x-icon="$theme.current === 'light' ? 'ph:moon' : 'ph:sun'" aria-label="Toggle Theme"></button>
:::

```html copy
<button x-theme="'toggle'" x-icon="$theme.current === 'light' ? 'ph:moon' : 'ph:sun'" aria-label="Toggle Theme"></button>
```

See [icons](/elements/icons) for details on conditional icons.

---

### Dropdown

::: frame
<button x-dropdown.bottom="color-theme-preview" aria-label="Color Theme Menu" x-icon="$theme.current === 'light' ? 'lucide:sun' : $theme.current === 'dark' ? 'lucide:moon' : 'lucide:sun-moon'"></button>
<menu popover id="color-theme-preview" class="min-w-0">
    <li x-theme="'light'" :disabled="$theme.current === 'light'" x-icon="lucide:sun" aria-label="Light"></li>
    <li x-theme="'dark'" :disabled="$theme.current === 'dark'" x-icon="lucide:moon" aria-label="Dark"></li>
    <li x-theme="'system'" :disabled="$theme.current === 'system'" x-icon="lucide:sun-moon" aria-label="System"></li>
</menu>
:::

```html copy
<button x-dropdown.bottom="color-theme" aria-label="Color Theme Menu" x-icon="$theme.current === 'light' ? 'lucide:sun' : $theme.current === 'dark' ? 'lucide:moon' : 'lucide:sun-moon'"></button>
<menu popover id="color-theme" disabled="min-w-0">
    <li x-theme="'light'" :disabled="$theme.current === 'light'" x-icon="lucide:sun" aria-label="Light"></li>
    <li x-theme="'dark'" :disabled="$theme.current === 'dark'" x-icon="lucide:moon" aria-label="Dark"></li>
    <li x-theme="'system'" :disabled="$theme.current === 'system'" x-icon="lucide:sun-moon" aria-label="System"></li>
</menu>
```

See [dropdowns](/elements/dropdowns) for details on the menu element.

---

## Current Theme

Display the current theme's title with `x-text="$theme.current"`:

::: frame
    <p>Join the <strong x-text="$theme.current"></strong> side</p>
:::

```html copy
<p>Join the <strong x-text="$theme.current"></strong> side</p>
```