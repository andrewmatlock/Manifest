# Manifest Starter Project

---

## 🚀 Quick Start

Manifest projects include a built-in SPA router and require a local server to run.

**Local Server Options (choose one):**

1. **Python** (works on most systems): `python3 -m http.server 8000`

2. **Node.js** (if you have it installed): `npx http-server`

3. **Other options**:
   - VS Code Live Server extension
   - Browsersync (requires installation)
   - Any other static file server

---

## 📁 Project Structure

```
project-name/
├── components/               # Reusable HTML components
│   ├── header.html           # Page header
│   ├── footer.html           # Page footer
│   └── logo.html             # Inline SVG logo
├── icons/                    # Web app (PWA) icons referenced in manifest.json
│   ├── 192x192.png           # Small icon variant
│   └── 512x512.png           # Large icon variant
├── _redirects                # SPA routing support for modern static hosts
├── favicon.ico               # Browser tab icon
├── index.html                # Rendering entry point / main page
├── LICENSE.md                # MIT License
├── locales.csv               # Translated content in English, Arabic, and Chinese
├── manifest.json             # Project & web app manifest
├── manifest.theme.css        # Project theme variables
├── privacy.md                # Privacy policy template, required by most sites & apps
├── README.md                 # This file
├── robots.txt                # Website SEO asset
└── sitemap.xml               # Website SEO asset
```

---

## ✅ Checklist

`index.html`
- [ ] Change `<html lang="en">` to default language code
- [ ] Update head `<title>` and `<meta>` tags, and add any custom links or scripts

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
- [ ] Update `robots.txt` and `sitemap.xml` for SEO
- [ ] `_redirects` and `.htaccess` files are included for SPA routing support on most hosting services

**Web apps**
- [ ] Replace or remove `/icons` images referenced in manifest.json

---

## 📚 Learn More

This project supports routes, components, dynamic data, localization, icons, color themes, and much more.

For comprehensive documentation visit [manifestjs.dev](https://manifestjs.dev).

---

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.