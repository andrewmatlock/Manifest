# Websites
Publish live sites to the web.

---

## Publishing (SPA)

Manifest projects function as a single page application (SPA) by default, requiring JavaScript for routing. To deploy live on a host environment:

[] Deploy the project root directory
[] Set the root to `./` if applicable
[] Set the entry point to `./index.html` if applicable

The [starter project](/docs/getting-started/starter-project) includes a `_redirects` file for a host's routing assistance.

---

## Web Optimization

AI crawlers and search engines like Google will execute limited or no JavaScript when indexing websites, effectively making SPAs invisible to them. To adapt, Manifest provides a CLI build script to generate a multi-page application (MPA).

An MPA is effectively a legacy website directory where every route is represented by a static, crawlable `index.html`. These page files are hydrated, preserving any dynamic functionality.

### Prerendering

Run `npx mnfst-render` to compile your project into an MPA. By default, output is generated in `/website`.

The output includes:

- Copies of all folders and assets in the project to preserve path references.
- Folders for each route containing its compiled `index.html` page.
- Localized projects include additional folders per locale (e.g. `/fr`, `/zh`) and default-locale slug folders (e.g. `/en`) in addition to root pages.

#### Command

```bash
npx mnfst-render
```

Optional flags:

- `--root <path>`: Render a project in a subdirectory (defaults to current directory).
- `--local <url>`: Use an existing local server URL.
- `--live <url>`: Override production origin for canonical/sitemap/robots.
- `--out <dir>`: Override output directory.
- `--wait <ms>`: Route-ready timeout override.
- `--wait-after-idle <ms>`: Extra wait after network idle.
- `--concurrency <n>`: Parallel page renders.
- `--dry-run`: Resolve paths/config without writing output.

#### `manifest.json` config

Use optional `prerender` settings:

```json
{
  "live_url": "https://example.com",
  "prerender": {
    "output": "website",
    "localUrl": "http://localhost:5001",
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

Notes:

- `output` defaults to `website`.
- `live_url` is preferred (legacy `liveUrl` is still supported).
- `localUrl` is optional. If omitted, the renderer starts a built-in static server.

#### Build behavior

The renderer:

- Crawls route conditions and data-driven paths.
- Generates static pages for each path plus `404.html` using `x-route="!*"`.
- Writes `robots.txt` and `sitemap.xml` using `live_url`.
- Writes `_redirects` when `manifest.prerender.redirects` is provided.
- Resolves `$x.*` head bindings in prerendered output (author/description/og, etc.).
- Injects canonical + hreflang links per page.
- Injects `og:locale`/`og:locale:alternate` for localized builds when Open Graph tags exist.
- Marks pages with `<meta name="manifest:prerendered" content="1">` so runtime routing uses browser page loads (MPA navigation) instead of SPA interception.

#### Localized URL structure

- Default locale pages are generated at root (`/`, `/about`) and under default slug (`/en`, `/en/about`).
- Non-default locales are generated under locale slugs (`/fr`, `/fr/about`).
- Default-locale slug pages canonicalize to root equivalents for SEO.

#### Runtime/browser dependencies

`mnfst-render` requires a Chromium runtime and supports:

- `puppeteer` (recommended local default), or
- `puppeteer-core` + `@sparticuz/chromium`.

If unavailable, the CLI prints install guidance.

---

### Publishing (MPA)

To deploy an MPA on a host environment:

[] Set the root directory to the prerendered output directory (i.e. `./website`)
[] Set the fallback file to `./index.html` if applicable

---

## Checklist

For best practice, fulfill this checklist before publishing to the web.

`index.html`
- [ ] Change `<html lang="en">` to default language code
- [ ] Update head `<title>` and `<meta>` tags

`manifest.json`
- [ ] Update project config properties (e.g. name, author)
- [ ] Update or remove HTML components and data sources (e.g. for localization)

**Style & Content**
- [ ] Update `manifest.theme.css` variables
- [ ] Update `logo.html`, `header.html` and `footer.html` components
- [ ] Create custom HTML components for pages, sections, etc.
- [ ] Update index.html `<body>` with top-level routes and components
- [ ] Update or remove `LICENSE.md` and `privacy.md` text for your use case

**Websites**
- [ ] Replace `favicon.ico`
- [ ] Run `npx mnfst-render` to build optimized <a href="https://manifestjs.org/publishing/websites" target="_blank">websites</a>

**Web apps**
- [ ] Replace or remove `/icons` images referenced in manifest.json