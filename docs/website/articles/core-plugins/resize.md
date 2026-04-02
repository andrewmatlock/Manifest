# Resize

Make any HTML element resizable with drag handles.

---

## Overview

Resize adds drag-to-resize functionality to any element using an `x-resize` directive. Elements can be resized horizontally, vertically, or on both axes with customizable constraints, snap points, and persistence between page reloads. Resizability is initialized with lazy loading and caching to prevent performance issues on pages with many resize elements.

---

## Setup

Resize is included in `manifest.js` with all core plugins, or can be selectively loaded.

<x-code-group copy>

```html "All Plugins (default)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Selective"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"
    data-plugins="resize"></script>
```

</x-code-group>

Resizable element styles are included in Manifest CSS or as a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css">
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.resize.css">
```

</x-code-group>

---

## Basic Usage

Use the `x-resize` directive on any element to make it resizable:

::: frame
<div x-resize class="w-64 h-32 bg-surface-3">
    <p class="max-w-full max-h-full p-4 overflow-hidden">Drag any edge or corner to resize</p>
</div>
:::

```html copy
<div x-resize class="w-64 h-32 bg-surface-3">
    <p class="max-w-full max-h-full p-4 overflow-hidden">Drag any edge or corner to resize</p>
</div>
```

The element will automatically be resizable from all edges and corners. Size constraints can be applied with min/max width and height styles.

---

## Customization

Resize behavior is customized with properties inside the `x-resize` attribute.

| Property | Type | Default | Description |
|----------|------|---------|-------------|
| **`handles`** | Array | `['top', 'bottom', 'left', 'right', 'top-left', 'top-right', 'bottom-left', 'bottom-right']` | Resize handles: `top`, `bottom`, `left`, `right`, `start`, `end`, `top-left`, `top-right`, `bottom-left`, `bottom-right`, `top-start`, `top-end`, `bottom-start`, `bottom-end` |
| **`snapPoints`** | Array | `[]` | Values to snap to (both axes) |
| **`snapPointsX`** | Array | `[]` | Width values to snap to |
| **`snapPointsY`** | Array | `[]` | Height values to snap to |
| **`snapDistance`** | Number/String | `null` | Distance threshold for snapping (both axes) |
| **`snapDistanceX`** | Number/String | `null` | Distance threshold for width snapping |
| **`snapDistanceY`** | Number/String | `null` | Distance threshold for height snapping |
| **`snapCloseX`** | Number/String | `null` | Width threshold for auto-close (requires `toggle`) - closes when dragging toward inside |
| **`snapCloseY`** | Number/String | `null` | Height threshold for auto-close (requires `toggle`) - closes when dragging toward inside |
| **`toggle`** | String | `null` | An Alpine boolean variable to toggle visibility of the draggable element using `x-show` |
| **`saveWidth`** | String | `null` | localStorage key to persist width |
| **`saveHeight`** | String | `null` | localStorage key to persist height |

::: frame
<div x-data="{ 'sidebar': true }" class="col gap-4">
    <button @click="sidebar = !sidebar">Toggle Sidebar</button>
    <div x-resize="{
        handles: ['end', 'bottom-end'],
        snapPoints: [300, '50%', '35rem'],
        snapDistance: 50,
        snapCloseX: 200,
        toggle: 'sidebar',
        saveWidth: 'demo-sidebar-width'
    }" x-show="sidebar" class="max-w-[35rem] min-h-[85px] w-64 h-32 p-4 bg-surface-3">
        Sidebar
    </div>
    
</div>
:::

```html copy
<div x-data="{ 'sidebar': true }">
    <button @click="sidebar = !sidebar">Toggle Sidebar</button>
    <div x-resize="{
        handles: ['end', 'bottom-end'],
        snapPoints: [300, '50%', '35rem'],
        snapDistance: 50,
        snapCloseX: 200,
        toggle: 'sidebar',
        saveWidth: 'sidebar-width'
    }" x-show="sidebar" class="max-w-[35rem] min-h-[85px] w-64 h-32 p-4 bg-surface-3">
        Sidebar
    </div>
