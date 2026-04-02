# Tabs

---

## Setup

Tabs are included in `manifest.js` with all core plugins, or can be selectively loaded.

<x-code-group copy>

```html "All Plugins (default)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="tabs"></script>
```

</x-code-group>

Tabs draw their styles from any respective elements used, like [buttons](/elements/buttons).

---

## Default

Create tab menus with `x-tab` selectable targets and `x-tabpanel` content areas, using any HTML elements. Panels are targeted by matching the `x-tab` value with either the panel's `id` or `class` name.

::: frame items-center
<button x-tab="first">First</button>
<button x-tab="second">Second</button>
<div id="first" x-tabpanel>First content</div>
<div class="second" x-tabpanel>Second content</div>
:::

```html copy
<button x-tab="first">First</button>
<button x-tab="second">Second</button>

<div id="first" x-tabpanel>First content</div>
<div class="second" x-tabpanel>Second content</div>
```

The plugin works by automatically created an Alpine `x-data` value called `tabs`, which uses the `x-tab` values to show the selected panel and hide the others.

---

## Shared Buttons

A tab button can show multiple panels simultaneously by using class names instead of IDs.

::: frame items-center
<button x-tab="shared">Show All</button>
<button x-tab="specific">Show Specific</button>

<div class="shared" x-tabpanel="sharedExample">Shared content 1</div>
<div class="shared" x-tabpanel="sharedExample">Shared content 2</div>
<div id="specific" x-tabpanel="sharedExample">Specific content</div>
:::

```html copy
<button x-tab="shared">Show All</button>
<button x-tab="specific">Show Specific</button>

<!-- Multiple panels with same class -->
<div class="shared" x-tabpanel="classy">Shared content 1</div>
<div class="shared" x-tabpanel="classy">Shared content 2</div>

<!-- Single panel with ID -->
<div id="specific" x-tabpanel="classy">Specific content</div>
```

---

## Multiple Tab Groups

By default, `x-tabpanel` content is part of the same tab group on the page. For additional independent groups, give each group's content a shared value, e.g. `x-tabpanel="settings"`. This works the same as the `name` attribute for radio buttons.

::: frame !gap-12 items-center
<div class="col gap-2">
    <small>Tab group A</small>
    <div class="row gap-2">
        <button x-tab="first-a">First</button>
        <button x-tab="second-a">Second</button>
    </div>
    <div class="first-a" x-tabpanel="group-a">A. First content</div>
    <div class="second-a" x-tabpanel="group-a">A. Second content</div>
</div>

<div class="col gap-2">
    <small>Tab group B</small>
    <div class="row gap-2">
        <button x-tab="first-b">First</button>
        <button x-tab="second-b">Second</button>
    </div>
    <div class="first-b" x-tabpanel="group-b">B. First content</div>
    <div class="second-b" x-tabpanel="group-b">B. Second content</div>
</div>
:::

```html copy
<div class="col gap-2">
    <small>Tab group A</small>
    <div class="row gap-2">
        <button x-tab="first">First</button>
        <button x-tab="second">Second</button>
    </div>
    <div class="first" x-tabpanel="a">A. First content</div>
    <div class="second" x-tabpanel="a">A. Second content</div>
</div>

<div class="col gap-2">
    <small>Tab group B</small>
    <div class="row gap-2">
        <button x-tab="first">First</button>
        <button x-tab="second">Second</button>
    </div>
    <div class="first" x-tabpanel="b">B. First content</div>
    <div class="second" x-tabpanel="b">B. Second content</div>
</div>
```