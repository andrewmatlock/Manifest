#!/usr/bin/env node

/* Manifest Render */

import { readFileSync, readSync, mkdirSync, writeFileSync, existsSync, rmSync, statSync, readdirSync, cpSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, relative, basename, sep } from 'node:path';
import { createServer } from 'node:http';
import { cpus } from 'node:os';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

async function importFromProject(moduleName) {
  // Ensure dependencies are resolved from the caller's project (cwd),
  // not from this CLI package's own node_modules location.
  try {
    const resolved = require.resolve(moduleName, { paths: [process.cwd()] });
    return await import(resolved);
  } catch {
    return await import(moduleName);
  }
}


async function flushAlpineEffects(page) {
  await page
    .evaluate(() => {
      return new Promise((resolve) => {
        try {
          if (typeof Alpine !== 'undefined' && typeof Alpine.nextTick === 'function') {
            Alpine.nextTick(() => {
              if (typeof Alpine.nextTick === 'function') Alpine.nextTick(resolve);
              else resolve();
            });
          } else {
            queueMicrotask(resolve);
          }
        } catch {
          resolve();
        }
      });
    })
    .catch(() => {});
}

/**
 * Same logical path → normalizedPath as waitForManifestPrerenderPipeline and
 * manifest.router.visibility initialize (matchesCondition first argument).
 */
function logicalPathToVisibilityNormalizedPath(pathSeg, locales) {
  const pathname = pathSeg ? `/${pathSeg}` : '/';
  const clean = String(pathname || '/').replace(/^\/+|\/+$/g, '');
  const parts = clean ? clean.split('/') : [];
  const localeList = Array.isArray(locales) ? locales : [];
  const logical =
    parts.length > 0 && localeList.includes(parts[0])
      ? `/${parts.slice(1).join('/')}`
      : clean
        ? `/${clean}`
        : '/';
  const to = logical === '//' ? '/' : logical;
  return typeof to === 'string' && to !== '/' ? to.replace(/^\/|\/$/g, '') : '/';
}

/**
 * Set locale, dispatch route/locale events, call component swapping, then wait for
 * manifest:render-ready — the authoritative signal from the data plugin that all tracked
 * sources have settled for the active locale.
 *
 * Falls back to a timeout if the data plugin is absent or predates manifest:render-ready,
 * so this is backward-compatible with any Manifest project.
 */
async function waitForManifestRenderReady(page, { allLocales, currentLocale, timeoutMs }) {
  const result = await page
    .evaluate(
      async ({ localeList, loc, ms }) => {
        try {
          const locales = Array.isArray(localeList) ? localeList : [];

          // 1. Align locale state before dispatching any events.
          if (loc && typeof loc === 'string') {
            try { document.documentElement.lang = loc; } catch { /* no-op */ }
          }
          const localeStore = typeof Alpine !== 'undefined' && Alpine.store
            ? Alpine.store('locale') : null;
          if (localeStore) {
            if (!Array.isArray(localeStore.available) || localeStore.available.length === 0) {
              localeStore.available = locales.slice();
            } else {
              localeStore.available = Array.from(new Set([...localeStore.available, ...locales]));
            }
            if (loc && typeof loc === 'string') localeStore.current = loc;
          }

          // 2. Compute normalised route path (strips locale prefix, matches router logic).
          const rawRoute = window.ManifestRoutingNavigation?.getCurrentRoute?.()
            ?? window.location.pathname;
          const clean = String(rawRoute || '/').replace(/^\/+|\/+$/g, '');
          const parts = clean ? clean.split('/') : [];
          const logical =
            parts.length > 0 && locales.includes(parts[0])
              ? '/' + parts.slice(1).join('/')
              : clean ? '/' + clean : '/';
          const to = logical === '//' ? '/' : logical;
          const normalizedPath =
            typeof to === 'string' && to !== '/' ? to.replace(/^\/|\/$/g, '') : '/';

          // 3. Register the manifest:render-ready listener BEFORE dispatching events so we
          //    never miss a fast-settling response. Falls back to timeout for older data plugins.
          const renderReadyPromise = new Promise((resolve) => {
            const onReady = (e) => resolve({ ok: true, locale: e.detail?.locale });
            window.addEventListener('manifest:render-ready', onReady, { once: true });
            setTimeout(() => {
              window.removeEventListener('manifest:render-ready', onReady);
              resolve({ ok: false, reason: 'timeout' });
            }, ms);
          });

          // 4. Dispatch locale change — triggers localized source reloads in the data plugin.
          if (loc && typeof loc === 'string') {
            window.dispatchEvent(new CustomEvent('localechange', { detail: { locale: loc } }));
          }

          // 5. Dispatch route change — ensures router visibility and head content are current.
          window.dispatchEvent(new CustomEvent('manifest:route-change', {
            detail: { from: to, to, normalizedPath },
          }));
          window.dispatchEvent(new PopStateEvent('popstate'));

          // 6. Run component swapping explicitly so components tied to this route render
          //    and trigger any $x accesses that start on-demand data loads.
          if (window.ManifestComponentsSwapping?.processAll) {
            try {
              await window.ManifestComponentsSwapping.processAll(normalizedPath);
            } catch (e) {
              return { ok: false, reason: 'processAll-error', message: String(e?.message || e) };
            }
          }

          // 7. Await the authoritative signal (or timeout fallback).
          return await renderReadyPromise;
        } catch (err) {
          return { ok: false, reason: 'error', message: String(err?.message || err) };
        }
      },
      { localeList: allLocales, loc: currentLocale, ms: timeoutMs }
    )
    .catch((e) => ({ ok: false, reason: 'evaluate', message: String(e) }));

  if (!result?.ok) {
    const parts = [`prerender: render-ready wait incomplete (${result?.reason ?? 'unknown'})`];
    if (result?.message) parts.push(result.message);
    process.stdout.write(`${parts.join('; ')}\n`);
  }
}

// --- Config ------------------------------------------------------------------

function parseArgs() {
  const args = process.argv.slice(2);
  const out = {};
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--base' && args[i + 1]) { out.baseUrl = args[++i]; continue; }
    if (args[i] === '--local' && args[i + 1]) { out.localUrl = args[++i]; continue; }
    if (args[i] === '--live' && args[i + 1]) { out.liveUrl = args[++i]; continue; }
    if (args[i] === '--out' && args[i + 1]) { out.output = args[++i]; continue; }
    if (args[i] === '--root' && args[i + 1]) { out.root = args[++i]; continue; }
    if (args[i] === '--serve') { out.serve = true; continue; }
    if (args[i] === '--wait' && args[i + 1]) { out.wait = parseInt(args[++i], 10); continue; }
    if (args[i] === '--wait-after-idle' && args[i + 1]) { out.waitAfterIdle = parseInt(args[++i], 10); continue; }
    if (args[i] === '--concurrency' && args[i + 1]) { out.concurrency = parseInt(args[++i], 10); continue; }
    if (args[i] === '--dry-run') { out.dryRun = true; continue; }
    if (args[i] === '--debug-prerender') { out.debugPrerender = true; continue; }
  }
  return out;
}

function loadConfig(rootDir) {
  const manifestPath = join(rootDir, 'manifest.json');
  if (!existsSync(manifestPath)) {
    return { prerender: {} };
  }
  const raw = readFileSync(manifestPath, 'utf8');
  let manifest;
  try {
    manifest = JSON.parse(raw);
  } catch {
    return { prerender: {} };
  }
  return manifest;
}

function normalizeLocaleRouteExclude(val) {
  if (val == null) return [];
  if (Array.isArray(val)) return val.map((s) => String(s).trim()).filter(Boolean);
  if (typeof val === 'string') return val.split(',').map((s) => s.trim()).filter(Boolean);
  return [];
}

function resolveConfig() {
  const cli = parseArgs();
  const cwd = process.cwd();
  const root = resolve(cwd, cli.root ?? '.');
  const manifest = loadConfig(root);
  const pre = manifest.prerender ?? {};

  const localUrl = (cli.localUrl ?? cli.baseUrl ?? process.env.PRERENDER_BASE ?? pre.localUrl ?? pre.baseUrl)?.replace(/\/$/, '');
  const serve = cli.localUrl ? false : (cli.serve !== undefined ? !!cli.serve : true);
  if (!serve && !localUrl) {
    console.error('prerender: localUrl is required when not using built-in server. Set manifest.prerender.localUrl or use --local.');
    process.exit(1);
  }
  const liveUrl = (cli.liveUrl ?? process.env.PRERENDER_LIVE ?? manifest.live_url ?? manifest.liveUrl ?? pre.live_url ?? pre.liveUrl ?? localUrl ?? '')?.replace(/\/$/, '');

  return {
    localUrl: localUrl ?? '',
    liveUrl,
    serve,
    output: resolve(root, cli.output ?? pre.output ?? 'website'),
    root,
    routerBase: pre.routerBase ?? null,
    /** Logical path prefixes (after locale) that skip sticky locale prefix; see manifest:locale-route-exclude */
    localeRouteExclude: normalizeLocaleRouteExclude(
      pre.localeRouteExclude ?? pre.localeStickyExclude
    ),
    locales: pre.locales,
    redirects: Array.isArray(pre.redirects) ? pre.redirects : [],
    wait: cli.wait ?? pre.wait ?? null,
    waitAfterIdle: 0,
    concurrency: Math.max(1, cli.concurrency ?? pre.concurrency ?? Math.max(4, cpus().length - 1)),
    localeSubstitution: true,
    localeSubstitutionExclude: [],
    /** Explicit locale-neutral paths to render in addition to those discovered automatically.
     *  Each entry is expanded to all locale variants (e.g. "legal/privacy" → "cs/legal/privacy", ...) */
    paths: Array.isArray(pre.paths)
      ? pre.paths.map((p) => String(p).replace(/^\/+|\/+$/g, '')).filter(Boolean)
      : [],
    dryRun: !!cli.dryRun,
    debugPrerender: !!cli.debugPrerender,
    pipelineTimeout: 25000,
  };
}

// --- Discovery: locales from manifest.data -----------------------------------
// Picks up (1) object keys that are locale codes (e.g. "en", "fr" in data.features)
// and (2) "locales" properties that point to CSV (or array of CSVs); locale codes from CSV header row.

const LOCALE_CODE_RE = /^[a-z]{2}(-[A-Z]{2})?$/i;

function localeCodesFromCsvHeader(rootDir, filePath) {
  const fullPath = join(rootDir, filePath.startsWith('/') ? filePath.slice(1) : filePath);
  if (!existsSync(fullPath)) return [];
  const text = readFileSync(fullPath, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length === 0) return [];
  const header = splitCsvLine(lines[0]);
  if (header.length < 2) return [];
  // First column is key; rest are locale columns (per localization docs)
  return header.slice(1).filter((col) => LOCALE_CODE_RE.test(String(col).trim())).map((c) => String(c).trim().toLowerCase());
}

function discoverLocales(manifest, rootDir) {
  const codes = new Set();
  const data = manifest.data;
  if (!data || typeof data !== 'object') return [];
  for (const v of Object.values(data)) {
    if (!v || typeof v !== 'object' || Array.isArray(v)) continue;
    // Object keys that are locale codes (JSON/YAML per-locale files)
    for (const k of Object.keys(v)) {
      if (LOCALE_CODE_RE.test(k)) codes.add(k.toLowerCase());
    }
    // "locales" → single CSV path or array of CSV paths; locale codes from CSV headers
    const localesRef = v.locales;
    if (localesRef != null) {
      const files = Array.isArray(localesRef) ? localesRef : [localesRef];
      for (const filePath of files) {
        if (typeof filePath !== 'string') continue;
        localeCodesFromCsvHeader(rootDir, filePath).forEach((c) => codes.add(c));
      }
    }
  }
  return [...codes];
}

// --- Discovery: x-route from HTML --------------------------------------------

function extractXRouteConditions(html) {
  const conditions = new Set();
  const re = /x-route\s*=\s*["']([^"']+)["']/gi;
  let m;
  while ((m = re.exec(html)) !== null) {
    m[1].split(',').forEach((c) => {
      const t = c.trim();
      if (t && !t.startsWith('!')) conditions.add(t);
    });
  }
  return conditions;
}

function normalizeRouteCondition(cond) {
  const raw = String(cond || '').trim();
  if (!raw) return { kind: 'all', path: '' };
  if (raw.startsWith('!')) {
    const omitted = raw.slice(1).trim();
    if (!omitted || omitted === '*') return { kind: 'not-found', path: '' }; // !*
    return { kind: 'omit', path: omitted };
  }
  if (raw === '*') return { kind: 'all', path: '' };
  const withoutExact = raw.startsWith('=') ? raw.slice(1) : raw;
  const trimmed = withoutExact.replace(/^\/+|\/+$/g, '');
  if (!trimmed) return { kind: 'root', path: '' };
  if (trimmed.endsWith('/*')) {
    const base = trimmed.slice(0, -2).replace(/^\/+|\/+$/g, '');
    return base ? { kind: 'wildcard-prefix', path: base } : { kind: 'all', path: '' };
  }
  if (trimmed.includes('*')) return { kind: 'unsupported-pattern', path: trimmed };
  return { kind: 'path', path: trimmed };
}

function conditionsToPaths(conditions) {
  const paths = new Set();
  paths.add('/');
  for (const c of conditions) {
    const parsed = normalizeRouteCondition(c);
    // Discovery rules aligned with router docs:
    // - "*" and omitted routes do not define concrete paths.
    // - "!*" is handled separately via explicit NOT_FOUND path.
    // - "about/*" does not include "/about" by itself; concrete children come from data paths.
    if (parsed.kind === 'path') paths.add('/' + parsed.path);
    else if (parsed.kind === 'root') paths.add('/');
  }
  return paths;
}

function getWildcardBasesFromConditions(conditions) {
  const bases = new Set();
  for (const c of conditions) {
    const parsed = normalizeRouteCondition(c);
    if (parsed.kind === 'wildcard-prefix' && parsed.path) bases.add(parsed.path);
  }
  return [...bases];
}

// --- Discovery: data-driven paths (docs-style YAML group/items[].path) ------

