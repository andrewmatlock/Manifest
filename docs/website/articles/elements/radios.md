# Radios

---

## Setup

Radios styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.radio.css" />
```

</x-code-group>

---

## Default

::: frame
<input type="radio" id="1" name="default-preview" checked />
<input type="radio" id="2" name="default-preview" />
:::

```html copy
<input type="radio" id="1" name="default" checked />
<input type="radio" id="2" name="default" />
```

---

## Utilities

Radios accept Manifest [utility](/styles/utilities) classes, which can be stacked in any combination.

### Colors

::: frame
<input type="radio" id="primary" class="brand" name="colors-preview" checked />
<input type="radio" id="accent" class="accent" name="colors-preview" />
<input type="radio" id="positive" class="positive" name="colors-preview" />
<input type="radio" id="negative" class="negative" name="colors-preview" />
:::

```html copy
<!-- Brand variant -->
<input type="radio" id="primary" class="brand" name="colors" checked />

<!-- Accent variant -->
<input type="radio" id="accent" class="accent" name="colors" />

<!-- Positive variant -->
 <input type="radio" id="positive" class="positive" name="colors-preview" />

<!-- Negative variant -->
<input type="radio" id="negative" class="negative" name="colors" />
```

---

### Size

::: frame
<input type="radio" id="small" class="sm" name="sizes-preview" checked />
<input type="radio" id="large" class="lg" name="sizes-preview" />
:::

```html copy
<!-- Small variant -->
<input type="radio" id="small" class="sm" name="sizes" checked />

<!-- Large variant -->
<input type="radio" id="large" class="lg" name="sizes" />
```

---

### Outlined

::: frame
<input type="radio" id="outlined" class="outlined" name="outlines-preview" checked />
<input type="radio" id="outlined-brand" class="outlined brand" name="outlines-preview" />
<input type="radio" id="outlined-accent" class="outlined accent" name="outlines-preview" />
<input type="radio" id="outlined-positive" class="outlined positive" name="outlines-preview" />
<input type="radio" id="outlined-negative" class="outlined negative" name="outlines-preview" />
:::

```html copy
<!-- Border variant -->
<input type="radio" id="outlined" class="outlined" name="outlines" checked />

<!-- Combined with colors -->
<input type="radio" id="outlined-brand" class="outlined brand" name="outlines" />
<input type="radio" id="outlined-accent" class="outlined accent" name="outlines" />
<input type="radio" id="outlined-positive" class="outlined positive" name="outlines" />
<input type="radio" id="outlined-negative" class="outlined negative" name="outlines" />
```

---

## Form Layouts

::: brand icon="lucide:info"
These styles are included in `manifest.css`, or the standalone `manifest.form.css`.
:::

## Labels

Placing the radio and text inside a `<label>` automatically arranges them in a row.

::: frame
<label>
    <input type="radio" id="a" name="labelled-preview" checked />
    Option A
</label>
<label>
    <input type="radio" id="b" name="labelled-preview" />
    Option B
</label>
:::

```html copy
<label>
    <input type="radio" id="a" name="labelled" checked />
    Option A
</label>
<label>
    <input type="radio" id="b" name="labelled" />
    Option B
</label>
```

---

### Groups

Placing labelled radios inside a `<fieldset>` automatically arranges them in a column with a gap.

::: frame
<fieldset>
    <label>
        <input type="radio" id="option-a" name="group-preview" checked />
        Option A
    </label>
    <label>
        <input type="radio" id="option-b" name="group-preview" />
        Option B
    </label>
    <label>
        <input type="radio" id="option-c" name="group-preview" />
        Option C
    </label>
</fieldset>
:::

```html copy
<fieldset>
    <label>
        <input type="radio" id="option-a" name="group" checked />
        Option A
    </label>
    <label>
        <input type="radio" id="option-b" name="group" />
        Option B
    </label>
    <label>
        <input type="radio" id="option-c" name="group" />
        Option C
    </label>
</fieldset>
```

---

## Styles

### Theme

Default radios use the following [theme](/styles/theme) variables:

| Variable | Purpose |
|----------|---------|
| `--color-field-surface` | Radio background |
| `--color-field-surface-hover` | Radio background on hover |
| `--color-field-inverse` | Radio icon color |
| `--spacing-field-height` | Radio size |
| `--transition` | Transition for interactive states |

---

### Customization

Modify base radio styles with custom CSS for the `input[type=radio]` selector.

::: frame
<style>
input[type=radio].custom {
    background-color: #f0f8ff;
    border: 2px solid #3b82f6;
    border-radius: 50%;

    & .custom::after {
        background-color: #1e40af;
        border-radius: 50%;
    }
}
    
</style>

<input type="radio" id="custom-1" class="custom" name="custom-preview" checked />
<input type="radio" id="custom-2" class="custom" name="custom-preview" />
:::

```css copy
input[type=radio] {
    background-color: #f0f8ff;
    border: 2px solid #3b82f6;
    border-radius: 50%;

    /* Notched */ 
    &::after {
        background-color: #1e40af;
        border-radius: 50%;
    }
}
```