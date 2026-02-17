# Icons

---

## Setup

Icons are included in `manifest.js` with all core plugins, or can be selectively loaded.

<x-code-group copy>

```html "All Plugins (default)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="icons"></script>
```

</x-code-group>

Manifest makes icons easy, providing access to over 200,000 open source icons from every major library, courtesy of <a href="https://iconify.design/" target="_blank" rel="noopener">Iconify</a>. Iconify's lightweight script is bundled into the above Manifest scripts.

---

## Usage


Icons are inserted into any HTML element with the `x-icon` attributes.

::: frame
<i class="h1" x-data x-icon="lucide:house"></i>
:::

```html copy
<i x-icon="lucide:house"></i>
```


Browse the <a href="https://icon-sets.iconify.design/" target="_blank" rel="noopener">Iconify library</a> for available icon values like the `lucide:house` example above. The letters before the colon are the icon library code (e.g. `lucide`), and the string after is the individual icon name (e.g. `house`). If an icon doesn't render, double check the value.

---

### Inline Icons

When an icon renders, a child SVG is generated at runtime within the parent element. This overwrites any other children of the parent element. To preserve children, place the `x-icon` attribute in its own child element like a `<span>` or `<i>` tag.

::: frame col !gap-6
<div class="h3"><span x-icon="lucide:house"></span> Lorem ipsum</div>
<button><span x-icon="lucide:house"></span> Home</button>
:::

```html copy
<h3><i x-icon="lucide:house"></i> Lorem ipsum.</h3>
<button><span x-icon="lucide:house"></span> Home</button>
```

---

### Dynamic Icons

Icons can be switched dynamically with Alpine expressions. Click the example button to swap icons.

::: frame
<div x-data="{ icon: 'lucide:house' }">
    <button @click="icon = icon === 'lucide:house' ? 'lucide:building' : 'lucide:house'" aria-label="Toggle" x-icon="icon"></button>
</div>
:::

```html copy
<div x-data="{ icon: 'lucide:house' }">
    <button @click="icon = icon === 'lucide:house' ? 'lucide:building' : 'lucide:house'" aria-label="Toggle" x-icon="icon"></button>
</div>
```

---

### Collection Icons

`x-icon` can get its value from a [data source](/core-plugins/local-data).

::: frame
<span class="h1" x-icon="$x.example.icon"></span>
:::

<x-code-group copy>

```html "HTML"
<span x-icon="$x.example.icon"></span>
```

```json "example.json"
{
    "icon": "lucide:aperture"
}
```

</x-code-group>

---

## Styles

Icons are treated like text and inherit parent text properties like `font-size` and `color`.

Certain elements like [buttons](/elements/buttons) have unique styles to ensure icons always appear nicely inline, on their own, or alongside text.