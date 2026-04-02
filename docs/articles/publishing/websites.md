# Websites
Publish Manifest projects live to the web.

---

## Default (SPA)

Manifest projects function as a single page application (SPA) by default, using JavaScript for routing. To deploy live on a host environment:

- Deploy the project root directory
- Set the root to `./` if applicable
- Set the fallback file to `./index.html` if applicable

The [starter project](/getting-started/starter-project) includes a `_redirects` file to assist the host with SPA routing.

---

## Optimized (MPA)

Search engines and AI crawlers will execute limited or no JavaScript when indexing websites, effectively rendering SPAs invisible. To adapt, Manifest provides a CLI build script to generate a multi-page application (MPA), where every route is represented by a static, crawlable `index.html`.

### Prerendering

The CLI build script prerenders your SPA into an MPA. From the project root run:

```bash copy
npx mnfst-render
```

By default, output is generated in a `/website` folder which includes:

- Copies of all folders and assets from the project, preserving path references.
- Folders for each route containing its compiled `index.html` page.
- Folders for each locale (e.g. `/fr`, `/zh`), and page sub-folder as applicable.
- Canonical and hreflang links aded to each page.
- `og:locale`/`og:locale:alternate` for localized builds when Open Graph tags exist.
- `sitemap.xml` and `robots.txt` files.

---

### Configuration

Use `manifest.json` to optionally customize the MPA build.

- `live_url` is the domain the generated `sitemap.xml` and `robots.txt` files reference.
- `prefender` contains further sub-options:

```json "manifest.json" copy
{
  "live_url": "https://example.com",
  "prerender": {
    "output": "website",
    "routerBase": "",
    "locales": ["en", "fr", "zh"],
    "redirects": [
      { "from": "/old", "to": "/new", "status": 301 }
    ],
    "wait": 15000,
    "waitAfterIdle": 0,
    "concurrency": 6
  }
}
```

---

### Hydration

The prerendering build process makes all HTML/Alpine content static. To hide an element from the prerendering process and preserve its source code (e.g. to keep dynamic functionality), apply the `data-hydrate` attribute to the HTML tag. For example:

<x-code-group>

```html "Hydrated"
/* Maintains source code & dynamic functionality */
<div x-data="{ counter: 0 }" data-hydrate>
  <button @click="counter++" x-text="counter"></button>
</div>
```

```html "Default/Static"
/* Uses static value from prendered snapshot */
<div x-data="{ counter: 0 }">
  <button @click="counter++">0</button>
</div>
```

</x-code-group>

---

### Publishing

To deploy an MPA on a host environment, set the root directory to the prerendered output directory (i.e. `./website`).