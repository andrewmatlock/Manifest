# Code Blocks

---

## Setup

Code blocks style have their own stylesheet (independent of `manifest.css`) and reference [theme](/styles/theme) variables.

Code block functionality is included in `manifest.js` with all core plugins, or it can be selectively loaded.

<x-code-group copy>

```html "All Plugins (default)"
<!-- Code block styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.code.min.css" />

<!-- Manifest JS -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<!-- Code block styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.code.min.css" />

<!-- Manifest JS: code plugin only -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
  data-plugin="code"></script>
```

</x-code-group>

---

## Default

Use the `<x-code>` custom element for syntax highlighting.

::: frame
<x-code language="javascript">
function hello() {
  console.log('Hello, World!');
  return true;
}
</x-code>
:::

```html copy
<x-code language="javascript">
function hello() {
  console.log('Hello, World!');
  return true;
}
</x-code>
```

The code block plugin uses <a href="https://highlightjs.org" target="_blank">highlight.js</a>, which is automatically loaded from its CDN when an `x-code` directive is encountered in the current view.

See the [markdown](/core-plugins/markdown) plugin for how ``` represents `x-code` tags in markdown files.

---

## Attributes

::: frame
<x-code language="javascript" title="Function" numbers copy>
function hello() {
  console.log('Hello, World!');
  return true;
}</x-code>
:::

```html copy
<x-code language="javascript" title="Function" numbers copy>
function hello() {
  console.log('Hello, World!');
  return true;
}
</x-code>
```

`x-code` tags support the following attributes:
- `language` - specifies syntax highlighting from the <a href="https://highlightjs.readthedocs.io/en/latest/supported-languages.html" target="_blank">highlight.js</a> library.
- `title` - adds a header with title to the block.
- `numbers` - adds line numbers.
- `copy` - adds a button for users to copy the code snippet.

---

## Code Groups

Group multiple code blocks with tabs using `<x-code-group>`.

::: frame
<x-code-group numbers copy>

<x-code language="html" name="HTML"><div class="container">
  <h1>Hello World</h1>
</div></x-code>

<x-code language="css" name="CSS">
.container {
  display: flex;
  justify-content: center;
}
</x-code>

<x-code language="javascript" name="JavaScript">
function hello() {
  console.log('Hello, World!');
}
</x-code>

</x-code-group>
:::

```html numbers copy
<!-- Group -->
<x-code-group numbers copy>

  <!-- Snippet tab -->
  <x-code language="html" name="HTML">
  <div class="container">
    <h1>Hello World</h1>
  </div>
  </x-code>

  <!-- Snippet tab -->
  <x-code language="css" name="CSS">
  .container {
    display: flex;
    justify-content: center;
  }
  </x-code>

  <!-- Snippet tab -->
  <x-code language="javascript" name="JavaScript">
  function hello() {
    console.log('Hello, World!');
  }
  </x-code>

</x-code-group>
```

The `numbers` and `copy` attributes can be added to the `x-code-group` tag and will apply to all tabs.

---

## Copy Icons

`--icon-copy-code` and `--icon-copied-code` are variables with encoded SVGs, found in code block styles. To modify them:

1. Choose a desired icon from <a href="https://icon-sets.iconify.design/" target="_blank">Iconify</a> or other SVG icon source.
2. Copy the encoded SVG string (in Iconify, go to an icon's CSS tab and find the <code>--svg</code> value). Otherwise, use an <a href="https://yoksel.github.io/url-encoder/" target="_blank">SVG encoder</a>.
3. Overwrite the `--icon-copy-code` or `--icon-copied-code` variable value with the encoded SVG string.

```css "Default icons" copy
:root {
  --icon-copy-code: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cg fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2'%3E%3Crect width='14' height='14' x='8' y='8' rx='2' ry='2'/%3E%3Cpath d='M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2'/%3E%3C/g%3E%3C/svg%3E");
  --icon-copied-code: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24'%3E%3Cpath fill='none' stroke='%23000' stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M20 6L9 17l-5-5'/%3E%3C/svg%3E");
}
```

---

## Styles

### Theme

Default code blocks use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-field-surface` | Code block background |
| `--color-content-stark` | Default text color |
| `--spacing-field-padding` | Content padding |
| `--radius` | Border radius |

Additional text color variables like `--color-code-keyword` for syntax highlighting are found within `manifest.code.css`.

---

### Syntax Colors

Override syntax highlighting colors with CSS variables:

```css copy
:root {
    --color-code-keyword: #ff6b6b;
    --color-code-string: #4ecdc4;
    --color-code-comment: #95a5a6;
}
```

The full list of colors can be found in the default code block styles.

---

### Customization

Modify code block styles with custom CSS.

::: frame
<style>
x-code-group.custom, x-code.custom, [x-code].custom {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-line);
  border-radius: 0;

  /* Title header */
  & > header {
      font-family: var(--font-mono);
      font-weight: bold;

    /* Tab buttons */
    & button[role=tab] {
    
      /* Selected tab */
      &.selected {
        background-color: var(--color-accent-content);

        /* Underline */
        &::after {
          background-color: var(--color-accent-content);
        }
      }
    }
  }

  /* Line numbers */
  & .lines {
    background-color: var(--color-surface-2);
    border-radius: 0;
  }

  /* Code area */
  & pre {
    background: var(--color-surface-3);
    border-radius: 0;
  }

  /* Copy button */
  & .copy {
    background-color: transparent;
    border-radius: 0;
  }
}
</style>

<x-code class="custom" language="html" title="Custom styles" copy numbers>
<div>This is a custom styled code block</div>
</x-code>

:::
```css numbers copy
x-code-group, x-code, [x-code] {
  background-color: var(--color-surface-1);
  border: 1px solid var(--color-line);
  border-radius: 0;

  /* Title header */
  & > header {
      font-family: var(--font-mono);
      font-weight: bold;

    /* Tab buttons */
    & button[role=tab] {
    
      /* Selected tab */
      &.selected {
        background-color: var(--color-accent-content);

        /* Underline */
        &::after {
          background-color: var(--color-accent-content);
        }
      }
    }
  }

  /* Line numbers */
  & .lines {
    background-color: var(--color-surface-2);
    border-radius: 0;
  }

  /* Code area */
  & pre {
    background: var(--color-surface-3);
    border-radius: 0;
  }

  /* Copy button */
  & .copy {
    background-color: transparent;
    border-radius: 0;
  }
}
```