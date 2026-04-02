# Forms

---

## Setup

Form styles are included in Manifest CSS or a standalone stylesheet, both referencing [theme](/styles/theme) variables.

<x-code-group copy>

```html "Manifest CSS"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css" />
```

```html "Standalone"
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.form.css" />
```

</x-code-group>

---

## Default

The `<form>` element arranges its contents in a column with gaps.

::: frame
<form>
    <label for="input1">Input 1</label>
    <input id="input1" placeholder="Insert" />
    <label for="input2">Input 1</label>
    <input id="input2" placeholder="Insert" />
</form>
:::

```html
<form>
    <label for="input1">Input 1</label>
    <input id="input1" placeholder="Insert" />
    <label for="input2">Input 1</label>
    <input id="input2" placeholder="Insert" />
</form>
```

Place form elements inside a label for enhanced default styling, and to reduce code required. Label text can be standalone or in a `<span>`.

::: frame
<form>
    <label>
        Input 1
        <input placeholder="Insert" />
    </label>
    <label>
        <span>Input 2</span>
        <input placeholder="Insert" />
    </label>
</form>
:::

```html
<form>
    <label>
        Input 1
        <input placeholder="Insert" />
    </label>
    <label>
        <span>Input 2</span>
        <input placeholder="Insert" />
    </label>
</form>
```

This works for all types of form elements.

::: frame
<form>
    <label>
        Button label
        <button>Button</button>
    </label>
    <label>
        Text input label
        <input placeholder="Input" />
    </label>
    <div>
        <label for="search">Search input label</label>
        <label>
            <i x-icon="lucide:search"></i>
            <input id="search" type="search" />
        </label>
    </div>
    <div>
        <label for="file">File input label</label>
        <label>
            <i x-icon="lucide:upload"></i>
            Upload
            <input id="file" type="file" />
        </label>
    </div>
    <label>
        Select label
        <select>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
        </select>
    </label>
    <label>
        Textarea label
        <textarea placeholder="Insert"></textarea>
    </label>
    <label>
        <input type="checkbox" role="switch" />
        Switch label
    </label>
    <fieldset>
        <label>
            <input type="checkbox" />
            Checkbox label
        </label>
        <label>
            <input type="checkbox" />
            Checkbox label
        </label>
    </fieldset>
    <fieldset>
        <label>
            <input type="radio" name="radio-set" />
            Radio label
        </label>
        <label>
            <input type="radio" name="radio-set" />
            Radio label
        </label>
    </fieldset>
</form>
:::

```html numbers copy
<form>
    <label>
        Button label
        <button>Button</button>
    </label>
    <label>
        Text input label
        <input placeholder="Input" />
    </label>

    <!-- Search and file inputs require an external label for text, and can be visually grouped in a fieldset wrapper -->
    <fieldset>
        <label for="search">Search input label</label>
        <label>
            <i x-icon="lucide:search"></i>
            <input id="search" type="search" />
        </label>
    </fieldset>
    <fieldset>
        <label for="file">File input label</label>
        <label>
            <i x-icon="lucide:upload"></i>
            Upload
            <input id="file" type="file" />
        </label>
    </fieldset>

    <label>
        Select label
        <select>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
        </select>
    </label>
    <label>
        Textarea label
        <textarea placeholder="Insert"></textarea>
    </label>
    <label>
        <input type="checkbox" role="switch" />
        Switch label
    </label>

    <!-- Visually group checkbox and radio sets with a fieldset wrapper -->
    <fieldset>
        <label>
            <input type="checkbox" />
            Checkbox label
        </label>
        <label>
            <input type="checkbox" />
            Checkbox label
        </label>
    </fieldset>
    <fieldset>
        <label>
            <input type="radio" name="radio-set" />
            Radio label
        </label>
        <label>
            <input type="radio" name="radio-set" />
            Radio label
        </label>
    </fieldset>
</form>
```

---

## Inline Labels

To horizontally inline the label text with its form element, place the text in a `<data>` element, which Manifest uses as a CSS hook. `<data>` elements are semantically neutral, equivalent to a `<span>`.

