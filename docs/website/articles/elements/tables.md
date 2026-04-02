# Tables

---

## Setup

Table styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.table.css" />
```

</x-code-group>

---

## Default

::: frame !bg-transparent
<table>
    <thead>
        <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Coffee</td>
            <td>2</td>
            <td>$8.00</td>
        </tr>
        <tr>
            <td>Sandwich</td>
            <td>1</td>
            <td>$12.00</td>
        </tr>
        <tr>
            <td>Pastry</td>
            <td>3</td>
            <td>$15.00</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <th>Total</th>
            <th>6</th>
            <th>$35.00</th>
        </tr>
    </tfoot>
</table>
:::

```html copy
<table>
    <thead>
        <tr>
            <th>Item</th>
            <th>Quantity</th>
            <th>Price</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Coffee</td>
            <td>2</td>
            <td>$8.00</td>
        </tr>
        <tr>
            <td>Sandwich</td>
            <td>1</td>
            <td>$12.00</td>
        </tr>
        <tr>
            <td>Pastry</td>
            <td>3</td>
            <td>$15.00</td>
        </tr>
    </tbody>
    <tfoot>
        <tr>
            <th>Total</th>
            <th>6</th>
            <th>$35.00</th>
        </tr>
    </tfoot>
</table>
</table>
```

---

## Cell Elements

Cells with multiple children will automatically inline and space those elements.

::: frame !bg-transparent
<table>
    <thead>
        <tr>
            <th class="w-full"><span x-icon="lucide:user"></span><span>Users</span></th>
            <th>Status</th>
            <th class="min-w-36">Edit</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John Doe</td>
            <td><mark class="brand">Active</mark></td>
            <td>
                <button class="sm ghost" x-icon="lucide:edit-2" aria-label="Edit"></button>
                <button class="sm ghost">Deactivate</button>
            </td>
        </tr>
        <tr>
            <td>Jane Smith</td>
            <td><mark class="neutral">Pending</mark></td>
            <td>
                <button class="sm ghost" x-icon="lucide:edit-2" aria-label="Edit"></button>
            </td>
        </tr>
        <tr>
            <td>Mike Johnson</td>
            <td><mark class="negative">Inactive</mark></td>
            <td>
                <button class="sm ghost" x-icon="lucide:edit-2" aria-label="Edit"></button>
                <button class="sm ghost">Activate</button>
            </td>
        </tr>
    </tbody>
</table>
:::

```html copy
<table>
    <thead>
        <tr>
            <th><span x-icon="lucide:user"></span><span>User</span></th>
            <th>Status</th>
            <th>Edit</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John Doe</td>
            <td><mark class="brand">Active</mark></td>
            <td>
                <button class="sm" x-icon="lucide:edit-2" aria-label="Edit"></button>
                <button class="sm ghost">Deactivate</button>
            </td>
        </tr>
        <tr>
            <td>Jane Smith</td>
            <td><mark class="neutral">Pending</mark></td>
            <td>
                <button class="sm" x-icon="lucide:edit-2" aria-label="Edit"></button>
            </td>
        </tr>
        <tr>
            <td>Mike Johnson</td>
            <td><mark class="negative">Inactive</mark></td>
            <td>
                <button class="sm" x-icon="lucide:edit-2" aria-label="Edit"></button>
                <button class="sm ghost">Activate</button>
            </td>
        </tr>
    </tbody>
</table>
```

---

### Grids

If using a grid element instead of a `<table>`, the `grid-table` class applies table styles. Each row must be a parent container with a  `grid-header`, `grid-row`, or `grid-footer` class. These containers use `display: contents` to allow each cell to be rendered as a direct child of the grid, and so cannot be directly styled.


::: frame !bg-transparent
<div class="grid-table grid grid-cols-3">
    <div class="grid-header">
        <div>Item</div>
        <div>Quantity</div>
        <div>Price</div>
    </div>
    <div class="grid-row">
        <div>Coffee</div>
        <div>2</div>
        <div>$8.00</div>
    </div>
    <div class="grid-row">
        <div>Sandwich</div>
        <div>1</div>
        <div>$12.00</div>
    </div>
    <div class="grid-row">
        <div>Pastry</div>
        <div>3</div>
        <div>$15.00</div>
    </div>
    <div class="grid-footer">
        <div>Total</div>
        <div>6</div>
        <div>$35.00</div>
    </div>
</div>
:::

```html
<div class="grid-table grid grid-cols-3">
    <div class="grid-header">
        <div>Item</div>
        <div>Quantity</div>
        <div>Price</div>
    </div>
    <div class="grid-row">
        <div>Coffee</div>
        <div>2</div>
        <div>$8.00</div>
    </div>
    <div class="grid-row">
        <div>Sandwich</div>
        <div>1</div>
        <div>$12.00</div>
    </div>
    <div class="grid-row">
        <div>Pastry</div>
        <div>3</div>
        <div>$15.00</div>
    </div>
    <div class="grid-footer">
        <div>Total</div>
        <div>6</div>
        <div>$35.00</div>
    </div>
