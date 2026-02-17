# Typography

---

## Setup

Typography styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.typography.css" />
```

</x-code-group>

---

## Block Text

::: frame col gap-3
<span class="h1">Heading 1 style</span>
<span class="h2">Heading 2 style</span>
<span class="h3">Heading 3 style</span>
<span class="h4">Heading 4 style</span>
<span class="h5">Heading 5 style</span>
<span class="h6">Heading 6 style</span>
<p>Paragraph. Lorem ipsum dolar sit amet.</p>
<small>Small text. Lorem ipsum dolar sit amet.</small>
<figcaption>Caption. Lorem ipsum dolar sit amet.</figcaption>
<ul>
    <li>List item. Lorem ipsum dolar sit amet.</li>
    <li>List item. Lorem ipsum dolar sit amet.</li>
</ul>
<ol>
    <li>List item. Lorem ipsum dolar sit amet.</li>
    <li>List item. Lorem ipsum dolar sit amet.</li>
</ol>
<blockquote>Blockquote. Lorem ipsum dolar sit amet.</blockquote>
:::

```html copy
<h1>Heading 1</h1>
<h2>Heading 2</h2>
<h3>Heading 3</h3>
<h4>Heading 4</h4>
<h5>Heading 5</h5>
<h6>Heading 6</h6>
<p>Paragraph. Lorem ipsum dolar sit amet.</p>
<small>Small text. Lorem ipsum dolar sit amet.</small>
<figcaption>Caption. Lorem ipsum dolar sit amet.</figcaption>
<figcaption>Caption. Lorem ipsum dolar sit amet.</figcaption>
<ul>
    <li>List item. Lorem ipsum dolar sit amet.</li>
    <li>List item. Lorem ipsum dolar sit amet.</li>
</ul>
<ol>
    <li>List item. Lorem ipsum dolar sit amet.</li>
    <li>List item. Lorem ipsum dolar sit amet.</li>
</ol>
<blockquote>Blockquote. Lorem ipsum dolar sit amet.</blockquote>
```

See [code blocks](/core-plugins/code) for use of the `<pre>` element.

---

## Inline Text
::: frame col gap-3
<p>Text can be <b>bold</b> or <strong>strong</strong>.</p>
<p>It can also be <i>italic</i> or <em>emphasized</em>.</p>
<p>Text often contains <a href="#">inline links</a>.</p>
<p>Inline <code>code</code> and keyboard tags like <kbd>SHIFT</kbd><kbd>⌘</kbd><kbd>Z</kbd> are handy.</p>
:::

```html copy
<p>Text can be <b>bold</b> or <strong>strong</strong>.</p>
<p>It can also be <i>italic</i> or <em>emphasized</em>.</p>
<p>Text often contains <a href="#">inline links</a>.</p>
<p>Inline <code>code</code> and keyboard tags like <kbd>SHIFT</kbd><kbd>⌘</kbd><kbd>Z</kbd> are handy.</p>
```

See [badges](/elements/badges) for use of the `<mark>` tag.

---

## Lists

List styles are carefully styled to keep markers aligned with content above and below, rather than default browser behaviour where they float outside.

::: frame !block
<p>This is a preceding paragraph.</p><br>
<ul>
    <li>First level item</li>
    <ul>
        <li>Second level item</li>
        <li>Another second level item</li>
        <ol>
            <li>Third level ordered item</li>
            <li>Another third level item</li>
        </ol>
    </ul>
    <li>Another first level item</li>
</ul><br>
<p>This is a following paragraph</p>
:::

```html copy
<ul>
    <li>First level item
        <ul>
            <li>Second level item</li>
            <li>Another second level</li>
            <ol>
                <li>Third level ordered</li>
                <li>Another third level</li>
            </ol>
        </ul>
    </li>
    <li>Another first level</li>
</ul>
```

### Icon Markers

List markers can be overwritten with inline [icons](/core-plugins/icons) using the `x-icon` attribute. The generated SVG is placed directly before any text content.

::: frame
<ul>
    <li>Regular marker</li>
    <li x-icon="lucide:house">House icon marker</li>
    <li x-icon="lucide:heart">Heart icon marker</li>
    <li x-icon="lucide:check">Check icon marker</li>
</ul>
:::

```html copy
<ul>
    <li>Regular marker</li>
    <li x-icon="lucide:house">House icon marker</li>
    <li x-icon="lucide:heart">Heart icon marker</li>
    <li x-icon="lucide:check">Checkmark icon marker</li>
