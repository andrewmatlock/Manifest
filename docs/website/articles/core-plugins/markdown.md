# Markdown

Populate HTML from markdown content.

---

## Overview

The markdown plugin uses <a href="https://marked.js.org/" target="_blank">marked.js</a>, which is automatically loaded from its CDN when an `x-markdown` directive is encountered in the current view. Parsed markdown content is cached to avoid re-processing if unchanged.

All headings generated from markdown content (`<h1>` to `<h6>`elements) will have IDs automatically generated for anchor linking.

---

## Setup

Markdown is included in `manifest.js` with all core plugins, or can be selectively loaded.

<x-code-group copy>

```html "All Plugins (default)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="markdown"></script>
```

</x-code-group>

---

## Inline Content

Markdown can be written directly inside elements using the `x-markdown` directive, with content wrapped in apostrophes.

::: frame p-10
<div>This is <strong>bold</strong> and <em>italic</em> text with a <a href="/">link</a>.</div>
:::

```html copy
<div x-markdown="'This is **bold** and *italic* text with a [link](/).'"></div>
```

---

## Dynamic Content

Markdown content can use Alpine expressions for dynamic updates, including template literals with variables.

::: frame p-10
<div x-data="{ title: 'Your Bank Account', count: 0 }" class="col gap-4">
      <span class="h3" x-text="title"></span>
      <p>Your balance is $<strong x-text="count"></strong></p>
    <button @click="count++">Print Money</button>
</div>
:::

```html copy
<div x-data="{ title: 'Your Bank Account', count: 0 }">
    <div x-markdown="`# ${title}
      Your balance is $**${count}**.`"
    ></div>
    <button @click="count++">Print Money</button>
</div>
```

---

## File Content

Load markdown content from external `.md` files by providing a file path like `x-markdown="/assets/menu.md"`.

::: frame col p-10
<span class="h3">Menù del Giornaliero</span>
<ul>
  <li>Vitello alla Milanese</li>
  <li>Lasagna alla Bolognese Bianca</li>
  <li>Grilled Cheese n' Taters</li>
</ul>
:::

<x-code-group>

```html "HTML" copy
<div x-markdown="'/assets/menu.md'"></div>
```

```markdown "menu.md"
### Menù del Giornaliero
- Vitello alla Milanese
- Lasagna alla Bolognese Bianca
- Grilled Cheese n' Taters
```

</x-code-group>

### From Data Source

The markdown file's path can also be populated from a [data source](/core-plugins/local-data).

::: frame col p-10
<span class="h3">Burn Book</span>
<small>By Regina George</small>
<p>This girl is the nastiest skank bitch I've ever met.<br>Do not trust her.<br>She is a fugly slut!!</p>
:::

<x-code-group copy>

```html "HTML"
<h3 x-text="$x.blog.title"></h3>
<small>By <span>x-text="$x.blog.author"</span></small>
<div class="prose" x-markdown="$x.blog.article"></div>
```

```json "blog.json"
...
{
  "title": "Burn Book"
  "author": "Regina George"
  "article": "/content/burn-book.md"
},
...
```

```markdown "burn-book.md"
This girl is the nastiest skank bitch I've ever met.
Do not trust her.
She is a fugly slut!!
```

</x-code-group>

This approach is ideal for blogs, articles, or any content managed through data sources that can leverage markdown files rather than large text blocks. It's also possible to make loading contingent on a URL route (e.g. `.../blog/burn-book`), use the `$route()` function:

<x-code-group copy>

```html "HTML"
<div class="prose" x-show="$x.blog.$route('path')" x-markdown="$x.blog.$route('path').article"></div>
```

```json "blog.json"
...
{
  "path": "burn-book"
  "title": "Burn Book"
  "author": "Regina George"
  "article": "/content/burn-book.md"
},
...
```

</x-code-group>

The `$route('path')` function searches the data source for an item where an arbitrary property like `path` matches any segment of the current URL. When found, it returns that item, allowing access to its other properties like `article`. This enables route-specific content loading without manual URL parsing, and is how this very Markdown article is rendered.

---

## Markdown Syntax

See this <a href="https://www.markdownguide.org/basic-syntax/" target="_blank">Markdown Guide</a> for supported syntax in addition to HTML. Manifest also provides additional support for components, callouts, previews, and code blocks.

### Components

A [component tag](/core-plugins/components) placed in a markdown file will render the component in position.


::: frame col p-10
<p>Kaffee: I WANT THE TRUTH!</p>
<p>Col. Jessup: YOU CAN'T HANDLE THE TRUTH!</p>

<x-disclaimer></x-disclaimer>
:::

<x-code-group>