::: frame
<form>
    <label>
        <data>Button label</data>
        <button>Button</button>
    </label>
    <label>
        <data>Text input label</data>
        <input placeholder="Input" />
    </label>
    <label>
        <data>Search input label</data>
        <div class="label">
            <i x-icon="lucide:search"></i>
            <input id="search" type="search" />
        </div>
    </label>
    <label>
        <data>File input label</data>
        <div class="label">
            <i x-icon="lucide:upload"></i>
            Upload
            <input id="file" type="file" />
        </div>
    </label>
    <label>
        <data>Select label</data>
        <select>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
        </select>
    </label>
    <label>
        <data>Textarea label</data>
        <textarea placeholder="Insert"></textarea>
    </label>
    <label>
        <data>Switch label</data>
        <input type="checkbox" role="switch" />
    </label>
    <fieldset>
        <label>
            <data>Checkbox label</data>
            <input type="checkbox" />
        </label>
        <label>
            <data>Checkbox label</data>
            <input type="checkbox" />
        </label>
    </fieldset>
    <fieldset>
        <label>
            <data>Radio label</data>
            <input type="radio" name="radio-set" />
        </label>
        <label>
            <data>Radio label</data>
            <input type="radio" name="radio-set" />
        </label>
    </fieldset>
</form>
:::

```html numbers copy
<form>
    <label>
        <data>Button label</data>
        <button>Button</button>
    </label>
    <label>
        <data>Text input label</data>
        <input placeholder="Input" />
    </label>

    <!-- For search and file inputs, use a div with the `label` utility class for the inner wrapper — this avoids <label> element nesting -->
    <label>
        <data>Search input label</data>
        <div class="label">
            <i x-icon="lucide:search"></i>
            <input id="search" type="search" />
        </div>
    </label>
    <label>
        <data>File input label</data>
        <div class="label">
            <i x-icon="lucide:upload"></i>
            Upload
            <input id="file" type="file" />
        </div>
    </label>

    <label>
        <data>Select label</data>
        <select>
            <option value="1">Option 1</option>
            <option value="2">Option 2</option>
            <option value="3">Option 3</option>
        </select>
    </label>
    <label>
        <data>Textarea label</data>
        <textarea placeholder="Insert"></textarea>
    </label>
    <label>
        <data>Switch label</data>
        <input type="checkbox" role="switch" />
    </label>
    <fieldset>
        <label>
            <data>Checkbox label</data>
            <input type="checkbox" />
        </label>
        <label>
            <data>Checkbox label</data>
            <input type="checkbox" />
        </label>
    </fieldset>
    <fieldset>
        <label>
            <data>Radio label</data>
            <input type="radio" name="radio-set" />
        </label>
        <label>
            <data>Radio label</data>
            <input type="radio" name="radio-set" />
        </label>
    </fieldset>
</form>
```

---

## Fieldset Legends

Add a `<legend>` element to a `<fieldset>` with checkboxes or radios, to create a bordered container with a small title.

::: frame
<fieldset>
<legend>Preferences</legend>
<label>
    <input type="checkbox" />
    <data>Email notifications</data>
</label>
<label>
    <input type="checkbox" />
    <data>SMS notifications</data>
</label>
</fieldset>
:::

```html copy
<fieldset>
    <legend>Preferences</legend>
    <label>
        <input type="checkbox" />
        <data>Email notifications</data>
    </label>
    <label>
        <input type="checkbox" />
        <data>SMS notifications</data>
    </label>
</fieldset>
```

---

## Group Wrappers

Buttons, inputs, and selects can be arranged horizontally flush inside a wrapper with the `role="group"` attribute. Elements are connected seamlessly with shared borders.

::: frame
<div role="group">
    <select>
        <option>Category</option>
        <option>Technology</option>
        <option>Design</option>
    </select>
    <input placeholder="Filter" />
    <button>Apply</button>
</div>
:::

```html numbers copy
<div role="group">
    <select>
        <option>Category</option>
        <option>Technology</option>
        <option>Design</option>
    </select>
    <input placeholder="Filter" />
    <button>Apply</button>
</div>
```

The `even` utility class makes all form elements an equal width.

::: frame
<div role="group" class="even">
    <select>
        <option>Category</option>
        <option>Technology</option>
        <option>Design</option>
    </select>
    <input placeholder="Filter" />
    <button>Apply</button>
</div>
:::

```html numbers copy
<div role="group" class="even">
    <select>
        <option>Category</option>
        <option>Technology</option>
        <option>Design</option>
    </select>
    <input placeholder="Filter" />
    <button>Apply</button>
</div>
```