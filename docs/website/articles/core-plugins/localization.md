# Localization

Localize your project to different languages and regions.

---

## Overview

The localization plugin provides automatic language detection, URL-based locale switching, and seamless integration with [local data](/core-plugins/local-data) for multilingual content.

---

## Setup

Localization is included in `manifest.js` with all core plugins, or can be selectively loaded. `manifest.json` is required to register translation files as data sources.

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
    data-plugins="router,data,localization"></script>
```

</x-code-group>

::: brand icon="lucide:info"
Localization requires the Manifest [router](/core-plugins/router) and [data](/core-plugins/local-data) plugins to operate.
:::

---

## Create Locale Files

You can organize your translations using JSON, YAML, or CSV files. Choose the format that best fits your workflow:


### CSV

CSV files offer flexible organization options for translations. You can store all languages and topics in a single CSV file, or across multiple.

<x-code-group copy>

```csv "translations.csv (all)"
key,en,fr,ar,zh
features.title,Features,Caractéristiques,الميزات,功能
features.performance.name,Fast Performance,Performance Rapide,أداء سريع,快速性能
features.performance.description,Lightning fast loading times,Temps de chargement ultra rapides,أوقات تحميل سريعة كالبرق,闪电般的加载速度
features.ease.name,Easy to Use,Facile à Utiliser,سهل الاستخدام,易于使用
features.ease.description,Simple and intuitive interface,Interface simple et intuitive,واجهة بسيطة وبديهية,简单直观的界面
features.responsive.name,Responsive,Responsive,متجاوب,响应式
features.responsive.description,Works on all devices,Fonctionne sur tous les appareils,يعمل على جميع الأجهزة,适用于所有设备
```

```csv "translations-euro.csv"
key,en,fr,de,es,it
features.title,Features,Caractéristiques,Funktionen,Características,Funzionalità
features.performance.name,Fast Performance,Performance Rapide,Schnelle Leistung,Rendimiento Rápido,Prestazioni Veloci
features.performance.description,Lightning fast loading times,Temps de chargement ultra rapides,Blitzschnelle Ladezeiten,Tiempos de carga ultrarrápidos,Tempi di caricamento fulminei
```

```csv "translations-asian.csv"
key,zh,ja,ko
features.title,功能,機能,기능
features.performance.name,快速性能,高速パフォーマンス,빠른 성능
features.performance.description,闪电般的加载速度,稲妻のように速い読み込み時間,번개처럼 빠른 로딩 시간
```

</x-code-group>

The first column (`key`) contains dot-notation paths to nested values. Subsequent columns are locale codes (`en`, `fr`, `ar`, `zh`, etc.). The plugin automatically detects available locales from the CSV header.

Each CSV file can contain one or more language columns.

---

### JSON & YAML

Create language-specific JSON or YAML files for your content, named and located however you like:

<x-code-group copy>

```yaml "features.en.yaml"
features:
  - name: "Fast Performance"
    description: "Lightning fast loading times"
  - name: "Easy to Use"
    description: "Simple and intuitive interface"
  - name: "Responsive"
    description: "Works on all devices"
```

```yaml "features.fr.yaml"
features:
  - name: "Performance Rapide"
    description: "Temps de chargement ultra rapides"
  - name: "Facile à Utiliser"
    description: "Interface simple et intuitive"
  - name: "Responsive"
    description: "Fonctionne sur tous les appareils"
```

```yaml "features.ar.yaml"
features:
  - name: "أداء سريع"
    description: "أوقات تحميل سريعة كالبرق"
  - name: "سهل الاستخدام"
    description: "واجهة بسيطة وبديهية"
  - name: "متجاوب"
    description: "يعمل على جميع الأجهزة"
```

```yaml "features.zh.yaml"
features:
  - name: "快速性能"
    description: "闪电般的加载速度"
  - name: "易于使用"
    description: "简单直观的界面"
  - name: "响应式"
    description: "适用于所有设备"