```markdown "Markdown"
Kaffee: I WANT THE TRUTH!
Col. Jessup: YOU CAN'T HANDLE THE TRUTH!

<x-disclaimer></x-disclaimer>
```

```html "disclaimer.html"
<figcaption><span x-icon="lucide:info"></span>This is not legal advice.</figcaption>
```

</x-code-group>

---

### Callouts

Callouts highlight specific text in a long form article. They require [utility](/styles/utilities) styles and a parent element with the `prose` class applied.

Use `:::` markers to open and close the callout. Text added to the opening marker's line are treated as CSS classes, useful for adding styles like Manifest utility colors. A leading [icon](/elements/icons) can also be added with `icon="..."` anywhere in the same line.

::: frame col !gap-0
<aside class="m-0">Default callout</aside>

<aside class="brand"><b>Brand callout</b><br>Callouts accept markdown syntax inside.</aside>

<aside class="accent">
  <span x-icon="lucide:info"></span>
  <div>
    <b>Accent callout</b><br>
    <p>A leading icon can be added with <code>icon="..."</code> in the opening marker.</p>
  </div>
</aside>

<aside class="positive">
  <span x-icon="lucide:circle-check"></span>
  <div>
    <b>Positive callout</b><br>
    <p>It rubs the lotion on its skin or else it gets the hose again.</p>
  </div>
</aside>

<aside class="negative">
  <span x-icon="lucide:shield-alert"></span>
  <div>
    <b>Negative callout</b><br>
    <p>It's a trap!</p>
  </div>
</aside>
:::

<x-code-group copy>

```markdown "Default"
:::
Default callout
:::
```

```markdown "Brand"
::: brand
**Brand callout**
Callouts accept markdown syntax inside.
:::
```

```markdown "Accent"
::: accent icon="lucide:info"
**Accent callout**
A leading icon can be added with `icon="..."` in the opening marker.
:::
```

```markdown "Positive"
::: positive icon="lucide:circle-check"
**Positive callout**
It rubs the lotion on its skin or else it gets the hose again.
:::
```

```markdown "Negative"
::: negative icon="lucide:shield-alert"
**Negative callout**
It's a trap!
:::
```

</x-code-group>

Callouts are `<aside>` elements within a `prose` parent. Modify their appearance with custom CSS:

```css copy
.prose aside {
  background: yellow;
  border-radius: 0
}
```

---

### Frames

A callout can also be a visual frame when fashioned as `::: frame`.

::: frame
<img src="/assets/examples/poochie.webp">
:::
<div></div>

```html copy
::: frame
<img src="/assets/examples/poochie.webp">
:::
```

If a `::: frame` callout is directly followed by a code block or group, they are styled to appear flush as a connected block. This is useful when previewing a rendered code example, like the ones seen throughout these Manifest articles.

::: frame
<div class="text-4xl p-2 bg-surface-3 border border-line" x-icon="mdi:emoticon-dead"></div>
<blockquote>"What's in the box?!"</blockquote>
:::

```html
<!-- A frame followed by a code block will be flush, just like this box you're looking at -->
::: frame
  [content]
:::

&#96;&#96;&#96;html
  [content]
&#96;&#96;&#96;
```

The `frame` class provides frame styles, which can be modified with custom CSS:

```css copy
.prose aside.frame {
  background: var(--bg-surface-2);
  border-radius: 0;
}
```

---

### Code Blocks

If the project includes [code block](/elements/code) support, markdown automatically converts <code>```</code> markers to Manifest `<x-code>` elements, with syntax highlighting support.

::: frame
<x-code language="javascript" name="Example">function greet(name) {
    return `Hello, ${name}!`;
}</x-code>
:::

```html
&#96;&#96;&#96;javascript "Example"
function greet(name) {
    return `Hello, ${name}!`;
}
&#96;&#96;&#96;
```

For a group of code blocks that can be tabbed through, wrap the blocks in `<x-code-group>` tags in the markdown file, with blank lines between the tags and each block.

#### Attributes

Code blocks support useful attributes in the opening marker's line:

- **Code language** - A supported lowercase language name directly after the backticks (e.g. <code>```css</code>) enables syntax highlighting.
- **Title** - A block title (or title tab in code groups) can be added in quotes (e.g. "example.json").
- **Numbers** - Add `numbers` for line numbers.
- **Copy button** - Add `copy` for a button that copies the block's contents.

::: frame
<x-code language="javascript" title="My Script" numbers copy>
function greet(name) {
    return `Hello, ${name}!`;
}</x-code>
:::

```markdown copy
&#96;&#96;&#96;javascript "My Script" numbers copy
console.log('Hello World');
&#96;&#96;&#96;
```

Tab indents are typically preserved. If the language is HTML, HTML tags will be preserved as strings and don't require escape characters.