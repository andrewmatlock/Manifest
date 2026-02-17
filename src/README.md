# Manifest Development

## Quick Start

```bash
npm run start:src    # Start src directory with live reload
npm run start:docs   # Start docs directory with live reload
npm run start:starter # Start starter template with live reload
```

---

## Build

```bash
npm run build
```

**Build Process:**
- Combines subscripts into monolith plugin files (components, router, utilities, auth, data, etc.)
- Bundles CSS stylesheets from `/src/styles` into `manifest.css`
- Minifies CSS files (`manifest.css` → `manifest.min.css`, `manifest.code.css` → `manifest.code.min.css`)
- Syncs starter template from `/templates/starter` to `/packages/create-starter/templates`
- Copies all files to `/dist` directory for npm publishing

**Note:** The build process no longer creates bundles (`manifest.bundle.js`, `manifest.quickstart.js`). Only the dynamic loader (`manifest.js`) is produced, which loads plugins on-demand from CDN.

---

## Publish to npm and jsDelivr

**Manual Publishing Steps:**

1. **Build the project:**
   ```bash
   npm run build
   ```

2. **Update version in package.json:**
   ```bash
   npm version patch  # or minor, or major
   ```
   Or manually edit `package.json` to set the version.

3. **Commit and tag:**
   ```bash
   git add .
   git commit -m "Release vX.X.X"
   git tag vX.X.X
   git push origin master
   git push origin vX.X.X
   ```

4. **Publish to npm:**
   ```bash
   npm publish --access public
   ```

5. **Publish starter template (optional):**
   ```bash
   npm run publish:starter
   ```

**Note:** You must be logged into npm (`npm login`) before publishing.

Files are then available at CDN URLs like:
- `https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.js` (dynamic loader)
- `https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.css`
- `https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.min.css`
- `https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.components.js` (plugin)
- `https://cdn.jsdelivr.net/npm/mnfst@latest/dist/manifest.data.js` (plugin)
- etc.

### Version Numbering Strategy

**Main Package (mnfst):**
- Use semantic versioning (MAJOR.MINOR.PATCH)
- For bug fixes and small improvements: `npm version patch` (0.5.14 → 0.5.15)
- For new features: `npm version minor` (0.5.14 → 0.6.0)
- For breaking changes: `npm version major` (0.5.14 → 1.0.0)
- Always check existing tags first: `git tag --list | tail -5`
- If version already exists, manually update `package.json` and commit before tagging

**Starter Template (manifestjs-starter):**
- Independent versioning from main package
- Current version in `packages/create-starter/package.json`
- Use `npm version patch` in the create-starter directory
- Or manually update version and run `npm run publish:starter`

**Publishing Workflow:**
1. Make changes and commit
2. Check current version: `git tag --list | tail -5`
3. Update version: `npm version patch` (or manually edit package.json)
4. Create and push tag: `git tag vX.X.X && git push origin vX.X.X`
5. Publish: `npm publish --access public`
6. For starter template: `npm run publish:starter`

---

## Publish Starter Template

```bash
npm run publish:starter
```
Publishes starter template to npm as `manifestjs-starter`.

---

## Install Starter Template

```bash
npx manifestjs-starter my-app
```
Creates new Manifest project from template.

---

## Update Manifest Files

### Individual File Updates

```bash
npx manifestjs-add js
npx manifestjs-add css
npx manifestjs-add theme
npx manifestjs-add code
```
Downloads and overwrites specific Manifest files with latest versions from CDN.

### Bulk Update

```bash
npx manifestjs-add update
```
Scans project directory and updates all Manifest files except `manifest.theme.css` (which is preserved for custom modifications).

**Note:** These commands require the `manifestjs-add` package to be published to npm first.