</div>
```

This example has:
- End and bottom-end handles.
- Snap points of 300px, 50%, and 35rem, which get snapped to when dragging within a 50px distance of them.
- Snap-to-close threshold of 200px width.
- `sidebar` Alpine variable to toggle the sidebar with a button.
- Persistence of width on page refresh.
- Min and max size styles to constrain resizing.

::: brand icon="lucide:info"
**RTL Support**: Logical handle directions (`start`, `end`, `top-start`, etc.) automatically adapt to RTL layouts. In RTL contexts, `start` becomes the right edge and `end` becomes the left edge. Physical directions (`top`, `bottom`, `left`, `right`) remain fixed regardless of text direction.
:::

---

## Multi-Panel Layout

Sibling elements of a resizable panel will be affected depending on its own styles. Give static siblings `flex: 1` (`flex-1` in Tailwind) to allow it to grow or shrink as required by the resized elements around it. This example demonstrates snap-to-close functionality that triggers when dragging toward the inside of the element, with toggle buttons for both panels.

::: frame
<div class="row w-full max-w-full border border-line" x-data="{ firstPanel: true, secondPanel: true }">
    <div x-resize="{
        handles: ['end'],
        snapCloseX: 120,
        toggle: 'firstPanel'
    }" x-show="firstPanel" class="w-32 min-w-[8rem] max-w-[20rem] p-4 bg-surface-3 border-e border-line">
        First panel
    </div>
    <div class="main-content flex-1 p-4 bg-surface-2">
        <div class="col gap-2">
            <span>Main content</span>
            <button @click="firstPanel = !firstPanel">Toggle First</button>
            <button @click="secondPanel = !secondPanel">Toggle Second</button>
        </div>
    </div>
    <div x-resize="{
        handles: ['start'],
        snapCloseX: 120,
        toggle: 'secondPanel'
    }" x-show="secondPanel" class="w-32 min-w-[8rem] max-w-[20rem] p-4 bg-surface-3 border-s border-line">
        Second panel
    </div>
</div>
:::

```html numbers copy
<!-- Alpine boolean variables declared for panel visibility -->
<div class="row w-full max-w-full border border-line" x-data="{ firstPanel: true, secondPanel: true }">

    <!-- First panel, resizable and toggleable -->
    <div x-resize="{
        handles: ['end'],
        snapCloseX: 120,
        toggle: 'firstPanel'
    }" x-show="firstPanel" class="w-32 min-w-[8rem] max-w-[20rem] p-4 bg-surface-3 border-e border-line">
        First panel
    </div>

    <!-- Main static content -->
    <div class="main-content flex-1 p-4 bg-surface-2">
        <div class="col gap-2">
            <span>Main content</span>
            <button @click="firstPanel = !firstPanel">Toggle First</button>
            <button @click="secondPanel = !secondPanel">Toggle Second</button>
        </div>
    </div>

    <!-- Second panel, resizable and toggleable -->
    <div x-resize="{
        handles: ['start'],
        snapCloseX: 120,
        toggle: 'secondPanel'
    }" x-show="secondPanel" class="w-32 min-w-[8rem] max-w-[20rem] p-4 bg-surface-3 border-s border-line">
        Second panel
    </div>
    
</div>
```

---

## Theme

Default resize handles use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-line` | Handle hover/active background color |
| `--radius` | Border radius for handle visual feedback |

Additionally, a `--spacing-resize-handle` variable is declared within resize styles to size the handles.

---

## Styles

Modify resize handle styles with custom CSS.

::: frame
<style>
    .resize-handles-custom {
        --spacing-resize-handle: 2rem;

        .resize-handle {

            &::before {
                width: 10px;
                height: 10px;
                border-radius: 0;
            }
        
            &:hover::before {
                background-color: blue;
            }
        }

        /* Edge handles - full width/height */
        .resize-handle-top,
        .resize-handle-bottom {
            width: 100%;
            cursor: row-resize;

            &::before {
                width: 100%;
            }
        }

        .resize-handle-left,
        .resize-handle-right,
        .resize-handle-start,
        .resize-handle-end {
            height: 100%;
            cursor: col-resize;

            &::before {
                height: 100%;
            }
        }
    }
</style>
<div x-resize class="w-64 h-32 p-4 bg-surface-3 resize-handles-custom">Custom handles</div>
:::

```css copy
/* Resize handle size */
:root { --spacing-resize-handle: 2rem; }

/* Modifying the visual handle's size, border radius, and background color */
/* .resize-handle is the mouseover area */
.resize-handle {

    /* ::before is the visual handle */
    &::before {
        width: 10px;
        height: 10px;
        border-radius: 0;
    }

    &:hover::before {
        background-color: blue;
    }
}

/* Modifying cursors and preserving visual edge handles */
.resize-handle-top,
.resize-handle-bottom {
    width: 100%;
    cursor: row-resize;

    &::before {
        width: 100%;
    }
}

.resize-handle-left,
.resize-handle-right,
.resize-handle-start,
.resize-handle-end {
    height: 100%;
    cursor: col-resize;

    &::before {
        height: 100%;
    }
}
```