</div>
```

---

## Striped

Add the `striped` class to alternate row background colors, which removes row borders for cleaner visual separation.

::: frame !bg-transparent
<table class="striped">
    <thead>
        <tr>
            <th>Product</th>
            <th>Price</th>
            <th>Stock</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>Laptop</td>
            <td>$999</td>
            <td>15</td>
        </tr>
        <tr>
            <td>Mouse</td>
            <td>$25</td>
            <td>50</td>
        </tr>
        <tr>
            <td>Keyboard</td>
            <td>$75</td>
            <td>30</td>
        </tr>
        <tr>
            <td>Monitor</td>
            <td>$300</td>
            <td>8</td>
        </tr>
    </tbody>
</table>
:::

```html
<table class="striped">
    ...
</table>
```

---

## Styles

### Theme

Default tables use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-surface-1` | Header and striped row background |
| `--color-line` | Row border color |
| `--spacing` | Cell padding base unit |
| `--radius` | Table border radius |

---

### Tailwind CSS

If using Tailwind, individual tables can be customized with utility classes.

::: frame !bg-transparent
<table class="bg-surface-2 border border-line rounded-lg">
    <thead class="font-bold bg-surface-3">
        <tr>
            <th>Custom Table</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody class="[&_tr:hover]:bg-surface-1">
        <tr>
            <td>John Doe</td>
            <td><mark class="brand">Active</mark></td>
        </tr>
        <tr>
            <td>Jane Smith</td>
            <td><mark class="neutral">Pending</mark></td>
        </tr>
    </tbody>
</table>
:::

```html copy
<table class="bg-surface-2 border border-line rounded-lg">
    <thead class="font-bold bg-surface-3">
        <tr>
            <th>Custom Table</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody class="[&_tr:hover]:bg-surface-1">
        <tr>
            <td>John Doe</td>
            <td><mark class="brand">Active</mark></td>
        </tr>
        <tr>
            <td>Jane Smith</td>
            <td><mark class="neutral">Pending</mark></td>
        </tr>
    </tbody>
</table>
```

---

### Column Width

Table columns are automatically sized to fit the content of their cells. Add a custom class or Tailwind utility to a header cell to set the column's specific min, max, or default width.

::: frame !bg-transparent
<table>
    <thead>
        <tr>
            <th class="w-full">User</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John Doe</td>
            <td><mark class="brand">Active</mark></td>
        </tr>
        <tr>
            <td>Jane Smith</td>
            <td><mark class="neutral">Pending</mark></td>
        </tr>
        <tr>
            <td>Joe Johnson</td>
            <td><mark class="negative">Inactive</mark></td>
        </tr>
    </tbody>
</table>
:::

```html
<table>
    <thead>
        <tr>
            <th class="w-full">User</th>
            <th>Status</th>
        </tr>
    </thead>
    ...
</table>
```

---

### Customization

Modify base table styles with custom CSS for the `table` selector.

::: frame !bg-transparent
<style>
table.custom {
    font-family: var(--font-mono);
    border: 1px solid var(--color-line) !important;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    & thead {
        & th {
            font-size: 0.875rem;
            font-style: italic;
        }
    }

    & tbody {
        font-size: 1rem;

        & tr:hover {
            background-color: var(--color-surface-1);
        }
    }
}
</style>

<table class="custom">
    <thead>
        <tr>
            <th>Custom Table</th>
            <th>Status</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>John Doe</td>
            <td><mark class="brand">Active</mark></td>
        </tr>
        <tr>
            <td>Jane Smith</td>
            <td><mark class="neutral">Pending</mark></td>
        </tr>
    </tbody>
</table>
:::

```css copy
table {
    font-family: var(--font-mono);
    border: 1px solid var(--color-line) !important;
    border-radius: 1rem;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

    & thead {
        & th {
            font-size: 0.875rem;
            font-style: italic;
        }
    }

    & tbody {
        font-size: 1rem;

        & tr:hover {
            background-color: var(--color-surface-1);
        }
    }
}
```

