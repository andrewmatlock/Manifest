# Components

Leverage HTML templates across your project.

---

## Overview

Components in Manifest are HTML files representing pages, sections, or other UI templates that can be reused throughout a project. Optimized for performance, components are resolved and rendered in milliseconds at browser runtime, eliminating the need for server-side rendering.

::: brand icon="lucide:info"
See the [router](/core-plugins/router) plugin for details on navigation, which can be used to show and hide components based on URL paths.
:::

---

## Setup

Components are included in `manifest.js` with all core plugins, or can be selectively loaded. `manifest.json` is required to register components.

<x-code-group copy>

```html "All Plugins (default)"
<!-- Meta -->
<link rel="manifest" href="/manifest.json">

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<!-- Meta -->
<link rel="manifest" href="/manifest.json">

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="components"></script>
```

</x-code-group>

---

## Create Components

Create an HTML file anywhere in your project directory, such as `/components/header.html`. Its filename must be distinct from other components.

::: frame
<x-header-basic></x-header-basic>
:::

```html "header.html"
<header class="w-full p-4 bg-page border-b border-line">
    <strong>Acme</strong>
</header>
```

Components can have any number of top-level elements, like this component home page:

```html "home.html"
<h1>Welcome!</h1>
<section>...</section>
<section>...</section>
```

All components are rendered as a desendent of the `index.html` body, and cannot contain their own `<body>` tag.

---

### Nesting

Provided that a circular reference is not created, components can be recursively nested—such as a logo placed in a header component.

::: frame
<x-header-nested></x-header-nested>
:::

<x-code-group>

```html "header.html"
<header class="row items-center gap-2 w-full p-4 bg-page border-b border-line">
    <x-logo></x-logo>
</header>
```

```html "logo.html"
<svg class="h-7 fill-accent-content" viewBox="0 0 197 48" xmlns="http://www.w3.org/2000/svg">...</svg>
```

</x-code-group>

---

### Page Head Content

Components can include head content in a `<template data-head>` tag, which gets appended to the head of any [route](/core-plugins/router) that includes the component, and removed when the component is no longer rendered.

```html copy
<template data-head>
    <script>
        console.log('🔄 Component article script loaded');
    </script>
</template>
```

Check the console for this page and you should see the above log.

<template data-head>
    <script>
        console.log('🔄 Component article script loaded');
    </script>
</template>

---

## Register Components

HTML files need to be declared in `manifest.json` due to browser security restrictions.

```json "manifest.json" copy
{
    "components": [
        "components/home.html",
        "components/about.html"
    ],
    "preloadedComponents": [
        "components/header.html",
        "components/logo.html"
    ],
    ...
}
```
Components are registered by custom filepath from the project root in one of two arrays:
- `components` is the default array, suitable for components that load on-demand.
- `preloadedComponents` is for components that should load in the background if not already used by a current [route](/core-plugins/router), reducing their load time on subsequent navigations.

Note that components are cached after first render for the duration of the session.

---

## Apply Instances

Components are applied with `<x-filename>` tags, where `filename` is the actual name of the source file. Top-level components are placed in the `index.html` body:

```html "index.html" numbers
<!DOCTYPE html>
<html>
    <head>
        ...
    </head>
    <body>

        <!-- header.html -->
        <x-header></x-header>

        <!-- Page content components like home.html and about.html -->
        <main>
            <x-home x-route="/"></x-home>
            <x-about x-route="about"></x-about>
        </main>

        <!-- footer.html -->
        <x-footer></x-footer>

    </body>
</html>
```

See the [router](/core-plugins/router) plugin for more information on conditional rendering with the `x-route` attribute.

::: brand icon="lucide:info"
Component placeholder tags like `<x-about x-route="about">` will assign the route to all top-level elements in the component, overwriting their own `x-route` values if present.
:::

---

## Customizing Instances
In some scenarios it's useful to diverge an instance's content or styles from the source component, such as modifying the header for a special page.