```

</x-code-group>

Each file should have the same object/array hierarchy and keys. Only the values are unique to the target locale. If a reference key is missing from a file, the default locale is used.

---

## Register Locale Files

1. Register your localized sources in the project's `manifest.json`.
2. Set the default locale in `index.html` using `lang` attribute in the `<html>` tag.


<x-code-group numbers copy>

```json "manifest.json"
{
  "data": {

    // CSV file(s)
    "translations": {
      
      // Single
      "locales": "/data/translations.csv"

      // OR multiple
      "locales": [
        "/data/translations-euro.csv",
        "/data/translations-asian.csv",
      ]
    }

    // JSON and/or YAML
    "features": {
      "en": "/data/features.en.json",
      "fr": "/data/features.fr.json",
      "ar": "/data/features.ar.yaml",
      "zh": "/data/features.zh.yaml"
    }
  }
}
```

```html "index.html"
<!DOCTYPE html>
<html lang="en">
<head>
  <title>My Project</title>
</head>
<body>
  <!-- ... -->
</body>
</html>
```

</x-code-group>

#### CSV

CSV files (like `translations`) containing multiple languages are registered using the `locales` key, which point to a CSV file (or multiple files in an array). The locales are determined by the language codes in the CSV headers.

#### JSON & YAML

JSON and YAML (like `features`) declare each locale in an object using their language code as a nested key, like `en` or `fr`.

---

## Language Detection

The plugin automatically detects the initial language using this priority order:

1. **URL path:** If a first path segment matches a language code in `manifest.json` (e.g. `/fr/about`), it gets highest priority for direct linking.
2. **UI toggles:** The user preference saved to local storage and persisting between sessions.
3. **HTML lang attribute:** `<html lang="fr">` is the DOM's source of truth for the current locale, persisting between sessions and modifiable only by 1 or 2.
4. **Browser language:** The `navigator.language` value.
5. **Fallback:** First available locale from `manifest.json`.

---

## Translating

Manifest has no build steps and is not a translation engine. To translate your content we recommend using AI tools like Cursor to autonomously update your locale files in any language.

---

## Display Content

Like regular [local data](/core-plugins/local-data#display-content), localizations are accessed using the `$x` magic method with dot notation. The structure follows this pattern:

`$x.sourceName.property.subProperty`

**Structure breakdown:**
- `$x` - Magic method prefix
- `sourceName` - Data source name from `manifest.json` (e.g. `features`)
- `property` - Object property or array name
- `subProperty` - Nested property (optional at any level)

::: frame col
<div class="row gap-2">
  <button @click="$locale.set('en')">English</button>
  <button @click="$locale.set('fr')">Français</button>
  <button @click="$locale.set('zh')">中文</button>
  <button @click="$locale.set('ar')">العربية</button>
</div>
<template x-for="feature in $x.features.content">
  <div class="col" :class="{ 'opacity-50': $store.data._localeChanging }">
    <span class="h4" x-text="feature.name"></span>
    <span x-text="feature.description"></span>
  </div>
</template>
:::

```html numbers copy
<!-- Toggles -->
<button @click="$locale.set('en')">English</button>
<button @click="$locale.set('fr')">Français</button>
<button @click="$locale.set('zh')">中文</button>
<button @click="$locale.set('ar')">العربية</button>

<!-- Content -->
<template x-for="feature in $x.features.content">
  <div class="col">
    <h4 x-text="feature.name"></h4>
    <p x-text="feature.description"></p>
  </div>
</template>
```

See [local data](/core-plugins/local-data#display-content) for specifics on how to inject content as text, HTML, or attribute values like links and images.

---

## URL Paths

If a language code is detected as a slug anywhere in the URL path, that locale is automatically displayed.

::: frame col
<div class="row-wrap gap-4">
  <a href="/en/plugins/localization">English</a>
  <a href="/fr/plugins/localization">Français</a>
  <a href="/zh/plugins/localization">中文</a>
  <a href="/ar/plugins/localization">العربية</a>
</div>
<template x-for="feature in $x.features.content">
  <div class="col">
    <span class="h4" x-text="feature.name"></span>
    <span x-text="feature.description"></span>
  </div>
</template>
:::

```html numbers copy
<!-- Links -->
<a href="/en/plugins/localization">English</a>
<a href="/fr/plugins/localization">Français</a>
<a href="/zh/plugins/localization">中文</a>
<a href="/ar/plugins/localization">العربية</a>

