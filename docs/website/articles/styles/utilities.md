# Utilities

Maintain visual consistency with common utility classes.

---

## Setup

Utilities are available in the full Manifest CSS library, or as a standalone stylesheet. Both reference [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css">
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.utilities.css">
```

</x-code-group>

This provides a curated set of utility classes for HTML elements encountering common use cases, particularly layouts and colors.

See [custom utilities](/styles/theme#custom-utilities) for classes generated from your CSS variables.

---

## Page Class

The `page` class creates a structured layout with a formatted header, main content, and footer. It can be applied to any top-level wrapper like the `<body>`, with styles applying to direct child elements in this HTML structure:

::: frame col !gap-2

    <small>&lt;body class=&quot<b>page</b>&quot&gt;</small>

    <div class="grid grid-cols-6 w-full p-2 bg-surface-2 border border-dashed border-line">
        <small class="col-span-1">&lt;header&gt;</small>
        <div class="col-span-4 p-2 bg-surface-3/50 border border-dashed border-line">
            <small>&lt;nav&gt;</small>
        </div>
    </div>

    <div class="grid grid-cols-6 gap-y-2 w-full p-2 bg-surface-2 border border-dashed border-line">
        <small class="col-span-1">&lt;main&gt;</small>
        <div class="col-start-2 col-span-4 p-2 bg-surface-3/50 border border-dashed border-line">
            <small>&lt;section&gt;</small>
        </div>
        <div class="col-start-2 col-span-4 p-2 bg-surface-3/50 border border-dashed border-line">
            <small>&lt;section&gt;</small>
        </div>
        <div class="col-start-2 col-span-4 p-2 bg-surface-3/50 border border-dashed border-line">
            <small>&lt;section&gt;</small>
        </div>
    </div>

    <div class="grid grid-cols-6 w-full p-2 bg-surface-2 border border-dashed border-line">
        <small class="col-span-1">&lt;footer&gt;</small>
        <div class="col-span-4 p-2 bg-surface-3/50 border border-dashed border-line">
            <small>&lt;nav&gt;</small>
        </div>
    </div>

:::

```html numbers copy
<body class="page">

    <header>
        <nav><!-- Navigation content --></nav>
    </header>
    
    <main>
        <section><!-- Page content --></section>
        <section><!-- Page content --></section>
        <section><!-- Page content --></section>
    </main>
    
    <footer>
        <nav><!-- Footer content --></nav>
    </footer>

</body>
```

Elements behave as follows:

Header & Footer:
- Viewport padding applied automatically
- Nav elements constrained to content width
- `z-index: 30` to overlay if in a fixed position

Main Content:
- Viewport padding applied automatically
- Sections constrained to content width, unless they have `banner`, `overlay-light`, or `overlay-dark` classes

Footer:
- Automatically pushed to bottom with `margin-top: auto`


These CSS spacing variables are utilized by `page` descendents:

| CSS Variable | Default | Description |
|----------|---------|-------------|
| `--spacing-content-width` | `68.75rem` | Maximum width for `nav` and `section` content areas |
| `--spacing-viewport-padding` | `3vw` | Horizontal padding for viewport edges |

---

## Layout Classes

With most modern container layouts making use of CSS flex properties, these utilities reduce the number of Tailwind classes otherwise required.

| Class | Description | Tailwind Equivalent |
|--------------|-------------|-------------------|
| `content` | Contains content to middle of page | `w-(--spacing-content-width) max-w-full mx-auto` |
| `row` | Horizontal flex container | `flex flex-row` |
| `row-wrap` | Horizontally wrapping flex container | `flex flex-row flex-wrap` |
| `col` | Vertical flex container | `flex flex-col` |
| `col-wrap` | Vertically wrapping flex container | `flex flex-col flex-wrap` |
| `center` | Centers content in flex container | `justify-center items-center` |

::: frame col justify-start items-start gap-4 [&_fieldset]:p-2 [&_figure]:shrink-0 [&_figure]:size-10 [&_figure]:bg-surface-3 [&_figure]:border [&_figure]:border-dashed [&_figure]:border-line [&_figure]:rounded [&_figure]:min-w-0
<fieldset class="min-w-full !pb-0">
    <legend>content</legend>
    <div class="row content w-80 h-40 -mt-4.5 p-4 bg-surface-3 border-x border-dashed border-line text-sm text-content-neutral">Look at that subtle off-white coloring. The tasteful thickness of it. Oh my God, it even has a watermark...</div>
</fieldset>
<div class="row gap-4 w-full">
    <div class="col gap-4">
        <fieldset class="row gap-2">
            <legend>row</legend>
            <figure></figure>
            <figure></figure>
            <figure></figure>
        </fieldset>
        <fieldset class="row-wrap gap-2 max-w-[154px]">
            <legend>row-wrap</legend>
            <figure></figure>
            <figure></figure>
            <figure></figure>
            <figure></figure>
        </fieldset>
    </div>
    <fieldset class="col gap-2 items-center">
        <legend>col</legend>
        <figure></figure>
        <figure></figure>
        <figure></figure>
        <figure></figure>
    </fieldset>
    <fieldset class="max-h-[222px]">
        <legend>col-wrap</legend>
        <div class="col-wrap gap-2 items-center max-h-full">
            <figure></figure>
            <figure></figure>
            <figure></figure>
            <figure></figure>
            <figure></figure>
            <figure></figure>
        </div>
    </fieldset>
    <fieldset class="row center grow self-stretch">
        <legend>center</legend>
        <figure></figure>
    </fieldset>
</div>
:::

---

## Form Elements

These classes are used to modify form elements like buttons and inputs. See the respective element documentation for more detail.

| Class | Type | Description |
|--------------|-----------|---------------------|
| `brand` | Color | Brand color (surface & inverse) |
| `accent` | Color | Accent color (surface & inverse) |
| `negative` | Color | Negative color (surface & inverse) |
| `ghost` | Appearance | Transparent background until hovered or pressed |
| `hug` | Appearance | Sizes to its content, best with transparency |
| `selected` | Appearance | Background for an active selection |
| `transparent` | Appearance | Transparent background in all states |
| `outlined` | Appearance | Bordered style |
| `sm` | Size | Smaller variant |
| `lg` | Size | Larger variant |

::: frame row-wrap
<button class="brand">Brand</button>
<button class="accent">Accent</button>
<button class="negative">Negative</button>
<button class="ghost">Ghost</button>
<button class="hug transparent">Hug</button>
<button class="selected">Selected</button>
<button class="transparent">Transparent</button>
<button class="outlined">Outlined</button>
<button class="sm">Small</button>
<button class="lg">Large</button>
:::

---

## Typography

Color utilities also modify text directly or from a parent container. Utility classes named for a corresponding text element will apply that element's styles to any other.

| Class | Type | Description |
|--------------|-----------|---------------------|
| `brand` | Color | Brand color (content) |
| `accent` | Color | Accent color (content) |
| `negative` | Color | Negative color (content) |
| `h1` | Appearance | Heading 1 styles |
| `h2` | Appearance | Heading 2 styles |
| `h3` | Appearance | Heading 3 styles |
| `h4` | Appearance | Heading 4 styles |
| `h5` | Appearance | Heading 5 styles |
| `h6` | Appearance | Heading 6 styles |
| `paragraph` | Appearance | Paragraph styles |
| `small` | Appearance | Small text styles |
| `caption` | Appearance | Caption/figcaption styles |

::: frame flex flex-col gap-3
<div class="brand h3">Brand text</div>
<div class="accent h3">Accent text</div>
<div class="negative h3">Negative text</div>
<div class="h1">Heading 1 style</div>
<div class="h2">Heading 2 style</div>
<div class="h3">Heading 3 style</div>
<div class="h4">Heading 4 style</div>
<div class="h5">Heading 5 style</div>
<div class="h6">Heading 6 style</div>
<div class="paragraph">Paragraph style</div>
<div class="small">Small text style</div>
<div class="caption">Caption style</div>
:::

---

## Miscellaneous

| Class | Description |
|--------------|--------------------------------|
| `no-focus` | Removes an element's focus outline |
| `no-scrollbar` | Hides an element's scrollbar |
| `overlay-dark` | For banner elements with a dark overlay and light text |
| `overlay-light` | For banner elements with a light overlay and dark text |
| `prose` | Makes elements with long-form, child text content more readable (like this whole article) |
| `trailing` | Pushes a trailing text or icon element to the right |
| `unstyle` | Omits Manifest styles from any HTML selector (i.e. `h1`, `button`) |

::: frame col gap-3
<div class="row w-full aspect-video bg-[url(https://images.unsplash.com/photo-1754206352604-0a4f13ca2a22)] bg-cover rounded">
    <div class="flex grow center h-full h3 overlay-dark">
        <span class="">Overlay Dark</span>
    </div>
        <div class="flex grow center h-full h3 overlay-light">
        <span class="">Overlay Light</span>
    </div>
</div>
<button class="w-full">
    <span>Trailing icon</span>
    <span class="trailing" x-icon="lucide:ellipsis" aria-label="Trailing icon"></span>
</button>
:::