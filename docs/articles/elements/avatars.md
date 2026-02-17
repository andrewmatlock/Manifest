# Avatars

---

## Setup

Avatar styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.avatar.css" />
```

</x-code-group>

---

## Default

The `avatar` class allows an element to display an icon, text, or a profile pic.

::: frame
<div class="avatar" x-icon="lucide:user"></div>
<div class="avatar">W</div>
<div class="avatar bg-[url(/assets/examples/user.jpg)]"></div>
<div class="avatar"><span>W</span><img src="/assets/examples/user.jpg"></div>
<div class="avatar"><figure></figure><span>W</span><img src="/assets/examples/user.jpg"></div>
:::

```html copy
<!-- Icon -->
<div class="avatar" x-icon="lucide:user"></div>

<!-- Initial -->
<div class="avatar">W</div>

<!-- Background image -->
<div class="avatar bg-[url(/assets/examples/user.jpg)]"></div>

<!-- Initials and/or profile image -->
<div class="avatar">
    <span>W</span>
    <img src="/assets/examples/user.jpg">
</div>

<!-- With status indicator -->
<div class="avatar">
    <figure></figure>
    <span>W</span>
    <img src="/assets/examples/user.jpg">
</div>
```

To display text or an icon by default while supporting an optional profile pic, use nested `<span>` and `<img>` tags. If an image is present it will render overtop the text or icon. Add a `<figure>` tag for a coloured status indicator.

---

## Interactive

Buttons accept the `avatar` class and can be used to trigger an action like opening a [dropdown](/elements/dropdowns) or [dialog](/elements/dialogs).

::: frame
<button class="avatar" x-icon="lucide:user"></button>
<button class="avatar">W</button>
<button class="avatar bg-[url(/assets/examples/user.jpg)]"></button>
<button class="avatar"><span>W</span><img src="/assets/examples/user.jpg"></button>
:::

```html copy
<!-- Icon -->
<button class="avatar" x-icon="lucide:user"></button>

<!-- Initial -->
<button class="avatar">W</button>

<!-- Background image -->
<button class="avatar bg-[url(/assets/examples/user.jpg)]"></button>

<!-- Initials and/or profile image -->
<button class="avatar">
    <span>W</span>
    <img src="/assets/examples/user.jpg">
</button>
```

---

### Picture Upload

To create an avatar button that facilitates a profile pic upload, use an input of `type="file"` within a label wrapper.

::: frame justify-start
<label role="button" class="avatar lg group overflow-visible" x-data="{ imageUrl: '' }">
    <input type="file" accept="image/*" x-ref="fileInput" @change="
        const file = $event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => imageUrl = e.target.result;
            reader.readAsDataURL(file);
        }
    " />
    <span x-show="!imageUrl" class="absolute z-2 opacity-0 group-hover:opacity-100 transition" x-icon="lucide:upload"></span>
    <span x-show="!imageUrl" class="opacity-100 group-hover:opacity-0 transition">W</span>
    <img :src="imageUrl" x-show="imageUrl">
    <button x-show="imageUrl" class="sm absolute -top-2.5 -end-2.5 z-3 rounded-full shadow opacity-0 group-hover:opacity-100 hover:opacity-100" aria-label="Remove pic" x-icon="lucide:x" @click.stop="imageUrl = ''; $refs.fileInput.value = ''"></button>
</label>
:::

```html numbers copy
<!-- Upload image button -->
<label role="button" class="avatar lg group overflow-visible" x-data="{ imageUrl: '' }">

    <!-- Hidden input -->
    <input type="file" accept="image/*" x-ref="fileInput" @change="
        const file = $event.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => imageUrl = e.target.result;
            reader.readAsDataURL(file);
        }
    " />

    <!-- Icon on initial hover -->
    <span x-show="!imageUrl" class="absolute z-2 opacity-0 group-hover:opacity-100 transition" x-icon="lucide:upload"></span>

    <!-- User's initial -->
    <span x-show="!imageUrl" class="opacity-100 group-hover:opacity-0 transition">W</span>

    <!-- Profile pic -->
    <img :src="imageUrl" x-show="imageUrl">

    <!-- Remove button -->
    <button x-show="imageUrl" class="sm absolute -top-2.5 -end-2.5 z-3 rounded-full shadow opacity-0 group-hover:opacity-100 hover:opacity-100" aria-label="Remove pic" x-icon="lucide:x" @click.stop="imageUrl = ''; $refs.fileInput.value = ''"></button>

