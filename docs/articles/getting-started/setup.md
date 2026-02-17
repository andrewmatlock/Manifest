# Setup

Get Manifest with CDN links or copied from <a href="https://github.com/andrewmatlock/Manifest/tree/master/dist" target="_blank">GitHub</a>.

---

## Overview

Manifest consists of:

- `manifest.js` script for your project's functionality.
- `manifest.json` for central management of your project.
- `manifest.*.css` stylesheets for your project's UX/UI.

The script and stylesheets are modular, designed to work alone or together to best suit your project. A project using all Manifest features would be setup like:

```html "<head>" copy
<!-- Meta -->
<link rel="manifest" href="/manifest.json">

<!-- Scripts -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>

<!-- Styles -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst/manifest@latest/dist/manifest.min.css">
<link rel="stylesheet" href="/manifest.theme.css">
```

---

## manifest.json

Outside this framework, `manifest.json` is a <a href="https://en.wikipedia.org/wiki/Progressive_web_app#Manifest" target="_blank">common file</a> for web applications to centrally store project-level metadata. It's stored in the root for automatic browser detection.


We leverage this file as a place to declare HTML components and local or cloud data sources. It can also be used as a data source itself to render content.

```json "manifest.json" numbers copy
{
	// Web standard content
	"name": "My Project",
  	"short_name": "Project name",
	"description": "Lorem ipsum dolar sit amet.",
  	"start_url": "/",
  	"scope": "/",
  	"display": "standalone",
  	"orientation": "any",
  	"background_color": "#FFFFFF",
  	"icons": [
		{ "src": "/icons/192x192.png", "sizes": "192x192", "type": "image/png" },
		{ "src": "/icons/512x512.png", "sizes": "512x512", "type": "image/png" }
	],

	// Declarations for Manifest plugins
  	"components": [
		"components/home.html",
		"components/about.html"
  	],
  	"preloadedComponents": [
		"components/footer.html",
		"components/header.html",
		"components/logo.html"
  	],
  	"data": {
		"i18n": {
			"locales": "/translations.csv"
		}
  	}
}
```

If your project is not a downloadable web app, and does not include HTML components or data sources, `manifest.json` can be omitted.

---

## Script

`manifest.js` dynamically loads <a href="https://alpinejs.dev" target="_blank">Alpine JS</a> and our plugins to make your project functional. Add the `<script>` tag anywhere in the HTML head or body (within `index.html` if [routing](/core-plugins/router)).

<x-code-group copy>

```html "All Plugins (default)"
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js"></script>
```

```html "Select Plugins"
<!-- Load only specified plugins -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js" 
		  data-plugins="components,router,utilities"></script>
```

```html "Omit Plugins"
<!-- Load all core plugins except ommitted ones -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js" 
		  data-omit="markdown,resize"></script>
```

```html "Include Tailwind CSS"
<!-- Include Tailwind CSS -->
<script src="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.js" 
		  data-tailwind></script>
```

</x-code-group>

The script loads:

- **Manifest Plugins** (latest versions) from our CDN. The optional `data-plugins` or `data-omit` attributes will include or omit comma-separated plugins—otherwise all are loaded by default.
- **Alpine JS** (latest version) from its CDN, unless it's been added separately to your project.
- **Tailwind CSS** (modified production version from our CDN) *if* the `data-tailwind` attribute is added.

Scripts load the latest version from CDN by default. Load a specified version by referencing it in the URL and with a `data-version` attribute for plugins:

```html copy
<script src="https://cdn.jsdelivr.net/npm/mnfst@0.5.17/dist/manifest.min.js"
	data-version="0.5.17"></script>
```

---

## Styles
Stylesheets are divided by UI category, available individually or bundled in `manifest.css`.

A separate `manifest.theme.css` can be <a target="_blank" href="https://github.com/andrewmatlock/Manifest/tree/master/dist/manifest.theme.css">downloaded from GitHub</a> for local modification. It maintains CSS variables referenced by the other sheets if present, centralizing your project's visual identity. See [theme](/styles/theme) for more.

Add the desired Manifest CSS files to the HTML head (within `index.html` if [routing](/core-plugins/router)). 

<x-code-group copy>

```html "Bundled (47kb)"
  <link rel="stylesheet" href="/manifest.theme.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css">
```

```html "Individual (<10kb)"
  <link rel="stylesheet" href="/manifest.theme.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.reset.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.buttons.css">
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.utilities.css">
```

</x-code-group>