### Isolate the Instance

If the instance is used globally like the earlier header example, we'll need to create an isolated version that can be modified without affecting the others. The [x-route](/core-plugins/router) attribute can be used to show or hide instances based on the current route.

<x-code-group>

```html "index.html"
<body>

    <!-- Global header, omitted from the special page -->
    <x-header x-route="!special"></x-header>

    <!-- Specialty page -->
    <x-special-page x-route="special"></x-special-page>

</body>
```

```html "special-page.html"
<!-- Isolated header instance within the special page -->
<x-header></x-header>

<!-- Other page content -->
...
```

</x-code-group>

---

### Parent Modification

Modifying just the parent element can be done immediately by adding any new attribute values to the component tag:

::: frame
<header id="specialHeader" class="row items-center gap-2 w-full p-4 bg-page !bg-slate-700">
        <svg class="h-7 fill-accent-content" viewBox="0 0 197 48" xmlns="http://www.w3.org/2000/svg"><g><path clip-rule="evenodd" d="m0 24c15.2548 0 24-8.7452 24-24 0 15.2548 8.7452 24 24 24-15.2548 0-24 8.7452-24 24 0-15.2548-8.7452-24-24-24z" fill-rule="evenodd"/><path d="m54 33 6.561-19.683h5.94l6.561 19.683h-4.374l-1.323-4.05h-7.668l-1.323 4.05zm6.669-7.263h5.724l-1.674-5.022-1.107-3.591h-.162l-1.107 3.591z"/><path d="m80.3836 33.243c-1.44 0-2.7-.306-3.78-.918-1.08-.63-1.917-1.503-2.511-2.619-.594-1.134-.891-2.448-.891-3.942 0-1.512.297-2.826.891-3.942.612-1.134 1.467-2.007 2.565-2.619 1.098-.63 2.385-.945 3.861-.945 1.242 0 2.349.234 3.321.702s1.737 1.116 2.295 1.944c.576.828.891 1.791.945 2.889h-3.888c-.126-.756-.441-1.323-.945-1.701-.504-.396-1.116-.594-1.836-.594-1.044 0-1.836.387-2.376 1.161s-.81 1.809-.81 3.105c0 1.422.288 2.484.864 3.186.594.702 1.359 1.053 2.295 1.053.846 0 1.512-.216 1.998-.648.504-.432.792-.999.864-1.701h3.861c-.054 1.134-.378 2.124-.972 2.97-.576.828-1.359 1.476-2.349 1.944-.99.45-2.124.675-3.402.675z"/><path d="m89.0032 33v-14.472h3.834l.135 2.619h.162c.36-.954.945-1.674 1.755-2.16s1.701-.729 2.673-.729c1.008 0 1.926.243 2.7538.729.828.486 1.44 1.323 1.836 2.511h.216c.342-1.08.945-1.89 1.809-2.43.882-.54 1.872-.81 2.97-.81.936 0 1.773.198 2.511.594s1.323 1.035 1.755 1.917c.45.864.675 2.025.675 3.483v8.748h-3.969v-7.884c0-1.224-.207-2.133-.621-2.727-.396-.594-1.044-.891-1.944-.891-.954 0-1.701.351-2.241 1.053-.522.684-.783 1.485-.783 2.403v8.046h-3.9688v-7.884c0-1.224-.207-2.133-.621-2.727-.396-.594-1.044-.891-1.944-.891-.972 0-1.719.351-2.241 1.053-.522.684-.783 1.485-.783 2.403v8.046z"/><path d="m121.149 33.243c-1.512 0-2.808-.306-3.888-.918-1.062-.612-1.881-1.467-2.457-2.565-.576-1.116-.864-2.412-.864-3.888 0-1.566.288-2.916.864-4.05.594-1.134 1.422-2.007 2.484-2.619 1.062-.63 2.304-.945 3.726-.945 1.674 0 3.051.369 4.131 1.107 1.08.72 1.854 1.719 2.322 2.997.468 1.26.621 2.691.459 4.293h-10.071c-.018 1.152.279 2.043.891 2.673.612.612 1.413.918 2.403.918.756 0 1.395-.162 1.917-.486.54-.342.882-.792 1.026-1.35h3.753c-.126.972-.495 1.818-1.107 2.538-.594.72-1.368 1.287-2.322 1.701-.954.396-2.043.594-3.267.594zm-.135-11.988c-.9 0-1.629.261-2.187.783-.558.504-.873 1.197-.945 2.079h6.156c-.054-.972-.369-1.692-.945-2.16-.558-.468-1.251-.702-2.079-.702z"/><path d="m144.313 33.243c-1.962 0-3.69-.396-5.184-1.188-1.476-.792-2.628-1.944-3.456-3.456s-1.242-3.33-1.242-5.454.414-3.933 1.242-5.427c.828-1.512 1.98-2.664 3.456-3.456 1.494-.792 3.222-1.188 5.184-1.188 1.692 0 3.195.297 4.509.891 1.314.576 2.376 1.395 3.186 2.457.81 1.044 1.305 2.268 1.485 3.672h-4.266c-.234-1.008-.792-1.827-1.674-2.457-.864-.648-1.944-.972-3.24-.972-1.692 0-3.042.54-4.05 1.62-.99 1.08-1.485 2.7-1.485 4.86 0 2.178.495 3.807 1.485 4.887 1.008 1.08 2.358 1.62 4.05 1.62 1.26 0 2.34-.315 3.24-.945s1.458-1.467 1.674-2.511h4.266c-.162 1.404-.657 2.637-1.485 3.699s-1.908 1.89-3.24 2.484c-1.314.576-2.799.864-4.455.864z"/><path d="m162.113 33.243c-1.44 0-2.709-.297-3.807-.891s-1.953-1.449-2.565-2.565c-.594-1.116-.891-2.457-.891-4.023 0-1.494.288-2.799.864-3.915.576-1.134 1.404-2.016 2.484-2.646s2.385-.945 3.915-.945c1.44 0 2.7.297 3.78.891 1.098.594 1.944 1.458 2.538 2.592.612 1.116.918 2.457.918 4.023 0 1.494-.288 2.808-.864 3.942-.576 1.116-1.404 1.989-2.484 2.619-1.062.612-2.358.918-3.888.918zm-.027-3.213c.972 0 1.755-.351 2.349-1.053s.891-1.773.891-3.213-.288-2.511-.864-3.213-1.359-1.053-2.349-1.053-1.782.351-2.376 1.053-.891 1.773-.891 3.213c0 1.422.288 2.493.864 3.213.594.702 1.386 1.053 2.376 1.053z"/><path d="m171.337 33v-14.472h3.591l.162 2.322h.135c.324-.936.837-1.584 1.539-1.944.72-.378 1.539-.567 2.457-.567h.81v3.726h-.891c-1.332 0-2.295.297-2.889.891-.594.576-.909 1.404-.945 2.484v7.56z"/><path d="m181.582 37.509v-18.981h3.834l.135 2.511h.216c.342-.846.909-1.521 1.701-2.025.81-.504 1.773-.756 2.889-.756 1.728 0 3.123.63 4.185 1.89 1.08 1.242 1.62 3.114 1.62 5.616 0 2.484-.54 4.356-1.62 5.616-1.062 1.26-2.457 1.89-4.185 1.89-1.116 0-2.079-.252-2.889-.756-.792-.522-1.359-1.197-1.701-2.025h-.216v7.02zm7.29-7.452c.972 0 1.746-.342 2.322-1.026.594-.702.891-1.791.891-3.267s-.297-2.556-.891-3.24c-.576-.702-1.35-1.053-2.322-1.053-.738 0-1.35.171-1.836.513s-.846.792-1.08 1.35c-.234.54-.351 1.116-.351 1.728v1.404c0 .612.117 1.197.351 1.755.234.54.594.981 1.08 1.323s1.098.513 1.836.513z"/></g></svg>