function parseYamlPaths(filePath) {
  if (!existsSync(filePath)) return [];
  const text = readFileSync(filePath, 'utf8');
  const paths = [];
  let currentGroup = '';
  const lines = text.split(/\r?\n/);
  for (const line of lines) {
    const groupMatch = line.match(/^group:\s*["']?([^"'\n]+)["']?/);
    if (groupMatch) {
      currentGroup = groupMatch[1].trim().toLowerCase().replace(/\s+/g, '-');
      continue;
    }
    const pathMatch = line.match(/path:\s*["']?([^"'\n]+)["']?/);
    if (pathMatch && currentGroup) {
      const segment = pathMatch[1].trim();
      paths.push(`${currentGroup}/${segment}`);
    }
    const genericPathMatch = line.match(/^\s*(?:-\s*)?(?:path|slug):\s*["']?([^"'\n#]+)["']?/);
    if (genericPathMatch) {
      const v = genericPathMatch[1].trim().replace(/^\/+|\/+$/g, '');
      if (v && !v.includes('*') && !/\.[a-z0-9]+$/i.test(v)) {
        paths.push(v);
      }
    }
  }
  return paths;
}

function parseJsonPaths(filePath, sourceKey) {
  if (!existsSync(filePath)) return [];
  const raw = readFileSync(filePath, 'utf8');
  let data;
  try {
    data = JSON.parse(raw);
  } catch {
    return [];
  }
  const paths = [];
  function collectPathSlug(obj) {
    if (!obj || typeof obj !== 'object') return;
    if (Array.isArray(obj)) {
      obj.forEach((item) => {
        if (item && typeof item === 'object') {
          if (typeof item.path === 'string') paths.push(item.path);
          else if (typeof item.slug === 'string') paths.push(item.slug);
          if (item.group && Array.isArray(item.items)) {
            const group = String(item.group).toLowerCase().replace(/\s+/g, '-');
            item.items.forEach((i) => {
              if (i && typeof i.path === 'string') paths.push(`${group}/${i.path}`);
            });
          }
        }
      });
      return;
    }
    for (const v of Object.values(obj)) collectPathSlug(v);
  }
  collectPathSlug(data);
  return paths;
}