<!-- Content -->
<template x-for="feature in $x.features.content">
  <div class="col">
    <h4 x-text="feature.name"></h4>
    <p x-text="feature.description"></p>
  </div>
</template>
```

---

## UI Toggles

Allow users to toggle locales with Alpine's `@click` directive, using the `$locale` magic method:
- `$locale.set('...')` sets the specified locale by its language code, e.g. `fr` for French
- `$locale.toggle()` toggles through all locales in the order set in `manifest.json`

::: frame
<button @click="$locale.set('en')">English</button>
<button @click="$locale.set('fr')">Français</button>
<button @click="$locale.set('ar')">العربية</button>
<button @click="$locale.set('zh')">中文</button>
<button @click="$locale.toggle()">Toggle</button>
:::

```html numbers copy
<button @click="$locale.set('en')">English</button>
<button @click="$locale.set('fr')">Français</button>
<button @click="$locale.set('ar')">العربية</button>
<button @click="$locale.set('zh')">中文</button>
<button @click="$locale.toggle()">Toggle</button>
```

---

## Current Locale

Display the current locale's language code with `x-text="$locale.current"`:

::: frame
<p>Current: <span x-text="$locale.current"></span></p>
:::

```html copy
<p>Current: <span x-text="$locale.current"></span></p>
```

---

## RTL Support

The plugin automatically detects and handles right-to-left languages like Arabic, Hebrew, and Persian:

::: frame col
<div class="row gap-2">
  <button @click="$locale.set('en')">English (LTR)</button>
  <button @click="$locale.set('ar')">العربية (RTL)</button>
</div>
<p>Direction: <strong x-text="$locale.direction"></strong></p>
<template x-for="feature in $x.features.content">
  <div class="col">
    <h4 x-text="feature.name"></h4>
    <p x-text="feature.description"></p>
  </div>
</template>
:::

```html numbers copy
<!-- Toggles -->
<button @click="$locale.set('en')">English (LTR)</button>
<button @click="$locale.set('ar')">العربية (RTL)</button>

<!-- Current direction magic method -->
<p>Direction: <strong x-text="$locale.direction"></strong></p>

<!-- Content -->
<template x-for="feature in $x.features.content">
  <div class="col">
    <h4 x-text="feature.name"></h4>
    <p x-text="feature.description"></p>
  </div>
</template>
```

If an RTL language is detected as the current locale, the plugin automatically adds `dir=rtl` to the `<html>` tag, reversing the inline flow of page content. Dectable RTL languages are:

**Arabic Script**
- Arabic (`ar`)
- Azerbaijani (`az-Arab`) 
- Balochi (`bal`)
- Central Kurdish/Sorani (`ckb`)
- Persian/Farsi (`fa`)
- Gilaki (`glk`)
- Kashmiri (`ks`)
- Kurdish (`ku-Arab`)
- Northern Luri (`lrc`)
- Mazanderani (`mzn`)
- Western Punjabi (`pnb`)
- Pashto (`ps`)
- Sindhi (`sd`)
- Urdu (`ur`)

**Hebrew Script**
- Hebrew (`he`)
- Yiddish (`yi`)
- Judeo-Arabic (`jrb`)
- Judeo-Persian (`jpr`) 
- Ladino (`lad-Hebr`)

**Other Scripts**
- Dhivehi/Maldivian (`dv`) - Thaana script
- N'Ko (`nqo`) - N'Ko script
- Syriac (`syr`) - Syriac script
- Assyrian Neo-Aramaic (`aii`) - Syriac script
- Aramaic (`arc`) - Syriac script
- Samaritan Aramaic (`sam`) - Syriac script
- Mandaic (`mid`) - Mandaic script

**Historical Scripts**
- Ugaritic (`uga`)
- Phoenician (`phn`)
- Parthian (`xpr`)
- Old Persian (`peo`)
- Middle Persian/Pahlavi (`pal`)
- Avestan (`avst`)
- Manding (`man`)