</header>
:::

```html "special-page.html"
<body>
    <x-header id="specialHeader" class="!bg-slate-700"></x-header>
    ...
</body>
```

These attribute values will be added to the first top-level element in the component file. If an attribute like `class` already exists on that element, the new values are appended to it. Appended Tailwind utility classes meant to override others may require an `!important` variant.

---

### Child Modification

Modifying child elements requires custom attributes that can be referenced in the instance placeholder tag like `<x-header colors="..." wordmark="...">`.

These custom attributes are created in the component source file using Alpine directives (dynamic attributes) like [x-text](https://alpinejs.dev/directives/text), [x-html](https://alpinejs.dev/directives/html), and [x-bind](https://alpinejs.dev/directives/bind), or Manifest's extended directives like [x-icon](icons).

::: frame
<x-header-modified
    wordmark="\r"
></x-header-modified>
:::

```html "Component"
<header class="row items-center gap-2 w-full p-4 bg-stone-400 dark:bg-stone-800 text-stone-50" :class="$modify('colors')">
    <span x-icon="$modify('icon')"></span>
    <strong x-text="$modify('wordmark')"></strong>
</header>
```

Each directive requires a `$modify('...')` value with the name of the custom attribute to be exposed. This attribute is subsequently available to all of the component's instances:

::: frame
<x-header-modified
    colors="!text-white !bg-pink-400 dark:!bg-pink-900"
    icon="lucide:globe"
    wordmark="Universal Exports"
></x-header-modified>
:::

```html "Instance"
<x-header
    colors="!text-white !bg-pink-400 dark:!bg-pink-900"
    icon="lucide:globe"
    wordmark="Universal Exports"
></x-header>
```

If overrides with custom attribute are not required in every instance, place fallback logic in the component source to ensure optimal presentation.

::: frame
<x-header-modified></x-header-modified>
:::

```html "Component"
<!-- Static classes apply if not overriden by the colors attribute -->
<header class="row items-center gap-2 w-full p-4 bg-color-400 dark:bg-color-800 text-color-50" :class="$modify('colors')">

    <!-- Doesn't render if the instance omits the icon attribute -->
    <span x-icon="$modify('icon')" x-show="$modify('icon')"></span>

    <!-- Sets "Acme" as a default value if the instance doesn't include the wordmark attribute -->
    <strong x-text="$modify('wordmark') ?? 'Acme'"></strong>

</header>
```

::: brand icon="lucide:info"
Be sure to avoid <a href="https://developer.mozilla.org/en-US/docs/Web/HTML/Reference/Attributes" target="_blank">HTML standard attribute names</a> like `title` when creating your own to avoid conflict.
:::

---

### Injecting Dynamic Data
Instances can also receive their content from a [data source](/core-plugins/local-data). Simply make the custom attributes dynamic with a leading `:` and turn the value into a data source reference using `$x`. In this example, we're referencing an arbitrary `content.json` source:

::: frame
<x-header-modified
    :colors="$x.example.specialHeader.colors"
    :icon="$x.example.specialHeader.icon"
    :wordmark="$x.example.specialHeader.wordmark"
></x-header-modified>
:::

<x-code-group copy>

```html "Instance"
<x-header
    :colors="$x.content.specialHeader.colors"
    :icon="$x.content.specialHeader.icon"
    :wordmark="$x.content.specialHeader.wordmark"
></x-header>
```

```json "content.json"
{
    "specialHeader": {
        "icon": "lucide:star-half",
        "wordmark": "Waystar Royco",
        "colors": "!gap-0 [&_strong]:-ml-1 [&_strong]:mb-1 !text-white !bg-neutral-900 dark:!text-black dark:!bg-neutral-100"
    },
    ...
}
```

</x-code-group>