</label>
```

In this example, Alpine is used to temporarily upload an image. The image can be overwritten with a new upload or removed. The spans, remove button, and Tailwind styles are arbitrary, shown here for visual demonstration purposes.

---

## Wide

The `avatar-wide` container class displays a nested avatar alongside additional content.

::: frame
<div class="avatar-wide">
    <div class="avatar">W</div>
    <span>wesley@acme.com</span>
</div>

<button class="avatar-wide ghost">
    <span class="avatar">W</span>
    <div class="col items-start">
        <span class="text-sm text-content-neutral font-semibold">wesley@acme.com</span>
        <span class="text-xs text-content-subtle -mt-0.5">Superadmin</span>
    </div>
</button>
:::

```html copy
<!-- Static wide avatar -->
<div class="avatar-wide">
    <div class="avatar">W</div>
    <span>wesley@acme.com</span>
</div>

<!-- Interactive wide avatar -->
<button class="avatar-wide ghost">
    <span class="avatar">W</span>
    <div class="col items-start">
        <span class="text-sm text-content-neutral font-semibold">wesley@acme.com</span>
        <span class="text-xs text-content-subtle -mt-0.5">Superadmin</span>
    </div>
</button>
```

Within the `avatar-wide` container, all elements besides `avatar` are completely custom.

---

## Utilities

Avatars accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors
::: frame
<div class="avatar brand">W</div>
<div class="avatar accent">W</div>
<div class="avatar positive">W</div>
<div class="avatar negative">W</div>
:::

```html copy
<!-- Brand variant -->
<div class="avatar brand">W</div>

<!-- Accent variant -->
<div class="avatar accent">W</div>

<!-- Positive variant -->
<div class="avatar positive">W</div>

<!-- Negative variant -->
<div class="avatar negative">W</div>
```

#### Status Indicators

Color classes also modify the status indicators.

::: frame
<div class="avatar">
    <span>W</span>
    <figure class="positive"></figure>
</div>
<div class="avatar">
    <span>W</span>
    <figure class="negative"></figure>
</div>
<div class="avatar">
    <span>W</span>
    <figure class="brand"></figure>
</div>
<div class="avatar">
    <span>W</span>
    <figure class="accent"></figure>
</div>
:::

```html copy
<!-- Brand variant -->
<div class="avatar">
    <span>W</span>
    <figure class="positive"></figure>
</div>

<!-- Accent variant -->
<div class="avatar">
    <span>W</span>
    <figure class="negative"></figure>
</div>

<!-- Positive variant -->
<div class="avatar">
    <span>W</span>
    <figure class="brand"></figure>
</div>

<!-- Negative variant -->
<div class="avatar">
    <span>W</span>
    <figure class="accent"></figure>
</div>
```

---

### Size
::: frame
<div class="avatar sm">W</div>
<div class="avatar">W</div>
<div class="avatar lg">W</div>
:::

```html copy
<!-- Small variant -->
<div class="avatar sm">W</div>

<!-- Default size -->
<div class="avatar">W</div>

<!-- Large variant -->
<div class="avatar lg">W</div>
```

---

### Appearance
::: frame
<button class="avatar ghost">W</button>
<button class="avatar outlined">W</button>
<button class="avatar transparent">W</button>
:::

```html copy
<!-- No background until hover -->
<button class="avatar ghost">W</button>

<!-- Border included -->
<button class="avatar outlined">W</button>

<!-- No background at all -->
<button class="avatar transparent">W</button>
```

---

## Groups

Group avatars together horizontally with a `role="group"` attribute added to the parent container.

::: frame !bg-page
<div role="group">
    <div class="avatar">X</div>
    <div class="avatar">Y</div>
    <div class="avatar">Z</div>
</div>
:::

```html copy
<div role="group">
    <div class="avatar">X</div>
    <div class="avatar">Y</div>
    <div class="avatar">Z</div>
</div>
```

Grouped avatars are given a bunching effect with negative margins.

---

## Styles

### Theme

Default avatars use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-field-surface` | Avatar background color |
| `--color-field-surface-hover` | Button avatar hover/active background color |
| `--color-field-inverse` | Avatar text color |
| `--spacing-field-height` | Avatar width and height |
| `--radius` | Border radius for avatar corners |
| `--transition` | Transition for interactive states |

---

### Customization

Modify avatar styles with custom CSS.

::: frame
<style>
.avatar-custom {
    border-radius: 50%;
    outline: 1px solid blue;
    outline-offset: 1px;
}
</style>
<button class="avatar avatar-custom">W</button>
:::

```css copy
.avatar {
    border-radius: 50%;
    outline: 1px solid blue;
    outline-offset: 1px;
}
```