function splitCsvLine(line) {
  const out = [];
  let cur = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (c === '"') inQuotes = !inQuotes;
    else if (c === ',' && !inQuotes) {
      out.push(cur.trim().replace(/^["']|["']$/g, ''));
      cur = '';
    } else cur += c;
  }
  out.push(cur.trim().replace(/^["']|["']$/g, ''));
  return out;
}

function parseCsvPaths(filePath) {
  if (!existsSync(filePath)) return [];
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];
  const paths = [];
  const header = splitCsvLine(lines[0]).map((c) => c.toLowerCase());
  const pathIdx = header.indexOf('path');
  const slugIdx = header.indexOf('slug');
  const keyIdx = header.indexOf('key');
  const valIdx = header.indexOf('value');
  if (pathIdx >= 0 || slugIdx >= 0) {
    const col = pathIdx >= 0 ? pathIdx : slugIdx;
    for (let i = 1; i < lines.length; i++) {
      const row = splitCsvLine(lines[i]);
      const v = row[col];
      if (v) paths.push(v);
    }
  }
  if (keyIdx >= 0 && valIdx >= 0) {
    for (let i = 1; i < lines.length; i++) {
      const row = splitCsvLine(lines[i]);
      const key = row[keyIdx];
      const val = row[valIdx];
      if (key && (key === 'path' || key.endsWith('.path')) && val) paths.push(val);
    }
  }
  return paths;
}

function discoverDataPaths(manifest, rootDir, wildcardBases = [], locales = []) {
  const paths = new Set();
  const data = manifest.data;
  if (!data || typeof data !== 'object') return paths;
  const localeSet = new Set((locales || []).map((l) => String(l).toLowerCase()));

  function shouldIncludeDataPath(rawPath) {
    const p = String(rawPath || '').replace(/^\/+|\/+$/g, '');
    if (!p || p.includes('#') || p.includes('?') || p.includes('*')) return false;
    if (wildcardBases.length === 0) return true;
    const segs = p.split('/');
    const rest = segs.length > 1 && localeSet.has(segs[0].toLowerCase()) ? segs.slice(1).join('/') : p;
    return wildcardBases.some((base) => rest.startsWith(base + '/'));
  }

  function expandCandidates(rawPath, sourceKey) {
    const p = String(rawPath || '').replace(/^\/+|\/+$/g, '');
    if (!p) return [];
    const candidates = [p];
    if (wildcardBases.length === 0) return candidates;
    if (!sourceKey || !wildcardBases.includes(sourceKey)) return candidates;
    const parts = p.split('/');
    const hasLocalePrefix = parts.length > 1 && localeSet.has(parts[0].toLowerCase());
    if (hasLocalePrefix) {
      const locale = parts[0];
      const rest = parts.slice(1).join('/');
      if (rest && !rest.startsWith(sourceKey + '/')) candidates.push(`${locale}/${sourceKey}/${rest}`);
    } else if (!p.startsWith(sourceKey + '/')) {
      candidates.push(`${sourceKey}/${p}`);
    }
    return candidates;
  }

  function addFilePaths(value, sourceKey) {
    if (typeof value !== 'string' || !value.startsWith('/')) return;
    const filePath = join(rootDir, value.slice(1));
    if (filePath.endsWith('.yaml') || filePath.endsWith('.yml')) {
      parseYamlPaths(filePath).forEach((p) => {
        for (const c of expandCandidates(p, sourceKey)) {
          if (shouldIncludeDataPath(c)) paths.add('/' + c);
        }
      });
    } else if (filePath.endsWith('.json')) {
      parseJsonPaths(filePath).forEach((p) => {
        const normalized = p.startsWith('/') ? p.slice(1) : p;
        for (const c of expandCandidates(normalized, sourceKey)) {
          if (shouldIncludeDataPath(c)) paths.add('/' + c);
        }
      });
    } else if (filePath.endsWith('.csv')) {
      parseCsvPaths(filePath).forEach((p) => {
        const normalized = p.startsWith('/') ? p.slice(1) : p;
        for (const c of expandCandidates(normalized, sourceKey)) {
          if (shouldIncludeDataPath(c)) paths.add('/' + c);
        }
      });
    }
  }

  for (const [sourceKey, value] of Object.entries(data)) {
    if (typeof value === 'string') addFilePaths(value, sourceKey);
    else if (value && typeof value === 'object') {
      for (const v of Object.values(value)) {
        if (typeof v === 'string') addFilePaths(v, sourceKey);
      }
    }
  }
  return paths;
}

// --- Collect all paths from index + components -------------------------------

function discoverRoutes(manifest, rootDir) {
  const pathSet = new Set();
  pathSet.add('/');
  const allConditions = new Set();
  const locales = discoverLocales(manifest, rootDir);

  const indexPath = join(rootDir, 'index.html');
  if (existsSync(indexPath)) {
    const indexHtml = readFileSync(indexPath, 'utf8');
    const conditions = extractXRouteConditions(indexHtml);
    conditions.forEach((c) => allConditions.add(c));
    conditionsToPaths(conditions).forEach((p) => pathSet.add(p));
  }

  const componentDirs = [
    ...(manifest.preloadedComponents || []),
    ...(manifest.components || []),
  ];
  for (const rel of componentDirs) {
    const compPath = join(rootDir, rel);
    if (existsSync(compPath)) {
      const html = readFileSync(compPath, 'utf8');
      const conditions = extractXRouteConditions(html);
      conditions.forEach((c) => allConditions.add(c));
      conditionsToPaths(conditions).forEach((p) => pathSet.add(p));
    }
  }

  const wildcardBases = getWildcardBasesFromConditions(allConditions);
  discoverDataPaths(manifest, rootDir, wildcardBases, locales).forEach((p) => pathSet.add(p));

  const arr = [...pathSet].map((p) => (p === '/' ? '' : p.replace(/^\//, '').replace(/\/$/, '') || ''));
  return arr.includes('') ? arr : ['', ...arr.filter(Boolean)];
}

// --- Normalize path to file path (no leading slash, empty = index) -----------

function pathToFileSegments(pathname) {
  const normalized = pathname.replace(/^\//, '').replace(/\/$/, '') || '';
  return normalized ? normalized.split('/') : [];
}

function validatePrerenderedOutput(outputDir, pathList) {
  const invalidPathTokens = pathList.filter((p) => /(^|\/)[*=]/.test(p) || p.includes('/*') || p.includes('*'));
  if (invalidPathTokens.length > 0) {
    throw new Error(`prerender validation failed: invalid discovered route token(s): ${invalidPathTokens.join(', ')}`);
  }

  const badFolders = [];
  function walk(dir, rel = '') {
    const entries = readdirSync(dir, { withFileTypes: true });
    for (const ent of entries) {
      if (!ent.isDirectory()) continue;
      const seg = ent.name;
      const nextRel = rel ? `${rel}/${seg}` : seg;
      if (seg.includes('*') || seg.startsWith('=')) badFolders.push(nextRel);
      walk(join(dir, seg), nextRel);
    }
  }
  if (existsSync(outputDir)) walk(outputDir, '');
  if (badFolders.length > 0) {
    throw new Error(`prerender validation failed: invalid output folder(s): ${badFolders.join(', ')}`);
  }
}

// --- Strip dev-only injected content (e.g. browser-sync) so dist works under any server -

function stripDevOnlyContent(html) {
  let out = html
    .replace(/<script[^>]*id=["']__bs_script__["'][^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<script[^>]*src=["'][^"']*browser-sync[^"']*["'][^>]*>\s*<\/script>/gi, '');
  return out;
}

// --- Strip CDN-injected plugin scripts from snapshot so only the loader remains ---
// When the static page loads, the loader runs once and adds plugins; avoids duplicate script execution.
function stripInjectedPluginScripts(html) {
  const pluginPattern =
    /<script[^>]*\ssrc=["'][^"']*manifest\.(?:components|router|utilities|data|icons|localization|markdown|code|themes|toasts|tooltips|dropdowns|tabs|slides|resize|tailwind|appwrite\.(?:auth|data|presence))[^"']*\.min\.js["'][^>]*>\s*<\/script>/gi;
  let out = html.replace(pluginPattern, '');
  const runtimePattern =
    /<script[^>]*\ssrc=["'][^"']*(?:alpinejs\/dist\/cdn\.min\.js|papaparse@[^"']*\/papaparse\.min\.js|marked\/marked\.min\.js|highlightjs\/cdn-release@[^"']*\/highlight\.min\.js)[^"']*["'][^>]*>\s*<\/script>/gi;
  out = out.replace(runtimePattern, '');
  return out;
}

function stripRuntimeTailwindArtifacts(html) {
  let out = html.replace(/\sdata-tailwind(?:=(["']).*?\1)?/gi, '');
  // Remove PlayCDN-injected runtime Tailwind stylesheet from snapshots.
  out = out.replace(/<style>\s*\/\*!\s*tailwindcss[\s\S]*?<\/style>/gi, '');
  return out;
}

/** Manifest utilities plugin: <style id="utility-styles"> and <style id="utility-styles-critical"> */
function extractUtilityStyleBlocks(html) {
  const blocks = [];
  let out = html.replace(
    /<style[^>]*\bid=["']utility-styles-critical["'][^>]*>([\s\S]*?)<\/style>/gi,
    (_, css) => {
      const t = (css || '').trim();
      if (t) blocks.push({ kind: 'critical', css: t });
      return '';
    }
  );
  out = out.replace(/<style[^>]*\bid=["']utility-styles["'][^>]*>([\s\S]*?)<\/style>/gi, (_, css) => {
    const t = (css || '').trim();
    if (t) blocks.push({ kind: 'main', css: t });
    return '';
  });
  return { html: out, blocks };
}

function injectBeforeHeadClose(html, snippet) {
  if (!snippet) return html;
  const hrefMatch = snippet.match(/href=["']([^"']+)["']/);
  const href = hrefMatch ? hrefMatch[1] : null;
  let out = html;
  if (href) {
    out = out.replace(new RegExp(`\\s*<link[^>]*href=["']${href.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}["'][^>]*>\\s*`, 'gi'), '\n');
  }
  return out.replace(/<\/head>/i, `${snippet}\n</head>`);
}

function indexHtmlUsesTailwind(rootDir) {
  const indexPath = join(rootDir, 'index.html');
  if (!existsSync(indexPath)) return false;
  const html = readFileSync(indexPath, 'utf8');
  return /\sdata-tailwind(?:=(["']).*?\1)?/i.test(html) && /<script[^>]*manifest\.min\.js/i.test(html);
}

function promptContinueWithRuntimeTailwind(rootDir) {
  const installMsg = [
    'prerender: tailwindcss package is not installed for this project.',
    '',
    'To enable static Tailwind CSS compilation, install:',
    '  npm i -D tailwindcss @tailwindcss/cli',
    '',
    `Project: ${rootDir}`,
    '',
    'Continue prerender with runtime data-tailwind instead? [P]roceed/[E]nd (default: P): ',
  ].join('\n');
  process.stdout.write(`${installMsg}\n`);

  if (!process.stdin.isTTY || !process.stdout.isTTY) {
    process.stdout.write(
      'prerender: non-interactive terminal detected; continuing with runtime data-tailwind behavior.\n'
    );
    return true;
  }
  const buf = Buffer.alloc(1);
  let answer = '';
  while (true) {
    const n = readSync(0, buf, 0, 1, null);
    if (n <= 0) break;
    const ch = buf.toString('utf8', 0, n);
    if (ch === '\n' || ch === '\r') break;
    answer += ch;
  }
  const normalized = answer.trim().toLowerCase();
  return normalized === '' || normalized === 'p' || normalized === 'proceed' || normalized === 'y' || normalized === 'yes';
}

/**
 * Build a static Tailwind stylesheet via @tailwindcss/cli (v4+), scanning project sources.
 * Only runs when the project uses data-tailwind on the manifest script tag (auto-detected).
 * Set manifest.prerender.tailwindInput to a custom CSS entry file if needed.
 */
function runTailwindCliForPrerender(rootDir, outputDir, pre) {
  if (!indexHtmlUsesTailwind(rootDir)) return false;

  const outCss = join(outputDir, 'prerender.tailwind.css');
  try {
    require.resolve('tailwindcss', { paths: [rootDir] });
  } catch {
    const proceed = promptContinueWithRuntimeTailwind(rootDir);
    if (!proceed) {
      throw new Error('prerender aborted: install tailwindcss/@tailwindcss/cli or remove data-tailwind from your manifest script tag.');
    }
    process.stdout.write('prerender: continuing with runtime data-tailwind behavior.\n');
    return false;
  }
  let inputPath = null;
  let createdTempInput = false;
  const userInput = pre?.tailwindInput;
  if (typeof userInput === 'string' && userInput.trim()) {
    inputPath = resolve(rootDir, userInput.trim());
  }
  if (!inputPath || !existsSync(inputPath)) {
    inputPath = join(rootDir, '.mnfst-prerender-tailwind-input.css');
    writeFileSync(inputPath, '@import "tailwindcss";\n', 'utf8');
    createdTempInput = true;
  }

  const outputBasename = basename(outputDir);
  const contentGlobs = [
    '**/*.html',
    '!**/node_modules/**',
    '!**/dist/**',
    `!**/${outputBasename}/**`,
  ];

  const args = [
    '--yes',
    '@tailwindcss/cli@4',
    '-i',
    inputPath,
    '-o',
    outCss,
  ];
  for (const g of contentGlobs) {
    args.push('--content', g);
  }

  process.stdout.write('prerender: compiling Tailwind CSS (this may take a minute)...\n');
  const r = spawnSync('npx', args, {
    cwd: rootDir,
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  if (createdTempInput) {
    try {
      unlinkSync(inputPath);
    } catch {
      // ignore
    }
  }
  if (r.status !== 0) {
    console.error('prerender: Tailwind CLI failed; install with `npm i -D tailwindcss @tailwindcss/cli` or check tailwindInput in manifest.prerender.');
    if (r.stderr) console.error(r.stderr);
    if (r.stdout) console.error(r.stdout);
    return false;
  }
  if (!existsSync(outCss)) {
    console.error('prerender: Tailwind CLI did not produce prerender.tailwind.css');
    return false;
  }
  process.stdout.write(`prerender: wrote ${relative(rootDir, outCss)}\n`);
  return true;
}

function mergeUtilityCssBlocks(allBlocks) {
  const critical = [];
  const main = [];
  const seenC = new Set();
  const seenM = new Set();
  for (const b of allBlocks) {
    if (b.kind === 'critical') {
      if (!seenC.has(b.css)) {
        seenC.add(b.css);
        critical.push(b.css);
      }
    } else {
      if (!seenM.has(b.css)) {
        seenM.add(b.css);
        main.push(b.css);
      }
    }
  }
  const parts = [];
  if (critical.length) parts.push('/* manifest utilities: critical */\n', critical.join('\n\n'));
  if (main.length) parts.push('/* manifest utilities */\n', main.join('\n\n'));
  return parts.join('\n');
}

function walkHtmlFiles(dir, out = []) {
  for (const ent of readdirSync(dir, { withFileTypes: true })) {
    if (ent.name.startsWith('.')) continue;
    const p = join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules') continue;
      walkHtmlFiles(p, out);
    } else if (ent.name.endsWith('.html')) out.push(p);
  }
  return out;
}

function depthFromOutputRoot(outputDir, filePath) {
  const rel = relative(outputDir, dirname(filePath));
  if (!rel || rel === '.') return 0;
  return rel.split(sep).filter(Boolean).length;
}

/** Root-absolute path for prerender bundles (same URL from every page depth; supports manifest:router-base). */
function buildRootAssetPath(routerBasePath, filename) {
  const base = String(routerBasePath || '').replace(/^\/+|\/+$/g, '');
  const name = String(filename || '').replace(/^\/+/, '');
  const path = base ? `${base}/${name}` : name;
  return '/' + path.replace(/\/{2,}/g, '/');
}

/** Inject stylesheet link with root-absolute href (avoids ../ resolving under locale segments like /en/page/). */
function postProcessInjectStylesheetLink(outputDir, filename, routerBasePath) {
  const cssPath = join(outputDir, filename);
  if (!existsSync(cssPath)) return;
  const stat = statSync(cssPath);
  if (stat.size === 0) return;

  const href = buildRootAssetPath(routerBasePath, filename);
  const tag = `<link rel="stylesheet" href="${href}">`;
  const files = walkHtmlFiles(outputDir);
  for (const file of files) {
    let html = readFileSync(file, 'utf8');
    html = injectBeforeHeadClose(html, tag);
    writeFileSync(file, html, 'utf8');
  }
}

// --- (Removed) We used to strip x-text containing product. / feature. to avoid wrong-scope errors
//    on duplicated x-for output, but that also stripped legitimate loop body bindings (e.g. product
//    search results), breaking reactivity. If "product/feature is not defined" appears again, fix
//    the duplicate structure or scope in the template instead of neutering all such x-text.
function stripDuplicatedLoopDirectives(html) {
  return html;
}

function isHydrateMarkedAttrs(attrsStr) {
  return /\sdata-prerender-hydrate(?:\s*=|[\s>])/i.test(attrsStr || '');
}

// --- Strip x-text and x-html that reference $x when static/SEO (content already in snapshot).
//    Do NOT strip when expression is user-driven: $route(, $search, $query. Those stay so Alpine can update.
//    Same rule for :attr in stripPrerenderDynamicBindings: bindings with $x are kept (content stays for SEO).
function stripPrerenderedXDataDirectives(html) {
  function isStatic(expr) {
    if (expr.includes('$route(')) return false;
    if (expr.includes('$search') || expr.includes('$query')) return false;
    return true;
  }
  return html.replace(/<(\w+)([^>]*)>/g, (full, tag, attrs) => {
    if (isHydrateMarkedAttrs(attrs)) return full;
    let outAttrs = attrs;
    outAttrs = outAttrs.replace(/\s+x-text="([^"]*\$x[^"]*)"/g, (match, expr) => (isStatic(expr) ? '' : match));
    outAttrs = outAttrs.replace(/\s+x-html="([^"]*\$x[^"]*)"/g, (match, expr) => (isStatic(expr) ? '' : match));
    return `<${tag}${outAttrs}>`;
  });
}

// --- Don't bake Alpine-only state into the snapshot; only $x-driven content should be prerendered.
//    For any :attr or x-bind:attr whose expression does NOT contain $x, remove the literal attr from the tag
//    so Alpine re-evaluates on load. Bindings that use $x are left as-is (content stays for SEO), except
//    :style / x-bind:style with $x: those must be removed when a baked inline style exists, or Alpine will
//    overwrite prerendered values (e.g. mask-image) on hydrate when $x is briefly empty in production.
//    Use (?<!:) so we only strip literal attr=, not :attr= (e.g. class= not :class=).
//    Never touch <script> tags (loader + injected plugins must be preserved; static HTML still runs them).
function stripPrerenderDynamicBindings(html) {
  return html.replace(/<(\w+)([^>]*)>/g, (match, tagName, attrsStr) => {
    if (tagName.toLowerCase() === 'script') return match;
    if (isHydrateMarkedAttrs(attrsStr)) return match;
    const isAnchor = tagName.toLowerCase() === 'a';
    const isImg = tagName.toLowerCase() === 'img';
    let workAttrs = attrsStr;
    workAttrs = workAttrs.replace(/\s+:style=(?:"([^"]*)"|'([^']*)')/gi, (sub, d, s) => {
      const val = (d !== undefined ? d : s) || '';
      return val.indexOf('$x') !== -1 ? '' : sub;
    });
    workAttrs = workAttrs.replace(/\s+x-bind:style=(?:"([^"]*)"|'([^']*)')/gi, (sub, d, s) => {
      const val = (d !== undefined ? d : s) || '';
      return val.indexOf('$x') !== -1 ? '' : sub;
    });

    const toStrip = new Set();
    const bindingRegex = /(?:^|\s)(?::|x-bind:)(\w+)=(?:"([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = bindingRegex.exec(workAttrs)) !== null) {
      const attrName = (m[1] || '').toLowerCase();
      // Keep href on anchors and src on images: :href / :src often reference x-for iterators (e.g.
      // article?.banner). Stripping the baked literal leaves only :src/:href and breaks static HTML.
      if (attrName === 'class' || attrName === 'style' || (isAnchor && attrName === 'href') || (isImg && attrName === 'src')) continue;
      const val = (m[2] !== undefined ? m[2] : m[3]) || '';
      if (val.indexOf('$x') === -1) toStrip.add(attrName);
    }
    if (toStrip.size === 0 && workAttrs === attrsStr) return match;
    let newAttrs = workAttrs;
    for (const attr of toStrip) {
      const esc = attr.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      newAttrs = newAttrs.replace(new RegExp(`\\s*(?<!:)${esc}="[^"]*"`, 'gi'), '');
      newAttrs = newAttrs.replace(new RegExp(`\\s*(?<!:)${esc}='[^']*'`, 'gi'), '');
    }
    newAttrs = newAttrs.trim();
    if (newAttrs) newAttrs = ' ' + newAttrs;
    return `<${tagName}${newAttrs}>`;
  });
}

// Drop :src / x-bind:src when img already has a baked src= (x-for / iterator expressions break hydrate).
function stripRedundantImgSrcBindings(html) {
  return html.replace(/<img\b([^>]*)>/gi, (full, attrs) => {
    if (isHydrateMarkedAttrs(attrs)) return full;
    const srcM = attrs.match(/\ssrc=(["'])([\s\S]*?)\1/i);
    if (!srcM || !String(srcM[2] || '').trim()) return full;
    if (!/\s:src\s*=|\sx-bind:src\s*=/i.test(attrs)) return full;
    let next = attrs.replace(/\s:src=(?:"[^"]*"|'[^']*')/gi, '');
    next = next.replace(/\sx-bind:src=(?:"[^"]*"|'[^']*')/gi, '');
    return `<img${next}>`;
  });
}

/**
 * Manifest runtime replaces <x-*> component placeholders by fetching source .html, which wipes
 * prerender-baked markup (stripped :style, expanded lists, etc.). Tag opens with data-pre-rendered
 * are skipped by manifest.components.processor — required for static prerender output to hydrate correctly.
 */
// Prerender inlined Iconify SVG under <i x-icon="iterator.icon">; clear x-icon value so Alpine does not evaluate
// loop/item expressions while the attribute remains for CSS (e.g. inline layout that keys off [x-icon]).
function stripResolvedXIconDirectives(html) {
  return html.replace(/<i\b([^>]*)>([\s\S]*?)<\/i>/gi, (full, attrs, inner) => {
    if (isHydrateMarkedAttrs(attrs)) return full;
    if (!/\sx-icon\s*=/i.test(attrs)) return full;
    if (!/<svg\b/i.test(inner) || !/\bdata-icon\s*=/i.test(inner)) return full;
    const cleaned = attrs
      .replace(/\s+x-icon\s*=\s*"[^"]*"/gi, ' x-icon=""')
      .replace(/\s+x-icon\s*=\s*'[^']*'/gi, ' x-icon=""')
      .trim();
    const sp = cleaned ? ' ' : '';
    return `<i${sp}${cleaned}>${inner}</i>`;
  });
}

function stripPrerenderHydrateMarkers(html) {
  return html.replace(/\sdata-prerender-hydrate(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
}

// Remove the snapshot id attribute used by the hydrate restore phase.  These ids
// only exist to let the post-Alpine restore step in Puppeteer find each snapshotted
// element back; they have no purpose in the final output.
function stripPrerenderHydrateSnapshotIds(html) {
  return html.replace(/\sdata-manifest-hyd-id(?:=(?:"[^"]*"|'[^']*'|[^\s>]+))?/gi, '');
}

function markPrerenderedManifestComponents(html) {
  return html.replace(/<(x-[a-z][\w-]*)([^>]*)>/gi, (full, tag, attrs) => {
    const a = attrs || '';
    if (/\bdata-pre-rendered\s*=/i.test(a) || /\bdata-processed\s*=/i.test(a)) return full;
    if (/\bdata-prerender-hydrate\b/i.test(a)) return full; // Inside data-hydrate island — skip
    const spacer = /\S/.test(a) ? ' ' : '';
    return `<${tag}${a}${spacer}data-pre-rendered="1">`;
  });
}

// Remove empty inline mask-image styles emitted before data resolves
// (e.g. style="mask-image: url()"), while keeping any :style/x-bind:style bindings.
function stripEmptyInlineMaskStyles(html) {
  return html.replace(/<(\w+)([^>]*)>/g, (full, tag, attrs) => {
    const styleMatch = attrs.match(/\sstyle=(["'])([\s\S]*?)\1/i);
    if (!styleMatch) return full;
    const quote = styleMatch[1];
    const rawStyle = styleMatch[2] || '';
    const cleaned = rawStyle
      .replace(/\bmask-image\s*:\s*url\(\s*(?:''|""|)\s*\)\s*;?/gi, '')
      .replace(/\b-webkit-mask-image\s*:\s*url\(\s*(?:''|""|)\s*\)\s*;?/gi, '')
      .trim()
      .replace(/^\s*;\s*|\s*;\s*$/g, '');

    if (!cleaned) {
      const newAttrs = attrs.replace(/\sstyle=(["'])[\s\S]*?\1/i, '');
      return `<${tag}${newAttrs}>`;
    }
    const rebuilt = attrs.replace(/\sstyle=(["'])[\s\S]*?\1/i, ` style=${quote}${cleaned}${quote}`);
    return `<${tag}${rebuilt}>`;
  });
}

// --- Rewrite asset URLs: depth = segments from this HTML file up to output root (website). ----
// All project assets are copied into output, so root-relative paths become relative within output.
// Do NOT rewrite href on <a> tags (navigation links); only rewrite link/script/img so router gets clean paths.

function isPrerenderBundleAssetPath(pathAfterSlash) {
  return /(^|\/)prerender\.(tailwind|utilities)\.css$/.test(pathAfterSlash);
}

function rewriteHtmlAssetPaths(html, depthWithinOutput) {
  const prefix = depthWithinOutput > 0 ? '../'.repeat(depthWithinOutput) : '';
  if (!prefix) return html;
  function isAnchorTag(htmlBeforeMatch) {
    const lastOpen = htmlBeforeMatch.lastIndexOf('<');
    if (lastOpen === -1) return false;
    const tag = htmlBeforeMatch.slice(lastOpen + 1).match(/^(\w+)/);
    return tag && tag[1].toLowerCase() === 'a';
  }
  let out = html.replace(/(\s(href|src)=["'])\/(?!\/)([^'"]*)/g, (match, lead, _attr, rest, offset, fullString) => {
    if (isAnchorTag(fullString.slice(0, offset))) return match;
    if (isPrerenderBundleAssetPath(rest)) return match;
    return lead + prefix + rest;
  });
  out = out.replace(/(\s(href|src)=["'])(\.\.\/)+/g, (match, lead, attr, dots, offset, fullString) => {
    if (isAnchorTag(fullString.slice(0, offset))) return match;
    return lead + prefix;
  });
  return out;
}

// Alpine x-data drives radio state; baked checked="" from the live DOM (e.g. yearly) fights monthly defaults.
function stripPrerenderBakedRadioCheckedForXModel(html) {
  return html.replace(/<input\b([^>]*)>/gi, (full, attrs) => {
    if (!/\btype\s*=\s*["']radio["']/i.test(attrs)) return full;
    if (!/\bx-model\s*=/i.test(attrs)) return full;
    const next = attrs.replace(/\s+checked(?:\s*=\s*["'][^"']*["']|\s*=\s*[^\s>]+)?/gi, '');
    if (next === attrs) return full;
    return `<input${next}>`;
  });
}

// --- Canonical and hreflang (per-page injection) ---

function buildCanonicalAndHreflang(pathSeg, locales, defaultLocale, base) {
  const baseClean = base.replace(/\/$/, '');
  const defaultLoc = defaultLocale || locales[0];
  const isDefaultLocalePrefixed =
    defaultLoc && (pathSeg === defaultLoc || pathSeg.startsWith(defaultLoc + '/'));
  const canonicalPath =
    isDefaultLocalePrefixed
      ? pathSeg === defaultLoc
        ? ''
        : pathSeg.slice(defaultLoc.length + 1)
      : pathSeg;
  const canonicalHref = canonicalPath === '' ? `${baseClean}/` : `${baseClean}/${canonicalPath}`;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  let out = `<link rel="canonical" href="${esc(canonicalHref)}">\n`;
  if (locales.length > 1) {
    const currentLocale = locales.find((l) => pathSeg === l || pathSeg.startsWith(l + '/')) || defaultLoc;
    const logicalRoute =
      currentLocale === defaultLoc
        ? pathSeg === defaultLoc
          ? ''
          : pathSeg.startsWith(defaultLoc + '/')
            ? pathSeg.slice(defaultLoc.length + 1)
            : pathSeg
        : pathSeg === currentLocale
          ? ''
          : pathSeg.slice(currentLocale.length + 1);
    locales.forEach((loc) => {
      const seg = loc === defaultLoc ? logicalRoute : (logicalRoute ? `${loc}/${logicalRoute}` : loc);
      const href = baseClean + (seg ? `/${seg}` : '');
      const hreflang = loc === defaultLoc ? 'x-default' : loc;
      out += `  <link rel="alternate" hreflang="${esc(hreflang)}" href="${esc(href)}">\n`;
    });
  }
  return out;
}

/** Same alternate URLs as buildCanonicalAndHreflang; used for sitemap xhtml:link entries. */
function getAlternateLinksForPath(pathSeg, locales, defaultLocale, base) {
  const baseClean = base.replace(/\/$/, '');
  const defaultLoc = defaultLocale || locales[0];
  if (!locales || locales.length <= 1) return [];
  const currentLocale = locales.find((l) => pathSeg === l || pathSeg.startsWith(l + '/')) || defaultLoc;
  const logicalRoute =
    currentLocale === defaultLoc
      ? pathSeg === defaultLoc
        ? ''
        : pathSeg.startsWith(defaultLoc + '/')
          ? pathSeg.slice(defaultLoc.length + 1)
          : pathSeg
      : pathSeg === currentLocale
        ? ''
        : pathSeg.slice(currentLocale.length + 1);
  const entries = [];
  locales.forEach((loc) => {
    const seg = loc === defaultLoc ? logicalRoute : (logicalRoute ? `${loc}/${logicalRoute}` : loc);
    const href = baseClean + (seg ? `/${seg}` : '');
    const hreflang = loc === defaultLoc ? 'x-default' : loc;
    entries.push({ hreflang, href });
  });
  return entries;
}

function escapeXmlText(s) {
  return String(s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildOgLocale(pathSeg, locales, defaultLocale) {
  if (locales.length <= 1) return '';
  const defaultLoc = defaultLocale || locales[0];
  const currentLocale = locales.find((l) => pathSeg === l || pathSeg.startsWith(l + '/')) || defaultLoc;
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;');
  const toOgLocale = (loc) => (loc.indexOf('-') !== -1 ? loc.replace(/-/g, '_').toLowerCase() : loc.toLowerCase());
  let out = `<meta property="og:locale" content="${esc(toOgLocale(currentLocale))}">\n`;
  locales.forEach((loc) => {
    if (loc !== currentLocale) out += `  <meta property="og:locale:alternate" content="${esc(toOgLocale(loc))}">\n`;
  });
  return out;
}

function stripOgLocaleFromHead(html) {
  return html.replace(/\s*<meta[^>]*property="og:locale(?::alternate)?"[^>]*>\s*/gi, '');
}

function hasOtherOgMeta(html) {
  return /<meta[^>]*property="og:(?!locale(?::alternate)?")[^"]*"[^>]*>/i.test(html);
}

// --- Locale text substitution (Node.js post-processing — no Puppeteer for locale variants) ------

/**
 * Load the key→value content data for every locale from every CSV that has locale columns.
 * Returns Map<locale, { key: value }>.
 */
function loadAllLocaleContentData(manifest, rootDir, locales) {
  const data = manifest?.data;
  if (!data || typeof data !== 'object') return new Map();

  // Lazy-load js-yaml for parsing per-locale YAML files
  let jsYaml = null;
  try { jsYaml = require('js-yaml'); } catch { /* yaml not available; YAML locale files will be skipped */ }

  // Deep-merge source into target (for combining multiple data sources per locale)
  function deepMerge(target, source) {
    if (!source || typeof source !== 'object' || Array.isArray(source)) return;
    for (const key of Object.keys(source)) {
      if (source[key] && typeof source[key] === 'object' && !Array.isArray(source[key])) {
        target[key] = (target[key] && typeof target[key] === 'object') ? target[key] : {};
        deepMerge(target[key], source[key]);
      } else {
        // Don't overwrite an existing nested object with a primitive — that creates
        // type asymmetry across locales and causes '[object Object]' in substitution pairs
        if (target[key] && typeof target[key] === 'object') continue;
        target[key] = source[key];
      }
    }
  }

  const result = new Map();
  for (const locale of locales) result.set(locale, {});

  // Read just the header row of a CSV to check which locale columns it contains.
  function csvLocaleColumns(csvPath) {
    if (!existsSync(csvPath)) return new Set();
    try {
      const firstLine = readFileSync(csvPath, 'utf8').split(/\r?\n/)[0] || '';
      return new Set(splitCsvLine(firstLine).slice(1)); // skip key column
    } catch { return new Set(); }
  }

  for (const [, value] of Object.entries(data)) {
    if (typeof value === 'string') {
      // Single CSV with locale columns (all locales in one file)
      if (value.endsWith('.csv')) {
        const csvPath = join(rootDir, value.startsWith('/') ? value.slice(1) : value);
        const cols = csvLocaleColumns(csvPath);
        for (const locale of locales) {
          // Only include locales the CSV actually declares; falling back to the English
          // column for a missing locale silently poisons substitution pairs with English values.
          if (!cols.has(locale)) continue;
          deepMerge(result.get(locale), parseCsvToKeyValue(csvPath, locale));
        }
      }
    } else if (value && typeof value === 'object' && !Array.isArray(value)) {
      if (value.locales) {
        // { locales: "/path/to/multi-locale.csv" } format
        const refs = Array.isArray(value.locales) ? value.locales : [value.locales];
        for (const ref of refs) {
          if (typeof ref !== 'string' || !ref.endsWith('.csv')) continue;
          const csvPath = join(rootDir, ref.startsWith('/') ? ref.slice(1) : ref);
          const cols = csvLocaleColumns(csvPath);
          for (const locale of locales) {
            if (!cols.has(locale)) continue;
            deepMerge(result.get(locale), parseCsvToKeyValue(csvPath, locale));
          }
        }
      } else {
        // Per-locale files: { "en": "/data/content.en.yaml", "fr": "/data/content.fr.yaml", ... }
        for (const [localeKey, filePath] of Object.entries(value)) {
          if (!locales.includes(localeKey) || typeof filePath !== 'string') continue;
          const fullPath = join(rootDir, filePath.startsWith('/') ? filePath.slice(1) : filePath);
          if (!existsSync(fullPath)) continue;
          let localeData = null;
          try {
            const raw = readFileSync(fullPath, 'utf8');
            if ((filePath.endsWith('.yaml') || filePath.endsWith('.yml')) && jsYaml) {
              localeData = jsYaml.load(raw);
            } else if (filePath.endsWith('.json')) {
              localeData = JSON.parse(raw);
            } else if (filePath.endsWith('.csv')) {
              localeData = parseCsvToKeyValue(fullPath, localeKey);
            }
          } catch { /* ignore parse errors for individual locale files */ }
          if (localeData && typeof localeData === 'object') {
            deepMerge(result.get(localeKey), localeData);
          }
        }
      }
    }
  }

  return result;
}

/**
 * Build [[defaultValue, targetValue], ...] replacement pairs sorted longest-first.
 * Skips empty strings and identical pairs to reduce noise.
 */
function buildSubstitutionPairs(defaultLocaleData, targetLocaleData) {
  const pairs = [];
  function collectPairs(defaultObj, targetObj) {
    if (!defaultObj || !targetObj) return;
    for (const key of Object.keys(defaultObj)) {
      const defaultVal = defaultObj[key];
      const targetVal = targetObj[key];
      if (defaultVal && typeof defaultVal === 'object') {
        // Recurse into nested objects (produced by setNestedKey for dotted CSV keys)
        collectPairs(defaultVal, targetVal && typeof targetVal === 'object' ? targetVal : {});
      } else {
        // Skip if target is a non-primitive — String(obj) === '[object Object]' is never useful
        if (targetVal !== null && typeof targetVal === 'object') continue;
        const from = String(defaultVal ?? '').trim();
        const to = String(targetVal ?? '').trim();
        if (!from || from === to) continue;
        pairs.push([from, to]);
      }
    }
  }
  collectPairs(defaultLocaleData, targetLocaleData);
  // Sort longest-first so more specific strings are replaced before shorter substrings
  pairs.sort((a, b) => b[0].length - a[0].length);
  return pairs;
}

/**
 * Apply locale text substitution to rendered HTML.
 * Replaces content in text nodes (between > and <) and in key attributes:
 * content, alt, title, placeholder, aria-label.
 */
function applyLocaleSubstitution(html, pairs) {
  if (!pairs || !pairs.length) return html;

  // 1. Text nodes: walk content between '>' and '<'
  let out = '';
  let pos = 0;
  while (pos < html.length) {
    const gtPos = html.indexOf('>', pos);
    if (gtPos === -1) { out += html.slice(pos); break; }
    const ltPos = html.indexOf('<', gtPos + 1);
    if (ltPos === -1) { out += html.slice(pos); break; }
    out += html.slice(pos, gtPos + 1);
    let text = html.slice(gtPos + 1, ltPos);
    if (text.trim()) {
      for (const [from, to] of pairs) {
        if (text.includes(from)) text = text.split(from).join(to);
      }
    }
    out += text;
    pos = ltPos;
  }

  // 2. Selected attributes that carry visible text
  out = out.replace(
    /(\s(?:content|alt|title|placeholder|aria-label)=["'])([^"']*)(['"])/g,
    (match, prefix, val, suffix) => {
      let v = val;
      for (const [from, to] of pairs) {
        if (v.includes(from)) v = v.split(from).join(to);
      }
      return `${prefix}${v}${suffix}`;
    }
  );

  return out;
}

/**
 * Generate a locale variant's HTML entirely in Node.js from a cached base-path DOM snapshot.
 * Applies text substitution then the full Node.js post-processing pipeline.
 * Returns { html, utilityBlocks }.
 */
function generateLocaleVariantHtml({
  rawHtml, pathSeg, targetLocale, locales, defaultLocale,
  config, manifest, routerBasePath, tailwindBuilt, bundleUtilities,
  substitutionPairs,
}) {
  let html = rawHtml;

  // Update lang attribute before resolveHeadXBindings so it sees the right locale
  html = html.replace(/(<html\b[^>]*)\s+lang=["'][^"']*["']/i, `$1 lang="${targetLocale}"`);
  if (!/<html\b[^>]*\slang=/i.test(html)) {
    html = html.replace(/(<html\b)/i, `$1 lang="${targetLocale}"`);
  }

  // Apply locale text substitution
  html = applyLocaleSubstitution(html, substitutionPairs);

  // Standard Node.js post-processing (same sequence as processPath)
  html = stripDevOnlyContent(html);
  html = stripInjectedPluginScripts(html);
  if (tailwindBuilt) html = stripRuntimeTailwindArtifacts(html);

  const pageUtilityBlocks = [];
  if (bundleUtilities) {
    const extracted = extractUtilityStyleBlocks(html);
    html = extracted.html;
    for (const b of extracted.blocks) pageUtilityBlocks.push(b);
  }

  if (tailwindBuilt) {
    html = injectBeforeHeadClose(
      html,
      `<link rel="stylesheet" href="${buildRootAssetPath(routerBasePath, 'prerender.tailwind.css')}">`
    );
  }

  html = stripDuplicatedLoopDirectives(html);
  html = stripPrerenderedXDataDirectives(html);

  const content = loadContentForPrerender(manifest, config.root, targetLocale);
  html = resolveHeadXBindings(html, { manifest, content });

  html = stripPrerenderDynamicBindings(html);
  html = stripPrerenderBakedRadioCheckedForXModel(html);
  html = stripRedundantImgSrcBindings(html);
  html = stripEmptyInlineMaskStyles(html);
  html = stripResolvedXIconDirectives(html);
  // markPrerenderedManifestComponents must run BEFORE stripPrerenderHydrateMarkers so it can
  // detect data-prerender-hydrate markers and skip components inside hydrate islands.
  html = markPrerenderedManifestComponents(html);
  html = stripPrerenderHydrateMarkers(html);
  html = stripPrerenderHydrateSnapshotIds(html);

  const fileSegments = pathToFileSegments(pathSeg ? '/' + pathSeg : '/');
  html = rewriteHtmlAssetPaths(html, fileSegments.length);

  const liveBase = config.liveUrl.replace(/\/$/, '');
  const canonicalHreflang = buildCanonicalAndHreflang(pathSeg, locales, defaultLocale, liveBase);
  const ogLocale = buildOgLocale(pathSeg, locales, defaultLocale);
  const injectOgLocale = ogLocale && hasOtherOgMeta(html);
  if (injectOgLocale) html = stripOgLocaleFromHead(html);

  const routeEx = config.localeRouteExclude || [];
  const routeMeta = routeEx.length > 0
    ? `<meta name="manifest:locale-route-exclude" content="${JSON.stringify(routeEx).replace(/"/g, '&quot;')}">\n`
    : '';
  const baseMeta = routerBasePath !== null
    ? `<meta name="manifest:router-base" content="${String(routerBasePath).replace(/"/g, '&quot;')}">\n`
    : '';
  const routeDepth = fileSegments.length;

  html = html.replace(
    '</head>',
    `${canonicalHreflang}${injectOgLocale ? ogLocale : ''}${routeMeta}${baseMeta}<meta name="manifest:prerendered" content="1">\n<meta name="manifest:router-base-depth" content="${routeDepth}">\n</head>`
  );

  return { html, utilityBlocks: pageUtilityBlocks };
}

// --- Resolve $x bindings in <head> (data-head meta/link are injected with :attr="$x.path" but never evaluated) ---

function loadContentForPrerender(manifest, rootDir, locale) {
  const data = manifest?.data?.content;
  if (!data) return {};
  const loc = locale || 'en';
  let content = {};
  if (typeof data === 'string' && data.endsWith('.csv')) {
    content = parseCsvToKeyValue(join(rootDir, data.slice(1)), loc);
  } else if (data && typeof data === 'object' && data.locales && typeof data.locales === 'string') {
    content = parseCsvToKeyValue(join(rootDir, data.locales.slice(1)), loc);
  }
  if (manifest.description !== undefined && content.description === undefined) {
    content.description = manifest.description;
  }
  return content;
}

function parseCsvToKeyValue(filePath, valueLocale) {
  if (!existsSync(filePath)) return {};
  const text = readFileSync(filePath, 'utf8');
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return {};
  const header = splitCsvLine(lines[0]);
  const keyCol = header[0];
  const valueCol = header.includes(valueLocale) ? valueLocale : (header[1] || header[0]);
  const keyIdx = 0;
  const valueIdx = header.indexOf(valueCol);
  if (valueIdx === -1) return {};
  const result = {};
  for (let i = 1; i < lines.length; i++) {
    const row = splitCsvLine(lines[i]);
    const key = row[keyIdx];
    const value = row[valueIdx];
    if (key == null) continue;
    setNestedKey(result, key.trim(), value != null ? String(value).trim() : '');
  }
  return result;
}

function setNestedKey(obj, path, value) {
  const parts = path.split('.');
  let cur = obj;
  for (let i = 0; i < parts.length - 1; i++) {
    const p = parts[i];
    const next = parts[i + 1];
    const nextIsIndex = /^\d+$/.test(next);
    if (!(p in cur) || typeof cur[p] !== 'object') {
      cur[p] = nextIsIndex ? [] : {};
    } else if (nextIsIndex && !Array.isArray(cur[p]) && cur[p] && typeof cur[p] === 'object') {
      const existing = cur[p];
      const keys = Object.keys(existing);
      const numericOnly = keys.every((k) => /^\d+$/.test(k));
      if (numericOnly) {
        const arr = [];
        keys.forEach((k) => {
          arr[parseInt(k, 10)] = existing[k];
        });
        cur[p] = arr;
      }
    }
    cur = cur[p];
  }
  cur[parts[parts.length - 1]] = value;
}

function getXPath(obj, path) {
  const parts = path.replace(/^\.+/, '').split('.');
  let cur = obj;
  for (const p of parts) {
    if (cur == null || typeof cur !== 'object') return undefined;
    cur = cur[p];
  }
  return cur;
}

function resolveHeadXBindings(html, xData) {
  const esc = (s) => String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
  return html.replace(/<head>([\s\S]*?)<\/head>/i, (_, headContent) => {
    let out = headContent.replace(
      /(\s)(?::|x-bind:)(\w+)=["'](\$x\.[^"']+)["']/g,
      (_, space, attr, expr) => {
        const path = expr.replace(/^\$x\./, '').trim();
        const value = getXPath(xData, path);
        if (value === undefined) return _;
        return `${space}${attr}="${esc(value)}"`;
      }
    );
    return `<head>${out}</head>`;
  });
}

// --- SEO: robots.txt and sitemap.xml (written to output, use liveUrl for crawlers) ---

function writeSeoFiles(outputDir, pathList, liveUrl, locales, defaultLocale) {
  const base = liveUrl.replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const localeList = Array.isArray(locales) ? locales : [];
  const multiLocale = localeList.length > 1;

  writeFileSync(
    join(outputDir, 'robots.txt'),
    `User-agent: *
Disallow:

Sitemap: ${base}/sitemap.xml
`,
    'utf8'
  );

  const urlsetNs = multiLocale
    ? '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">'
    : '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">';

  const urlEntries = pathList.map((pathSeg) => {
    const path = pathSeg === '' ? '' : '/' + pathSeg.replace(/\/$/, '');
    const loc = path ? `${base}${path}` : base + '/';
    const escapedLoc = escapeXmlText(loc);
    let body = `        <loc>${escapedLoc}</loc>`;
    if (multiLocale) {
      for (const { hreflang, href } of getAlternateLinksForPath(pathSeg, localeList, defaultLocale, liveUrl)) {
        body += `\n        <xhtml:link rel="alternate" hreflang="${escapeXmlText(hreflang)}" href="${escapeXmlText(href)}" />`;
      }
    }
    body += `\n        <lastmod>${today}</lastmod>
        <changefreq>monthly</changefreq>
        <priority>${path === '' ? '1.0' : '0.8'}</priority>`;
    return `    <url>
${body}
    </url>`;
  });

  writeFileSync(
    join(outputDir, 'sitemap.xml'),
    `<?xml version="1.0" encoding="UTF-8"?>
${urlsetNs}
${urlEntries.join('\n')}
</urlset>
`,
    'utf8'
  );
}

// --- Static server for --serve ------------------------------------------------

const MIME = {
  '.html': 'text/html',
  '.css': 'text/css',
  '.js': 'application/javascript',
  '.json': 'application/json',
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
  '.woff': 'font/woff',
};

function startStaticServer(rootDir) {
  const rootResolved = resolve(rootDir);
  const server = createServer((req, res) => {
    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405);
      res.end();
      return;
    }
    const pathname = (req.url || '/').replace(/\?.*$/, '') || '/';
    const segments = pathname.split('/').filter(Boolean);
    const safeSegments = segments.filter((s) => s !== '..' && s !== '');
    const filePath = join(rootResolved, ...safeSegments);
    let resolvedPath;
    try {
      resolvedPath = resolve(filePath);
      if (!resolvedPath.startsWith(rootResolved)) {
        res.writeHead(403);
        res.end();
        return;
      }
    } catch {
      sendIndex();
      return;
    }
    function sendIndex() {
      const indexFile = join(rootResolved, 'index.html');
      if (!existsSync(indexFile)) {
        res.writeHead(404);
        res.end();
        return;
      }
      const html = readFileSync(indexFile, 'utf8');
      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(html);
    }
    if (!existsSync(resolvedPath)) {
      sendIndex();
      return;
    }
    const stat = statSync(resolvedPath);
    if (stat.isDirectory()) {
      const indexInDir = join(resolvedPath, 'index.html');
      if (existsSync(indexInDir)) {
        const html = readFileSync(indexInDir, 'utf8');
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(html);
        return;
      }
      sendIndex();
      return;
    }
    const ext = (resolvedPath.match(/\.[^.]+$/) || [])[0] || '';
    const contentType = MIME[ext] || 'application/octet-stream';
    const body = readFileSync(resolvedPath);
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(body);
  });
  return new Promise((resolvePromise, reject) => {
    server.listen(0, '127.0.0.1', () => {
      const port = server.address().port;
      resolvePromise({ server, url: `http://127.0.0.1:${port}` });
    });
    server.on('error', reject);
  });
}

// --- Copy project into output so website is self-contained (e.g. for Appwrite). ---
const COPY_EXCLUDE = new Set([
  'node_modules', '.git', 'package.json', 'package-lock.json',
  'index.html', 'prerender.mjs', 'prerender.js', '_redirects',
]);

function copyProjectIntoDist(rootResolved, outputResolved) {
  const outputDirName = basename(outputResolved);
  COPY_EXCLUDE.add(outputDirName);
  const entries = readdirSync(rootResolved, { withFileTypes: true });
  for (const ent of entries) {
    const name = ent.name;
    if (COPY_EXCLUDE.has(name) || name.startsWith('.')) continue;
    const src = join(rootResolved, name);
    const dest = join(outputResolved, name);
    cpSync(src, dest, { recursive: true });
  }
  COPY_EXCLUDE.delete(outputDirName);
}

// --- Main --------------------------------------------------------------------

async function main() {
  const config = resolveConfig();
  const startedAt = Date.now();
  let staticServer = null;
  if (config.serve) {
    const { server, url } = await startStaticServer(config.root);
    staticServer = server;
    config.localUrl = url;
  }
  try {
    await runPrerender(config);
  } finally {
    if (staticServer) {
      await new Promise((res) => staticServer.close(res));
    }
  }
  const elapsedMs = Date.now() - startedAt;
  const totalSeconds = Math.floor(elapsedMs / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  process.stdout.write(`prerender: total time ${hours}h ${minutes}m ${seconds}s\n`);
}

async function runPrerender(config) {
  const manifest = loadConfig(config.root);
  const localesConfig = config.locales;

  let locales = [];
  if (localesConfig !== false) {
    const discovered = discoverLocales(manifest, config.root);
    if (Array.isArray(localesConfig) && localesConfig.length > 0) {
      locales = localesConfig.filter((c) => discovered.includes(c));
    } else {
      locales = discovered;
    }
  }

  const defaultLocale = locales[0] ?? null;
  const routeSegments = discoverRoutes(manifest, config.root);
  // Merge any explicitly configured paths (manifest.prerender.paths) into the discovered segments.
  // These are treated as locale-neutral and get full locale-expansion like all other discovered paths.
  if (config.paths && config.paths.length > 0) {
    const segSet = new Set(routeSegments);
    for (const p of config.paths) {
      if (!segSet.has(p)) { routeSegments.push(p); segSet.add(p); }
    }
  }
  const localeSet = new Set(locales.map((l) => String(l).toLowerCase()));
  const localeNeutralSegments = routeSegments.filter((seg) => {
    if (!seg) return true;
    const first = seg.split('/')[0].toLowerCase();
    return !localeSet.has(first);
  });
  const paths = new Set();
  paths.add('');

  for (const seg of routeSegments) {
    paths.add(seg);
  }
  for (const locale of locales.slice(1)) {
    paths.add(locale);
    for (const seg of localeNeutralSegments) {
      if (!seg) continue;
      paths.add(`${locale}/${seg}`);
    }
  }
  // Default locale also under its slug (e.g. /en/, /en/page-1) so linking is symmetric; canonical points to root
  if (defaultLocale) {
    paths.add(defaultLocale);
    for (const seg of localeNeutralSegments) {
      if (seg !== '') paths.add(`${defaultLocale}/${seg}`);
    }
  }

  const NOT_FOUND_PATH = '__prerender_404__'; // URL path that matches no route so router shows x-route="!*" (404)
  const pathList = [...paths, NOT_FOUND_PATH];
  if (config.dryRun) {
    return;
  }

  const outputResolved = resolve(config.output);
  const rootResolved = resolve(config.root);
  // Router base = URL pathname to the app root. When dist is deployed as site root (e.g. Appwrite), use "".
  // Set manifest.prerender.routerBase only when the app is served from a subpath (e.g. /app).
  let routerBasePath = null;
  if (config.routerBase != null && String(config.routerBase).trim() !== '') {
    const trimmed = String(config.routerBase).replace(/^\/+|\/+$/g, '').trim();
    routerBasePath = trimmed ? '/' + trimmed : '';
  } else {
    routerBasePath = '';
  }

  if (existsSync(outputResolved)) {
    rmSync(outputResolved, { recursive: true });
  }
  mkdirSync(outputResolved, { recursive: true });
  copyProjectIntoDist(rootResolved, outputResolved);

  const pre = manifest.prerender ?? {};
  const bundleUtilities = pre.utilitiesBundle !== false;
  const tailwindBuilt = runTailwindCliForPrerender(rootResolved, outputResolved, pre);
  const utilityBlocks = [];

  let browser;
  try {
    const chromium = await importFromProject('@sparticuz/chromium');
    const pptr = await importFromProject('puppeteer-core');
    const executablePath = await chromium.default.executablePath();
    browser = await pptr.default.launch({
      args: chromium.default.args,
      defaultViewport: chromium.default.defaultViewport ?? null,
      executablePath,
      headless: chromium.default.headless ?? true,
      ignoreHTTPSErrors: true,
    });
  } catch (serverlessErr) {
    let puppeteer;
    try {
      puppeteer = await importFromProject('puppeteer');
    } catch {
      console.error('prerender: missing browser runtime.');
      console.error('Install one of the following, then rerun:');
      console.error('  npm i -D puppeteer');
      console.error('  npm i -D puppeteer-core @sparticuz/chromium');
      process.exit(1);
    }
    browser = await puppeteer.default.launch({ headless: true });
  }

  const timeout = config.wait ?? 15000;
  const concurrency = config.concurrency;
  const pathTotal = pathList.length;
  const failedPaths = [];
  const debugRows = [];

  // --- Two-phase rendering: Puppeteer for base paths, Node.js substitution for locale variants ---
  // Categorise paths: locale-prefixed paths (en/about, fr/about, ...) are "locale variants"
  // and can be generated from the corresponding base path's DOM snapshot + text substitution.
  // This eliminates Puppeteer for every locale × route combination beyond the base routes.
  const localeSubstEnabled = config.localeSubstitution;
  const localeSubstExclude = new Set(config.localeSubstitutionExclude || []);
  const puppeteerPaths = [];
  const localeVariantPaths = []; // { pathSeg, basePathSeg, targetLocale }

  // Two-pass categorisation: locale substitution only applies when the locale-neutral base path
  // (e.g. 'about' for 'fr/about') is itself in the path list and will be Puppeteer-rendered.
  //
  // Paths whose data is inherently locale-specific (e.g. 'en/articles/slug', 'fr/articles/slug'
  // discovered from per-locale data sources) have no locale-neutral counterpart and must be
  // rendered by Puppeteer directly — their content differs per locale and substitution cannot
  // produce correct output. This mirrors the framework's own data model: locale-neutral paths
  // use a shared structure with CSV text overlay; locale-prefixed paths carry per-locale content.

  // Pass 1: collect all locale-neutral path segments (no locale prefix in the first segment).
  const localeNeutralPathSet = new Set();
  for (const seg of pathList) {
    if (!seg || seg === NOT_FOUND_PATH) continue;
    if (!localeSet.has(seg.split('/')[0])) localeNeutralPathSet.add(seg);
  }

  // Pass 2: categorise.
  for (const seg of pathList) {
    if (!localeSubstEnabled || seg === NOT_FOUND_PATH || !seg) {
      puppeteerPaths.push(seg);
      continue;
    }
    const fp = seg.split('/')[0];
    if (!localeSet.has(fp) || localeSubstExclude.has(fp)) {
      puppeteerPaths.push(seg);
      continue;
    }
    const basePathSeg = seg.slice(fp.length + 1) || '';
    if (localeNeutralPathSet.has(basePathSeg)) {
      // Locale-neutral base exists and will be Puppeteer-rendered → safe to substitute.
      localeVariantPaths.push({ pathSeg: seg, basePathSeg, targetLocale: fp });
    } else {
      // No locale-neutral base — this path has per-locale content; Puppeteer required.
      puppeteerPaths.push(seg);
    }
  }

  // Preload locale data for text substitution (all CSV sources with locale columns)
  const allLocaleData = loadAllLocaleContentData(manifest, config.root, locales);
  const substitutionMaps = new Map(); // locale → [[from, to], ...]
  for (const locale of locales) {
    if (locale === defaultLocale) {
      substitutionMaps.set(locale, []); // default locale: no text substitution needed
    } else {
      substitutionMaps.set(locale, buildSubstitutionPairs(
        allLocaleData.get(defaultLocale) || {},
        allLocaleData.get(locale) || {}
      ));
    }
  }

  // baseHtmlCache: base path segment → raw DOM HTML captured before any Node.js transforms
  const baseHtmlCache = new Map();
  const puppeteerTotal = puppeteerPaths.length;

  process.stdout.write(`Prerendering ${pathTotal} path(s) (${puppeteerTotal} via Puppeteer, ${localeVariantPaths.length} via substitution)...\n`);

  function pushDebug(row) {
    if (!config.debugPrerender) return;
    debugRows.push(row);
  }

  async function processPath(pathSeg, pathIndex, { onRawHtml } = {}) {
    const is404 = pathSeg === NOT_FOUND_PATH;
    const pathname = is404 ? `/${NOT_FOUND_PATH}` : (pathSeg ? `/${pathSeg}` : '/');
    const displayPath = pathSeg === '' ? '/' : pathname;
    process.stdout.write(`  [ ${pathIndex + 1}/${puppeteerTotal} ] ${displayPath}\n`);
    const url = `${config.localUrl}${pathname}`;
    const fileSegments = is404 ? [] : pathToFileSegments(pathSeg ? `/${pathSeg}` : '/');
    const outDir = is404 ? config.output : join(config.output, ...fileSegments);
    const outFile = is404 ? join(config.output, '404.html') : join(outDir, 'index.html');
    const currentLocale =
      pathSeg && locales.length > 0
        ? locales.includes(pathSeg.split('/')[0])
          ? pathSeg.split('/')[0]
          : defaultLocale || 'en'
        : defaultLocale || 'en';

    const page = await browser.newPage();
    try {
      // Align <html lang> with the URL being prerendered before any app script runs.
      // initializeDataSourcesPlugin picks locale from document.documentElement.lang first; a mismatch
      // (e.g. headless default vs /en/...) leaves $x.* empty while x-route sections still render.
      await page.evaluateOnNewDocument((locale) => {
        const apply = () => {
          try {
            if (locale && typeof locale === 'string') document.documentElement.lang = locale;
          } catch {
            /* no-op */
          }
        };
        if (typeof document !== 'undefined') {
          if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', apply, { once: true });
          }
          apply();
        }
      }, currentLocale);

      // Snapshot pristine source attributes of hydrate-target elements BEFORE Alpine
      // touches them.  We do this by wrapping `Alpine.initTree` — Alpine calls this
      // for the initial tree walk AND every time the components plugin lazy-loads a
      // new <x-*> component.  Right before Alpine processes a subtree, we walk it
      // and snapshot every hydrate target inside.  This is the exact moment the
      // user's source HTML is sitting in the DOM with no Alpine mutations applied.
      //
      // The snapshots are restored in a later page.evaluate call after Alpine
      // settles.  This is true hydration: Alpine never gets to bake state into
      // hydrate elements, so every directive (`:class`, `:style`, `x-text`, custom
      // plugin directives, etc.) works in the prerendered MPA exactly the way it
      // does in the live SPA — no per-binding strip logic, no cloak band-aids, no
      // edge cases to chase.
      await page.evaluateOnNewDocument(() => {
        const allSnapshots = [];
        let nextId = 0;
        const skipTags = new Set(['MAIN', 'BODY', 'HTML']);

        const snapshotElement = (el) => {
          if (!el || el.nodeType !== 1) return;
          if (el.hasAttribute('data-manifest-hyd-id')) return; // already snapshotted
          const id = '__manifest-hyd-' + nextId++;
          el.setAttribute('data-manifest-hyd-id', id);
          const attrs = {};
          for (let i = 0; i < el.attributes.length; i++) {
            const a = el.attributes[i];
            if (a.name === 'data-manifest-hyd-id') continue;
            attrs[a.name] = a.value;
          }
          allSnapshots.push({ id, attrs });
        };

        const snapshotElementAndDescendants = (el) => {
          snapshotElement(el);
          if (el && el.querySelectorAll) {
            el.querySelectorAll('*').forEach(snapshotElement);
          }
        };

        const snapshotSubtree = (root) => {
          if (!root || root.nodeType !== 1) return;

          // 1. Direct data-hydrate roots + descendants within this subtree.
          const hydrateRoots = [];
          if (root.matches && root.matches('[data-hydrate]')) hydrateRoots.push(root);
          if (root.querySelectorAll) {
            root.querySelectorAll('[data-hydrate]').forEach((el) => hydrateRoots.push(el));
          }
          hydrateRoots.forEach(snapshotElementAndDescendants);

          // 2. x-theme elements (color mode plugin needs runtime click handler).
          if (root.matches && root.matches('[x-theme]')) snapshotElementAndDescendants(root);
          if (root.querySelectorAll) {
            root.querySelectorAll('[x-theme]').forEach(snapshotElementAndDescendants);
          }

          // 3. Propagate from data-hydrate children to nearest LOCAL x-data ancestor
          //    so the reactive controller, sibling event handlers (@click toggles
          //    etc.) and all bindings inside the scope are preserved together.
          //    Skip page-level scopes (main, body, [x-route]).
          hydrateRoots.forEach((el) => {
            let ancestor = el.parentElement;
            while (ancestor && ancestor !== document.body) {
              if (
                ancestor.hasAttribute('x-data') &&
                !skipTags.has(ancestor.tagName) &&
                !ancestor.hasAttribute('x-route')
              ) {
                snapshotElementAndDescendants(ancestor);
                break;
              }
              ancestor = ancestor.parentElement;
            }
          });

          window.__manifestHydrateSnapshots = allSnapshots;
        };

        // Two complementary mechanisms — both are needed to cover every entry point
        // through which Alpine processes a tree, including preloaded components that
        // exist in the DOM before Alpine starts:
        //
        //   (a) Snapshot at `alpine:init` time.  Alpine fires this event AFTER all
        //       preloaded components are expanded and the DOM is stable, but BEFORE
        //       Alpine begins its internal tree walk.  Critically, Alpine v3's start
        //       routine uses a *private* internal initTree reference for the initial
        //       walk — wrapping the public `Alpine.initTree` does NOT intercept it.
        //       So we have to snapshot everything in document.body at this exact
        //       moment, before Alpine touches it.
        //
        //   (b) Wrap `Alpine.initTree` for lazy-loaded components.  After Alpine
        //       starts, the components plugin lazy-fetches templates for any
        //       remaining <x-*> placeholders and calls the public Alpine.initTree on
        //       each new component.  Our wrap intercepts those calls and snapshots
        //       the new subtree before Alpine processes it.
        //
        // The wrap is installed via a defineProperty setter on window.Alpine so it
        // lands the instant Alpine's CDN script does `window.Alpine = ...`.
        const wrap = (alpine) => {
          if (!alpine || alpine.__manifestRenderWrapped) return;
          if (typeof alpine.initTree !== 'function') return;
          alpine.__manifestRenderWrapped = true;
          const original = alpine.initTree.bind(alpine);
          alpine.initTree = function (root) {
            try { snapshotSubtree(root || document.body); } catch (_) { /* graceful */ }
            return original.apply(this, arguments);
          };
        };

        let _Alpine;
        try {
          Object.defineProperty(window, 'Alpine', {
            configurable: true,
            enumerable: true,
            get() { return _Alpine; },
            set(v) { _Alpine = v; wrap(v); },
          });
        } catch (_) { /* defineProperty failed, fall back to event listeners */ }

        if (typeof document !== 'undefined') {
          // (a) — snapshot the entire document right before Alpine's initial walk.
          //      `alpine:init` fires after preloaded components are in the DOM but
          //      before Alpine processes any directive.
          document.addEventListener('alpine:init', () => {
            try { snapshotSubtree(document.body); } catch (_) { /* graceful */ }
            wrap(window.Alpine); // belt and braces in case the setter trap missed
          });
          document.addEventListener('alpine:initialized', () => wrap(window.Alpine));
        }
      });

      pushDebug({ path: displayPath, stage: 'start' });
      await page.goto(url, {
        waitUntil: 'domcontentloaded',
        timeout: Math.min(timeout, 30000),
      });

      await Promise.race([
        page.evaluate(() => {
          return new Promise((resolve) => {
            const done = () => resolve();
            const t = setTimeout(done, 6000);
            window.addEventListener(
              'manifest:routing-ready',
              () => {
                clearTimeout(t);
                setTimeout(done, 2000);
              },
              { once: true }
            );
          });
        }),
        new Promise((_, rej) => setTimeout(() => rej(new Error('ready timeout')), timeout)),
      ]).catch(() => { });

      // Ensure manifest.min.js (dynamic loader) has run and injected plugin scripts before snapshot.
      // Static output still runs the loader and Alpine; we just capture the DOM after they've set up.
      await page.evaluate(() => {
        return new Promise((resolve) => {
          const check = () => document.querySelectorAll('script[src*="manifest"]').length >= 2;
          if (check()) return resolve();
          const deadline = Date.now() + 5000;
          const t = setInterval(() => {
            if (check() || Date.now() >= deadline) {
              clearInterval(t);
              resolve();
            }
          }, 50);
        });
      }).catch(() => { });

      await page.waitForNetworkIdle({ idleTime: 1500, timeout: 10000 }).catch(() => { });

      await page.evaluate(() => {
        return new Promise((resolve) => {
          const observer = new MutationObserver(() => {
            clearTimeout(stable);
            stable = setTimeout(resolve, 800);
          });
          observer.observe(document.documentElement, { childList: true, subtree: true, characterData: true });
          let stable = setTimeout(() => {
            observer.disconnect();
            resolve();
          }, 800);
        });
      }).catch(() => { });

      // Set locale, dispatch route/locale events, call component swapping, then wait for
      // manifest:render-ready — the single authoritative signal that all data sources have
      // settled for this locale/route. Falls back to timeout for older data plugins.
      await waitForManifestRenderReady(page, {
        allLocales: locales,
        currentLocale,
        timeoutMs: config.pipelineTimeout,
      });

      // Flush any remaining Alpine microtask effects after the render-ready signal.
      await flushAlpineEffects(page);

      if (config.debugPrerender) {
        const before = await page.evaluate(() => {
          const templates = Array.from(document.querySelectorAll('template[x-for]'));
          const entries = templates.slice(0, 60).map((tpl) => {
            const first = tpl.content?.firstElementChild;
            const tag = first ? first.tagName : null;
            const cls = first ? (first.getAttribute('class') || '') : '';
            let cloneCount = 0;
            let next = tpl.nextElementSibling;
            while (next && (!tag || next.tagName === tag)) {
              if (tag && (next.getAttribute('class') || '') !== cls) break;
              cloneCount++;
              next = next.nextElementSibling;
            }
            return {
              xFor: (tpl.getAttribute('x-for') || '').slice(0, 140),
              collapsed: tpl.getAttribute('data-prerender-collapsed') === '1',
              staticGenerated: tpl.getAttribute('data-prerender-static-generated') === '1',
              cloneCount,
            };
          });

          const listDiagnostics = {
            htmlLang: '',
            localeCurrent: null,
            dataLocaleChanging: null,
            dataStates: {},
            topLevelArrayLengths: {},
            nestedContentCards: null,
            emptyStaticXFors: [],
          };

          try {
            listDiagnostics.htmlLang = document.documentElement.lang || '';
            const Alpine = window.Alpine;
            if (Alpine?.store) {
              const loc = Alpine.store('locale');
              listDiagnostics.localeCurrent = loc?.current ?? null;
              const d = Alpine.store('data');
              if (d) {
                listDiagnostics.dataLocaleChanging = !!d._localeChanging;
                for (const k of Object.keys(d)) {
                  if (k.startsWith('_') && k.endsWith('_state')) {
                    const short = k.slice(1, -'_state'.length);
                    const s = d[k];
                    if (s && typeof s === 'object') {
                      listDiagnostics.dataStates[short] = {
                        loading: !!s.loading,
                        ready: !!s.ready,
                        hasError: s.error != null,
                      };
                    }
                  } else if (!k.startsWith('_') && Array.isArray(d[k])) {
                    listDiagnostics.topLevelArrayLengths[k] = d[k].length;
                  }
                }
                try {
                  const cards = d.content?.home?.differentiators?.cards;
                  if (Array.isArray(cards)) listDiagnostics.nestedContentCards = cards.length;
                  else if (cards && typeof cards === 'object') listDiagnostics.nestedContentCards = Object.keys(cards).length;
                  else listDiagnostics.nestedContentCards = cards == null ? null : 'non-iterable';
                } catch {
                  listDiagnostics.nestedContentCards = 'error';
                }
              }
            }
          } catch (e) {
            listDiagnostics.probeError = String(e?.message || e);
          }

          for (const tpl of templates) {
            if (tpl.getAttribute('data-prerender-collapsed') === '1') continue;
            const first = tpl.content?.firstElementChild;
            const tag = first ? first.tagName : null;
            const cls = first ? (first.getAttribute('class') || '') : '';
            let cloneCount = 0;
            let next = tpl.nextElementSibling;
            while (next && (!tag || next.tagName === tag)) {
              if (tag && (next.getAttribute('class') || '') !== cls) break;
              cloneCount++;
              next = next.nextElementSibling;
            }
            if (cloneCount > 0) continue;
            const routeAnc = tpl.closest('[x-route]');
            let hiddenReason = null;
            let el = tpl.parentElement;
            while (el) {
              if (el.hasAttribute('hidden')) {
                hiddenReason = 'ancestor-hidden';
                break;
              }
              const st = el.getAttribute('style') || '';
              if (/\bdisplay\s*:\s*none\b/i.test(st)) {
                hiddenReason = 'ancestor-display-none';
                break;
              }
              el = el.parentElement;
            }
            const itemsHost = tpl.closest('[items]');
            listDiagnostics.emptyStaticXFors.push({
              xFor: (tpl.getAttribute('x-for') || '').slice(0, 160),
              nearestXRoute: routeAnc ? (routeAnc.getAttribute('x-route') || '').slice(0, 100) : null,
              hiddenReason,
              hostItemsAttr: itemsHost ? (itemsHost.getAttribute('items') || '').slice(0, 120) : null,
            });
          }

          return {
            templateCount: templates.length,
            nonCollapsedTemplateCount: templates.filter((t) => t.getAttribute('data-prerender-collapsed') !== '1').length,
            hint:
              'entries.staticGenerated is read before the x-for mark pass and is always false; use stage post-xfor-mark for data-prerender-static-generated.',
            entries,
            listDiagnostics,
          };
        }).catch(() => null);
        pushDebug({ path: displayPath, stage: 'post-dom-settle', metrics: before });
      }

      // Optional extra delay so in-page async (e.g. fetch() in x-init for client logos) can complete before snapshot.
      if (config.waitAfterIdle > 0) {
        await new Promise((r) => setTimeout(r, config.waitAfterIdle));
      }

      // Wait for async content in static lists: elements with x-init (fetch) + x-html should have content (e.g. inline SVG) before snapshot.
      const asyncContentTimeout = 5000;
      const asyncContentInterval = 100;
      const asyncStart = Date.now();
      for (; ;) {
        const { pending, total } = await page.evaluate(() => {
          const els = document.querySelectorAll('[x-init][x-html]');
          const withFetch = Array.from(els).filter((el) => (el.getAttribute('x-init') || '').includes('fetch'));
          const stillEmpty = withFetch.filter((el) => !el.querySelector('svg') && !el.textContent.trim());
          return { pending: stillEmpty.length, total: withFetch.length };
        });
        if (pending === 0 || total === 0 || Date.now() - asyncStart >= asyncContentTimeout) {
          break;
        }
        await new Promise((r) => setTimeout(r, asyncContentInterval));
      }

      // Strip x-init, x-data, x-html from elements that already have content (e.g. inline SVG from fetch).
      // Keeps the baked-in content as static HTML; Alpine won't re-fetch or overwrite on load.
      await page.evaluate(() => {
        document.querySelectorAll('[x-init][x-html]').forEach((el) => {
          if (!el.querySelector('svg') && !el.textContent.trim()) return;
          el.removeAttribute('x-init');
          el.removeAttribute('x-data');
          el.removeAttribute('x-html');
        });
      });

      // Strip x-markdown from elements that already have baked content.
      // The markdown plugin hides elements with opacity:0 on init, then re-fetches and re-renders.
      // For prerendered pages the content is already baked — removing x-markdown prevents the
      // runtime plugin from re-processing (and temporarily hiding) the static content.
      await page.evaluate(() => {
        document.querySelectorAll('[x-markdown]').forEach((el) => {
          if (!el.textContent.trim() && !el.innerHTML.trim()) return;
          el.removeAttribute('x-markdown');
        });
      });

      // Restore hydrate-target elements to their pristine source attributes
      // (snapshotted via evaluateOnNewDocument before Alpine ran).  This is true
      // hydration: every Alpine binding (`:class`, `:style`, `:value`, `x-text`,
      // `x-init`, custom plugin directives, …) is preserved exactly as authored,
      // and Alpine processes them at runtime in the prerendered MPA the same way
      // it would in the live SPA.  After restoring source attributes we re-add the
      // `data-prerender-hydrate` marker so downstream Node.js stripping passes
      // continue to skip these elements.
      //
      // Implementation note: we use `outerHTML` to swap the element rather than
      // `setAttribute` per-attribute.  Alpine's special attribute names (`@click`,
      // possibly others starting with `@`) are not valid DOM Names per the XML
      // production, so `setAttribute('@click', …)` throws InvalidCharacterError.
      // The HTML parser, on the other hand, is lenient and accepts these names.
      // Building an HTML string and assigning it via outerHTML round-trips through
      // the parser and produces an element with all source attributes intact.
      const restoreReport = await page.evaluate(() => {
        const snapshots = window.__manifestHydrateSnapshots || [];
        const report = { total: snapshots.length, restored: 0, notFound: 0, errors: [] };

        // Resolve every snapshot to its element BEFORE we start mutating, then sort
        // by depth (deepest first).  This guarantees children are processed before
        // their ancestors, so when an ancestor is rebuilt the children captured in
        // its innerHTML have already been restored to source state.
        const items = [];
        snapshots.forEach(({ id, attrs }) => {
          const el = document.querySelector(`[data-manifest-hyd-id="${id}"]`);
          if (!el) { report.notFound++; return; }
          let depth = 0;
          for (let p = el.parentNode; p; p = p.parentNode) depth++;
          items.push({ el, attrs, depth });
        });
        items.sort((a, b) => b.depth - a.depth);

        const voidEls = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'param', 'source', 'track', 'wbr']);
        const isAlpineSpecial = (name) => name.startsWith('@') || name.startsWith(':') || name.startsWith('x-on:') || name.startsWith('x-bind:');

        items.forEach(({ el, attrs }) => {
          // Wipe everything first.
          Array.from(el.attributes).map((a) => a.name).forEach((name) => {
            try { el.removeAttribute(name); } catch (_) {}
          });

          // Try setAttribute for each source attribute; if a name is invalid for
          // the DOM API (e.g. `@click`), fall back to building an Attr node via
          // the lenient HTML parser and adopting it.
          let needsParserFallback = false;
          for (const [name, value] of Object.entries(attrs)) {
            try {
              el.setAttribute(name, value);
            } catch (_) {
              needsParserFallback = true;
              break;
            }
          }

          if (needsParserFallback) {
            // Wipe again because the partial setAttribute pass left the element
            // in an inconsistent state.
            Array.from(el.attributes).map((a) => a.name).forEach((name) => {
              try { el.removeAttribute(name); } catch (_) {}
            });
            // Build a temp element via the HTML parser, then adopt its attributes.
            const tag = el.tagName.toLowerCase();
            const attrString = Object.entries(attrs)
              .map(([name, value]) => `${name}="${String(value == null ? '' : value).replace(/&/g, '&amp;').replace(/"/g, '&quot;')}"`)
              .join(' ');
            const tmp = document.createElement('div');
            tmp.innerHTML = `<${tag} ${attrString}></${tag}>`;
            const parsed = tmp.firstElementChild;
            if (parsed) {
              for (const a of Array.from(parsed.attributes)) {
                try {
                  el.setAttribute(a.name, a.value);
                } catch (_) {
                  // setAttribute still fails for special names — adopt the Attr
                  // node directly.  setAttributeNode accepts Attr nodes that the
                  // parser created (which can carry names invalid for createAttribute).
                  try {
                    const adopted = document.adoptNode(a);
                    el.setAttributeNode(adopted);
                  } catch (_) { /* skip */ }
                }
              }
            }
          }

          // Marker so downstream stripping skips this element.
          try { el.setAttribute('data-prerender-hydrate', '1'); } catch (_) {}
          report.restored++;
        });

        return report;
      });
      if (config.debugPrerender) {
        pushDebug({ path: displayPath, stage: 'hydrate-restore', metrics: restoreReport });
      }

      // x-for lists: keep static lists in the HTML for SEO; collapse only dynamic lists so Alpine re-renders.
      // Explicit: data-prerender="dynamic"|"skip". Inferred: x-for uses $search/$query,
      // $url, $auth, or iterates over getter names (filtered*, results, searchResults). See docs prerender + local.data.
      await page.evaluate(() => {
        document.querySelectorAll('template[x-for]').forEach((tpl) => {
          if (tpl.hasAttribute('data-prerender-hydrate') || tpl.closest('[data-prerender-hydrate]')) {
            tpl.removeAttribute('data-prerender-collapsed');
            tpl.removeAttribute('data-prerender-static-generated');
            return;
          }
          const xFor = (tpl.getAttribute('x-for') || '').trim();
          const prerender = (tpl.getAttribute('data-prerender') || '').toLowerCase();
          const explicit = prerender === 'dynamic' || prerender === 'skip';
          const inferred = xFor.includes('$search') || xFor.includes('$query') ||
            xFor.includes('$url') || xFor.includes('$auth') ||
            /\bin\s+(filtered\w*|results|searchResults)\b/.test(xFor);
          const forceCollapse = explicit || inferred;
          if (!forceCollapse) {
            tpl.removeAttribute('data-prerender-collapsed');
            tpl.removeAttribute('data-prerender-static-generated');
            // Static mode: if prerender produced concrete siblings, mark template for removal later.
            const first = tpl.content?.firstElementChild;
            if (first) {
              const tag = first.tagName;
              const cls = first.getAttribute('class') || '';
              let next = tpl.nextElementSibling;
              let generatedCount = 0;
              while (next) {
                if (next.tagName !== tag) break;
                const sameClass = (next.getAttribute('class') || '') === cls;
                if (!sameClass) break;
                generatedCount++;
                next = next.nextElementSibling;
              }
              if (generatedCount > 0) {
                tpl.setAttribute('data-prerender-static-generated', '1');
              }
            }
            return; // keep prerendered list for SEO
          }
          tpl.setAttribute('data-prerender-collapsed', '1');
          const first = tpl.content?.firstElementChild;
          if (!first) return;
          const tag = first.tagName;
          const cls = first.getAttribute('class') || '';
          let next = tpl.nextElementSibling;
          while (next) {
            const sameTag = next.tagName === tag;
            const sameClass = (next.getAttribute('class') || '') === cls;
            const isLikelyClone = sameTag && sameClass;
            const toRemove = next;
            next = next.nextElementSibling;
            if (isLikelyClone) toRemove.remove();
            else break;
          }
        });
      });

      if (config.debugPrerender) {
        const afterMark = await page.evaluate(() => {
          const rows = [];
          for (const tpl of document.querySelectorAll('template[x-for]')) {
            rows.push({
              xFor: (tpl.getAttribute('x-for') || '').slice(0, 140),
              collapsed: tpl.getAttribute('data-prerender-collapsed') === '1',
              staticGenerated: tpl.getAttribute('data-prerender-static-generated') === '1',
            });
          }
          return {
            templateCount: rows.length,
            staticMarkedCount: rows.filter((r) => r.staticGenerated).length,
            collapsedCount: rows.filter((r) => r.collapsed).length,
            entries: rows.slice(0, 60),
          };
        }).catch(() => null);
        pushDebug({ path: displayPath, stage: 'post-xfor-mark', metrics: afterMark });
      }

      // For static x-for clones that contain data-hydrate elements, inject the loop-scope
      // variable as x-data on the clone element itself. This ensures that after the loop
      // template is removed, data-hydrate bindings referencing loop variables (e.g.
      // plan?.price?.[currency]?.[frequency]) continue to work at runtime via the injected scope.
      // The parent Alpine scope (e.g. <main x-data="{ currency, frequency }") remains accessible.
      await page.evaluate(() => {
        const loopVarRx = /^\s*(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?\s*\)|([A-Za-z_$][\w$]*))\s+in\s+/;
        document.querySelectorAll('template[x-for][data-prerender-static-generated="1"]').forEach((tpl) => {
          if (tpl.hasAttribute('data-prerender-hydrate') || tpl.closest('[data-prerender-hydrate]')) return;
          const xFor = (tpl.getAttribute('x-for') || '').trim();
          const m = xFor.match(loopVarRx);
          const itemVar = m ? (m[1] || m[3] || '') : '';
          if (!itemVar) return;
          const first = tpl.content && tpl.content.firstElementChild;
          if (!first) return;
          const tag = first.tagName;
          const cls = first.getAttribute('class') || '';
          let n = tpl.nextElementSibling;
          while (n && n.tagName === tag && (n.getAttribute('class') || '') === cls) {
            // Only process clones that contain data-hydrate descendants
            if (
              !n.hasAttribute('x-data') &&
              (n.hasAttribute('data-prerender-hydrate') || n.querySelector('[data-prerender-hydrate]'))
            ) {
              try {
                const A = window.Alpine;
                if (A) {
                  // Alpine.evaluate(el, expr) evaluates in the full scope chain including
                  // x-for loop variables, unlike Alpine.$data() which only sees x-data attrs.
                  let raw = undefined;
                  if (typeof A.evaluate === 'function') {
                    raw = A.evaluate(n, itemVar);
                  } else if (typeof A.$data === 'function') {
                    // Fallback: $data only sees x-data scopes, not x-for vars
                    const scope = A.$data(n);
                    if (scope && Object.prototype.hasOwnProperty.call(scope, itemVar)) {
                      raw = scope[itemVar];
                    }
                  }
                  if (raw !== undefined && raw !== null) {
                    // Serialize only own-enumerable properties to avoid circular refs / proxies
                    const snapshot = JSON.parse(JSON.stringify(raw));
                    n.setAttribute('x-data', JSON.stringify({ [itemVar]: snapshot }));
                  }
                }
              } catch { /* serialisation failed — leave binding as-is */ }
            }
            n = n.nextElementSibling;
          }
        });
      });

      // Strip loop-scope bindings from x-for clones while <template> nodes still exist.
      // (If we remove static templates first, querySelectorAll('template[x-for]') misses them and clones
      // keep x-text/x-bind referencing card/item — Alpine then mutates or errors on the static HTML.)
      await page.evaluate(() => {
        const loopVarRegex = /^\s*(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?\s*\)|([A-Za-z_$][\w$]*))\s+in\s+/;
        // Include x-init: expanded clones still had x-init="getDescription(article)" etc.; Alpine then throws (article undefined).
        const bindingAttrRegex = /^(?:x-bind:|:|x-text|x-html|x-show|x-if|x-model|x-effect|x-init|x-icon|x-on:|@)/;
        const hasVar = (expr, varName) => varName && new RegExp(`\\b${varName}\\b`).test(expr || '');
        const stripLoopBindings = (el, itemVar, indexVar) => {
          const nodes = [el, ...Array.from(el.querySelectorAll('*'))];
          for (const node of nodes) {
            // Skip elements inside data-hydrate islands — their bindings must remain live
            if (node.hasAttribute('data-prerender-hydrate') || node.closest('[data-prerender-hydrate]')) continue;
            const attrs = node.attributes ? Array.from(node.attributes) : [];
            for (const attr of attrs) {
              if (!bindingAttrRegex.test(attr.name)) continue;
              const expr = attr.value || '';
              if (hasVar(expr, itemVar) || hasVar(expr, indexVar)) {
                const name = attr.name;
                if (name === 'x-text' || name === 'x-html') {
                  if ((node.textContent || '').trim() || (node.innerHTML || '').trim()) {
                    node.removeAttribute(name);
                  }
                  continue;
                }
                if (name === 'x-show' || name === 'x-if') {
                  node.removeAttribute(name);
                  continue;
                }
                if (name === 'x-icon') {
                  node.setAttribute('x-icon', '');
                  continue;
                }
                let boundAttr = '';
                if (name.startsWith(':')) boundAttr = name.slice(1);
                else if (name.startsWith('x-bind:')) boundAttr = name.slice('x-bind:'.length);
                if (boundAttr) {
                  const concrete = node.getAttribute(boundAttr);
                  if (concrete != null && String(concrete).trim() !== '') {
                    node.removeAttribute(name);
                  }
                  continue;
                }
                node.removeAttribute(name);
              }
            }
          }
        };

        document.querySelectorAll('template[x-for]').forEach((tpl) => {
          if (tpl.hasAttribute('data-prerender-hydrate') || tpl.closest('[data-prerender-hydrate]')) return;
          const xFor = (tpl.getAttribute('x-for') || '').trim();
          const m = xFor.match(loopVarRegex);
          const itemVar = m ? (m[1] || m[3] || '') : '';
          const indexVar = m ? (m[2] || '') : '';
          if (!itemVar && !indexVar) return;

          const first = tpl.content?.firstElementChild;
          if (!first) return;
          const tag = first.tagName;

          let next = tpl.nextElementSibling;
          while (next) {
            if (next.tagName !== tag) break;
            stripLoopBindings(next, itemVar, indexVar);
            next = next.nextElementSibling;
          }
        });
      });

      // Remove static x-for templates once static clones are generated.
      // Alpine registers a cleanup on <template x-for> that removes every node in _x_lookup when the
      // template is detached — so tpl.remove() alone deletes all sibling clones (empty grids in output).
      // Replace each clone with a deep cloneNode first so teardown targets detached nodes; copies stay in DOM.
      await page.evaluate(() => {
        const A = window.Alpine;
        const runBatch = typeof A?.mutateDom === 'function' ? (fn) => A.mutateDom(fn) : (fn) => fn();
        runBatch(() => {
          document.querySelectorAll('template[x-for][data-prerender-static-generated="1"]').forEach((tpl) => {
            if (tpl.hasAttribute('data-prerender-hydrate') || tpl.closest('[data-prerender-hydrate]')) return;
            const parent = tpl.parentNode;
            if (!parent) {
              tpl.remove();
              return;
            }
            const first = tpl.content?.firstElementChild;
            if (!first) {
              tpl.remove();
              return;
            }
            const tag = first.tagName;
            const cls = first.getAttribute('class') || '';
            let n = tpl.nextElementSibling;
            while (n && n.tagName === tag) {
              if ((n.getAttribute('class') || '') !== cls) break;
              const next = n.nextElementSibling;
              n.replaceWith(n.cloneNode(true));
              n = next;
            }
            tpl.remove();
          });
        });
      });

      // Remove orphan x-for clones that still reference loop-scope vars (e.g. image/index)
      // outside their template scope. These throw Alpine errors in live static hosting.
      await page.evaluate(() => {
        const loopVarRegex = /^\s*(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?\s*\)|([A-Za-z_$][\w$]*))\s+in\s+/;
        const bindingAttrRegex = /^(?:x-bind:|:|x-text|x-html|x-show|x-if|x-model|x-effect|x-init|x-icon|x-on:|@)/;
        const hasVar = (expr, varName) => varName && new RegExp(`\\b${varName}\\b`).test(expr || '');
        const elementReferencesLoopScope = (el, itemVar, indexVar) => {
          if (!el) return false;
          const nodes = [el, ...Array.from(el.querySelectorAll('*'))];
          for (const node of nodes) {
            const attrs = node.attributes ? Array.from(node.attributes) : [];
            for (const attr of attrs) {
              if (!bindingAttrRegex.test(attr.name)) continue;
              const expr = attr.value || '';
              if (hasVar(expr, itemVar) || hasVar(expr, indexVar)) return true;
            }
          }
          return false;
        };

        // Only clean up templates we intentionally collapsed above.
        // Running this on all x-for templates can remove valid prerendered list items.
        document.querySelectorAll('template[x-for][data-prerender-collapsed="1"]').forEach((tpl) => {
          const xFor = (tpl.getAttribute('x-for') || '').trim();
          const m = xFor.match(loopVarRegex);
          const itemVar = m ? (m[1] || m[3] || '') : '';
          const indexVar = m ? (m[2] || '') : '';
          if (!itemVar && !indexVar) return;

          const first = tpl.content?.firstElementChild;
          if (!first) return;
          const tag = first.tagName;

          let next = tpl.nextElementSibling;
          while (next) {
            const sameTag = next.tagName === tag;
            if (!sameTag) break;

            const referencesLoopScope = elementReferencesLoopScope(next, itemVar, indexVar);

            const toRemove = next;
            next = next.nextElementSibling;
            if (referencesLoopScope) toRemove.remove();
            else break;
          }
        });
      });

      const visibilityNormalizedPath = logicalPathToVisibilityNormalizedPath(pathSeg, locales);
      await page.evaluate((np) => {
        try {
          window.ManifestRoutingVisibility?.processRouteVisibility?.(np);
        } catch {
          /* no-op */
        }
      }, visibilityNormalizedPath);

      // Remove route-hidden content ([x-route] with inline style display:none) so each prerendered page contains only that route's HTML.
      await page.evaluate(() => {
        const reDisplayNone = /\bdisplay\s*:\s*none\b/i;
        const candidates = document.querySelectorAll('[x-route][style*="display"]');
        const toRemove = Array.from(candidates).filter((el) => reDisplayNone.test(el.getAttribute('style') || ''));
        const depth = (el) => { let d = 0; let n = el; while (n && n !== document.body) { d++; n = n.parentElement; } return d; };
        toRemove.sort((a, b) => depth(a) - depth(b)); // remove outer first so subtrees go in one go
        toRemove.forEach((el) => { if (document.contains(el)) el.remove(); });
      });

      let html = await page.evaluate(() => document.documentElement.outerHTML);
      // Cache raw DOM snapshot for locale variant generation (before any Node.js transforms).
      if (typeof onRawHtml === 'function') onRawHtml(pathSeg, html);
      if (config.debugPrerender) {
        const post = await page.evaluate(() => {
          const templates = document.querySelectorAll('template[x-for]').length;
          const links = document.querySelectorAll('a[href="#"]').length;
          const hidden = document.querySelectorAll('[style*="display: none"]').length;
          return { templateCountAfterCleanup: templates, hashHrefCount: links, displayNoneCount: hidden };
        }).catch(() => null);
        pushDebug({ path: displayPath, stage: 'pre-serialize', metrics: post });
      }
      html = stripDevOnlyContent(html);
      html = stripInjectedPluginScripts(html);
      if (tailwindBuilt) {
        html = stripRuntimeTailwindArtifacts(html);
      }
      if (bundleUtilities) {
        const extracted = extractUtilityStyleBlocks(html);
        html = extracted.html;
        for (const b of extracted.blocks) utilityBlocks.push(b);
      }
      if (tailwindBuilt) {
        html = injectBeforeHeadClose(
          html,
          `<link rel="stylesheet" href="${buildRootAssetPath(routerBasePath, 'prerender.tailwind.css')}">`
        );
      }
      html = stripDuplicatedLoopDirectives(html);
      html = stripPrerenderedXDataDirectives(html);
      const content = loadContentForPrerender(manifest, config.root, currentLocale);
      const xData = { manifest, content };
      html = resolveHeadXBindings(html, xData);
      html = stripPrerenderDynamicBindings(html);
      html = stripPrerenderBakedRadioCheckedForXModel(html);
      html = stripRedundantImgSrcBindings(html);
      html = stripEmptyInlineMaskStyles(html);
      html = stripResolvedXIconDirectives(html);
      // markPrerenderedManifestComponents must run BEFORE stripPrerenderHydrateMarkers so it can
      // detect data-prerender-hydrate markers and skip components inside hydrate islands.
      html = markPrerenderedManifestComponents(html);
      html = stripPrerenderHydrateMarkers(html);
      html = stripPrerenderHydrateSnapshotIds(html);
      html = rewriteHtmlAssetPaths(html, fileSegments.length);
      const liveBase = config.liveUrl.replace(/\/$/, '');
      const canonicalHreflang = buildCanonicalAndHreflang(is404 ? '' : pathSeg, locales, defaultLocale, liveBase);
      const ogLocale = buildOgLocale(is404 ? '' : pathSeg, locales, defaultLocale);
      const injectOgLocale = ogLocale && hasOtherOgMeta(html);
      if (injectOgLocale) html = stripOgLocaleFromHead(html);
      const baseMeta = routerBasePath !== null ? `<meta name="manifest:router-base" content="${String(routerBasePath).replace(/"/g, '&quot;')}">\n` : '';
      const routeEx = config.localeRouteExclude || [];
      const routeMeta =
        routeEx.length > 0
          ? `<meta name="manifest:locale-route-exclude" content="${JSON.stringify(routeEx).replace(/"/g, '&quot;')}">\n`
          : '';
      const routeDepth = fileSegments.length;
      const prerenderedMeta = `<meta name="manifest:prerendered" content="1">\n`;
      html = html.replace(
        '</head>',
        `${canonicalHreflang}${injectOgLocale ? ogLocale : ''}${routeMeta}${baseMeta}${prerenderedMeta}<meta name="manifest:router-base-depth" content="${routeDepth}">\n</head>`
      );
      mkdirSync(outDir, { recursive: true });
      writeFileSync(outFile, html, 'utf8');
      pushDebug({
        path: displayPath,
        stage: 'wrote',
        outFile,
        htmlBytes: Buffer.byteLength(html, 'utf8'),
        hasXForTemplate: html.includes('template x-for') || html.includes('template[x-for]'),
      });
    } catch (err) {
      failedPaths.push({
        path: displayPath,
        message: err && err.message ? err.message : String(err)
      });
      if (failedPaths.length <= 10) {
        process.stderr.write(`prerender: failed ${displayPath}: ${failedPaths[failedPaths.length - 1].message}\n`);
      }
    } finally {
      await page.close();
    }
  }

  // Phase 1: Puppeteer — render base paths, cache raw DOM for substitution
  try {
    let index = 0;
    async function worker() {
      while (true) {
        const i = index++;
        if (i >= puppeteerPaths.length) return;
        await processPath(puppeteerPaths[i], i, {
          onRawHtml: (seg, html) => {
            // Cache raw DOM snapshot for locale variant generation (NOT_FOUND_PATH excluded)
            if (seg !== NOT_FOUND_PATH) baseHtmlCache.set(seg || '', html);
          },
        });
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(concurrency, puppeteerPaths.length || 1) }, () => worker())
    );
  } finally {
    await browser.close();
  }

  // Phase 2: Node.js — generate locale variants via text substitution
  if (localeVariantPaths.length > 0) {
    process.stdout.write(`  Generating ${localeVariantPaths.length} locale variant(s) via text substitution...\n`);
    let substIndex = 0;
    for (const { pathSeg, basePathSeg, targetLocale } of localeVariantPaths) {
      substIndex++;
      const rawHtml = baseHtmlCache.get(basePathSeg);
      if (!rawHtml) {
        // Base path was expected to be Puppeteer-rendered but is absent — its render likely failed.
        failedPaths.push({ path: '/' + pathSeg, message: `base path "${basePathSeg || '/'}" missing from cache (did its Puppeteer render fail?)` });
        process.stderr.write(`prerender: skipped /${pathSeg} — base "${basePathSeg || '/'}" not in cache\n`);
        continue;
      }

      const displayPath = '/' + pathSeg;
      process.stdout.write(`  [subst ${substIndex}/${localeVariantPaths.length}] ${displayPath}\n`);

      try {
        const pairs = substitutionMaps.get(targetLocale) || [];
        const { html, utilityBlocks: pageBlocks } = generateLocaleVariantHtml({
          rawHtml, pathSeg, targetLocale, locales, defaultLocale,
          config, manifest, routerBasePath, tailwindBuilt, bundleUtilities,
          substitutionPairs: pairs,
        });
        for (const b of pageBlocks) utilityBlocks.push(b);

        const fileSegments = pathToFileSegments(pathSeg ? '/' + pathSeg : '/');
        const outDir = join(config.output, ...fileSegments);
        mkdirSync(outDir, { recursive: true });
        writeFileSync(join(outDir, 'index.html'), html, 'utf8');
      } catch (err) {
        failedPaths.push({ path: displayPath, message: err?.message ?? String(err) });
        process.stderr.write(`prerender: substitution failed ${displayPath}: ${failedPaths[failedPaths.length - 1].message}\n`);
      }
    }
  }

  if (failedPaths.length > 0) {
    const sample = failedPaths.slice(0, 5).map((f) => `${f.path}: ${f.message}`).join(' | ');
    throw new Error(`prerender failed for ${failedPaths.length}/${pathTotal} paths. Sample: ${sample}`);
  }

  if (config.debugPrerender) {
    const reportPath = join(outputResolved, 'prerender.debug.json');
    writeFileSync(reportPath, JSON.stringify({
      generatedAt: new Date().toISOString(),
      totalPaths: pathTotal,
      failedPaths,
      rows: debugRows,
    }, null, 2), 'utf8');
    process.stdout.write(`prerender: debug report ${reportPath}\n`);
  }

  if (bundleUtilities) {
    const utilMerged = mergeUtilityCssBlocks(utilityBlocks);
    if (utilMerged.trim()) {
      writeFileSync(join(outputResolved, 'prerender.utilities.css'), `${utilMerged}\n`, 'utf8');
      process.stdout.write('prerender: wrote prerender.utilities.css (Manifest custom utilities)\n');
      postProcessInjectStylesheetLink(outputResolved, 'prerender.utilities.css', routerBasePath || '');
    }
  }

  writeSeoFiles(
    config.output,
    pathList.filter((p) => p !== NOT_FOUND_PATH),
    config.liveUrl,
    locales,
    defaultLocale
  );
  validatePrerenderedOutput(config.output, pathList.filter((p) => p !== NOT_FOUND_PATH));

  if (config.redirects.length > 0) {
    const lines = config.redirects.map((r) => {
      if (typeof r === 'string') return r;
      const from = r.from ?? r.fromPath ?? '';
      const to = r.to ?? r.toPath ?? r.redirect ?? '';
      const status = r.status ?? r.force ?? 301;
      return `${from} ${to} ${status}`;
    });
    writeFileSync(join(config.output, '_redirects'), lines.join('\n'), 'utf8');
  }

}

main().catch((err) => {
  console.error('prerender:', err);
  process.exit(1);
});