</ul>
```

Depending on your icon library's baked-in padding, you may wish to adjust marker positioning. Override default CSS by adjusting the `top` and `left` properties:

```css copy
/* Target text lists while omitting nav and menu lists */
:where(ol):not(nav ol):not(menu ol),
:where(ul):not(nav ul):not(menu ul) {

    /* Target list items with the x-icon attribute */
    & li:has([x-icon] {

        /* Target the generated icon marker */
        & [x-icon] {
                position: absolute;
                top: 0.45ch;
                left: -1.75ch
            }
        }
    }
}
```

---

## Utilities

Text elements accept [utility](/styles/utilities) classes, which can be stacked in any combination.

### Elements

Utility classes named for a corresponding text element will apply that element's styles to any other.

| Class | Description |
|--------------|---------------------|
| `h1` | Heading 1 styles |
| `h2` | Heading 2 styles |
| `h3` | Heading 3 styles |
| `h4` | Heading 4 styles |
| `h5` | Heading 5 styles |
| `h6` | Heading 6 styles |
| `paragraph` | Paragraph styles |
| `small` | Small text styles |
| `caption` | Caption/figcaption styles |

::: frame col gap-3
These are all spans:
<span class="h1">Heading 1 style</span>
<span class="h2">Heading 2 style</span>
<span class="h3">Heading 3 style</span>
<span class="h4">Heading 4 style</span>
<span class="h5">Heading 5 style</span>
<span class="h6">Heading 6 style</span>
<span class="paragraph">Paragraph style</span>
<span class="small">Small text style</span>
<span class="caption">Caption style</span>
:::

```html copy
<span class="h1">Heading 1 style</span>
<span class="h2">Heading 2 style</span>
<span class="h3">Heading 3 style</span>
<span class="h4">Heading 4 style</span>
<span class="h5">Heading 5 style</span>
<span class="h6">Heading 6 style</span>
<span class="paragraph">Paragraph style</span>
<span class="small">Small text style</span>
<span class="caption">Caption style</span>
```

---

### Colors

All text elements accept Manifest color utility classes, either directly or inherited from a parent.

#### Direct

::: frame col gap-3
<span class="h3 stark">Lorem ipsum dolar sit amet.</span>
<span class="h3 neutral">Lorem ipsum dolar sit amet.</span>
<span class="h3 subtle">Lorem ipsum dolar sit amet.</span>
<span class="h3 brand">Lorem ipsum dolar sit amet.</span>
<span class="h3 accent">Lorem ipsum dolar sit amet.</span>
<span class="h3 positive">Lorem ipsum dolar sit amet.</span>
<span class="h3 negative">Lorem ipsum dolar sit amet.</span>
:::

```html copy
<!-- Stark variant -->
<h3 class="stark">Lorem ipsum dolar sit amet.</h3>

<!-- Neutral variant -->
<h3 class="neutral">Lorem ipsum dolar sit amet.</h3>

<!-- Subtle variant -->
<h3 class="subtle">Lorem ipsum dolar sit amet.</h3>

<!-- Brand variant -->
<h3 class="brand">Lorem ipsum dolar sit amet.</h3>

<!-- Accent variant -->
<h3 class="accent">Lorem ipsum dolar sit amet.</h3>

<!-- Positive variant -->
<h3 class="positive">Lorem ipsum dolar sit amet.</h3>

<!-- Negative variant -->
<h3 class="negative">Lorem ipsum dolar sit amet.</h3>
```

#### Inherited

::: frame col gap-3
<div class="h3 stark">
    <span>Lorem ipsum dolar sit amet.</span>
</div>
<div class="h3 neutral">
    <span>Lorem ipsum dolar sit amet.</span>
</div>
<div class="h3 subtle">
    <span>Lorem ipsum dolar sit amet.</span>
</div>
<div class="h3 brand">
    <span>Lorem ipsum dolar sit amet.</span>
</div>
<div class="h3 accent">
    <span>Lorem ipsum dolar sit amet.</span>
</div>
<div class="h3 positive">
    <span>Lorem ipsum dolar sit amet.</span>
</div>
<div class="h3 negative">
    <span>Lorem ipsum dolar sit amet.</span>
</div>
:::

```html copy
<!-- Stark variant -->
<div class="stark">
    <h3>Lorem ipsum dolar sit amet.</h3>
</div>

<!-- Neutral variant -->
<div class="neutral">
    <h3>Lorem ipsum dolar sit amet.</h3>
</div>

<!-- Subtle variant -->
<div class="subtle">
    <h3>Lorem ipsum dolar sit amet.</h3>
</div>

<!-- Brand variant -->
<div class="brand">
    <h3>Lorem ipsum dolar sit amet.</h3>
</div>

<!-- Accent variant -->
<div class="accent">
    <h3>Lorem ipsum dolar sit amet.</h3>
</div>

<!-- Positive variant -->
<div class="positive">
    <h3>Lorem ipsum dolar sit amet.</h3>
</div>

<!-- Negative variant -->
<div class="negative">
    <h3>Lorem ipsum dolar sit amet.</h3>
</div>
```

---

## Styles

### Theme

Default text elements use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-content-stark` | High contrast text color |
| `--color-content-neutral` | Medium contrast text |
| `--color-content-subtle` | Low contrast text color |
| `--spacing` | Base spacing unit used for blockquote spacing |
| `--radius` | Border radius for inline code and kbd elements |
| `--transition` | Transition duration for link hover states |
| `--font-sans` | Sans-serif font stack applied to all elements by default |
| `--font-mono` | Monospace font stack for code elements |

---

### Fonts

The global font and text color is set in the [theme](/styles/theme), with the default value being the user's system UI font or fallbacks. To apply a different font to individual text elements, use custom CSS to modify its `font-family` property (like in the Customization example below).

`<pre>` and `<code>` elements have a specialty font set by separate [code styles](/core-plugins/code#styles), and otherwise use the user's system monospace font or other fallbacks.

---

### Customization

Modify base text element styles with custom CSS for its respective selector.

::: frame
<style>
.h3.custom {
    font-family: Playfair Display, Abril Fatface;
    font-style: italic;
}
</style>

<span class="h3 custom">This is a custom h3 element.</span>
:::

```css
h3 {
    font-family: Playfair Display, Abril Fatface;
    font-style: italic;
}
```