#!/usr/bin/env node

/* Manifest Render */

import { readFileSync, readSync, mkdirSync, writeFileSync, existsSync, rmSync, statSync, readdirSync, cpSync, unlinkSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { join, resolve, dirname, relative, basename, sep } from 'node:path';
import { createServer } from 'node:http';
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
    locales: pre.locales,
    redirects: Array.isArray(pre.redirects) ? pre.redirects : [],
    wait: cli.wait ?? pre.wait ?? null,
    waitAfterIdle: Math.max(0, cli.waitAfterIdle ?? pre.waitAfterIdle ?? 0),
    concurrency: Math.max(1, cli.concurrency ?? pre.concurrency ?? 6),
    dryRun: !!cli.dryRun,
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

function injectAfterHeadOpen(html, snippet) {
  if (!snippet) return html;
  const hrefMatch = snippet.match(/href=["']([^"']+)["']/);
  if (hrefMatch && html.includes(hrefMatch[1])) return html;
  return html.replace(/<head([^>]*)>/i, `<head$1>\n${snippet}\n`);
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
 * Only runs when the project opts in (data-tailwind on manifest script) or manifest.prerender.tailwind === true.
 */
function runTailwindCliForPrerender(rootDir, outputDir, pre) {
  const explicit = pre?.tailwind;
  if (explicit === false) return false;
  const usesTailwind = explicit === true || indexHtmlUsesTailwind(rootDir);
  if (!usesTailwind) return false;

  const outCss = join(outputDir, 'prerender.tailwind.css');
  try {
    require.resolve('tailwindcss', { paths: [rootDir] });
  } catch {
    const proceed = promptContinueWithRuntimeTailwind(rootDir);
    if (!proceed) {
      throw new Error('prerender aborted: install tailwindcss/@tailwindcss/cli or disable prerender.tailwind.');
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
  const defaultContent = [
    '**/*.html',
    '!**/node_modules/**',
    '!**/dist/**',
    `!**/${outputBasename}/**`,
  ];
  const contentGlobs = Array.isArray(pre?.tailwindContent) && pre.tailwindContent.length > 0
    ? pre.tailwindContent
    : defaultContent;

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
    console.error('prerender: Tailwind CLI failed; install with `npm i -D tailwindcss @tailwindcss/cli` or fix tailwindInput/tailwindContent in manifest.prerender.');
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

/** Inject stylesheet link with correct relative href for static hosting (after prerender wrote files). */
function postProcessInjectStylesheetLink(outputDir, filename) {
  const cssPath = join(outputDir, filename);
  if (!existsSync(cssPath)) return;
  const stat = statSync(cssPath);
  if (stat.size === 0) return;

  const files = walkHtmlFiles(outputDir);
  for (const file of files) {
    let html = readFileSync(file, 'utf8');
    if (html.includes(filename)) continue;
    const depth = depthFromOutputRoot(outputDir, file);
    const prefix = depth ? '../'.repeat(depth) : '';
    const tag = `<link rel="stylesheet" href="${prefix}${filename}">`;
    html = injectAfterHeadOpen(html, tag);
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

// --- Strip x-text and x-html that reference $x when static/SEO (content already in snapshot).
//    Do NOT strip when expression is user-driven: $route(, $search, $query. Those stay so Alpine can update.
//    Same rule for :attr in stripPrerenderDynamicBindings: bindings with $x are kept (content stays for SEO).
function stripPrerenderedXDataDirectives(html) {
  function isStatic(expr) {
    if (expr.includes('$route(')) return false;
    if (expr.includes('$search') || expr.includes('$query')) return false;
    return true;
  }
  let out = html.replace(/\s+x-text="([^"]*\$x[^"]*)"/g, (match, expr) => (isStatic(expr) ? '' : match));
  out = out.replace(/\s+x-html="([^"]*\$x[^"]*)"/g, (match, expr) => (isStatic(expr) ? '' : match));
  return out;
}

// --- Don't bake Alpine-only state into the snapshot; only $x-driven content should be prerendered.
//    For any :attr or x-bind:attr whose expression does NOT contain $x, remove the literal attr from the tag
//    so Alpine re-evaluates on load. Bindings that use $x are left as-is (content stays for SEO).
//    Use (?<!:) so we only strip literal attr=, not :attr= (e.g. class= not :class=).
//    Never touch <script> tags (loader + injected plugins must be preserved; static HTML still runs them).
function stripPrerenderDynamicBindings(html) {
  return html.replace(/<(\w+)([^>]*)>/g, (match, tagName, attrsStr) => {
    if (tagName.toLowerCase() === 'script') return match;
    const isAnchor = tagName.toLowerCase() === 'a';
    const toStrip = new Set();
    const bindingRegex = /(?:^|\s)(?::|x-bind:)(\w+)=(?:"([^"]*)"|'([^']*)')/g;
    let m;
    while ((m = bindingRegex.exec(attrsStr)) !== null) {
      const attrName = (m[1] || '').toLowerCase();
      // Keep href on anchors so prerendered static navigation stays valid.
      if (attrName === 'class' || attrName === 'style' || (isAnchor && attrName === 'href')) continue;
      const val = (m[2] !== undefined ? m[2] : m[3]) || '';
      if (val.indexOf('$x') === -1) toStrip.add(attrName);
    }
    if (toStrip.size === 0) return match;
    let newAttrs = attrsStr;
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

// --- Rewrite asset URLs: depth = segments from this HTML file up to output root (website). ----
// All project assets are copied into output, so root-relative paths become relative within output.
// Do NOT rewrite href on <a> tags (navigation links); only rewrite link/script/img so router gets clean paths.

function rewriteHtmlAssetPaths(html, depthWithinOutput) {
  const prefix = depthWithinOutput > 0 ? '../'.repeat(depthWithinOutput) : '';
  if (!prefix) return html;
  function isAnchorTag(htmlBeforeMatch) {
    const lastOpen = htmlBeforeMatch.lastIndexOf('<');
    if (lastOpen === -1) return false;
    const tag = htmlBeforeMatch.slice(lastOpen + 1).match(/^(\w+)/);
    return tag && tag[1].toLowerCase() === 'a';
  }
  let out = html.replace(/(\s(href|src)=["'])\/(?!\/)/g, (match, lead, attr, offset, fullString) => {
    if (isAnchorTag(fullString.slice(0, offset))) return match;
    return lead + prefix;
  });
  out = out.replace(/(\s(href|src)=["'])(\.\.\/)+/g, (match, lead, attr, dots, offset, fullString) => {
    if (isAnchorTag(fullString.slice(0, offset))) return match;
    return lead + prefix;
  });
  return out;
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
  'index.html', 'prerender.mjs', 'prerender.js',
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
  process.stdout.write(`Prerendering ${pathTotal} path(s)...\n`);

  async function processPath(pathSeg, pathIndex) {
    const is404 = pathSeg === NOT_FOUND_PATH;
    const pathname = is404 ? `/${NOT_FOUND_PATH}` : (pathSeg ? `/${pathSeg}` : '/');
    const displayPath = pathSeg === '' ? '/' : pathname;
    process.stdout.write(`  [ ${pathIndex + 1}/${pathTotal} ] ${displayPath}\n`);
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

      // Ensure $route-dependent expressions are recalculated after locale/data stores settle.
      // This helps localized dynamic pages (e.g. /ko/articles/slug) compute prev/next links correctly.
      await page.evaluate(({ allLocales, currentLocale }) => {
        try {
          const localeList = Array.isArray(allLocales) ? allLocales : [];
          const store = (typeof Alpine !== 'undefined' && Alpine.store) ? Alpine.store('locale') : null;
          if (store) {
            if (!Array.isArray(store.available) || store.available.length === 0) {
              store.available = localeList.slice();
            } else {
              const merged = Array.from(new Set([...store.available, ...localeList]));
              store.available = merged;
            }
            if (currentLocale && typeof currentLocale === 'string') {
              store.current = currentLocale;
            }
          }

          const rawRoute = window.ManifestRoutingNavigation?.getCurrentRoute?.() ?? window.location.pathname;
          const clean = String(rawRoute || '/').replace(/^\/+|\/+$/g, '');
          const parts = clean ? clean.split('/') : [];
          const logical = parts.length > 0 && localeList.includes(parts[0])
            ? '/' + parts.slice(1).join('/')
            : (clean ? '/' + clean : '/');
          const to = logical === '//' ? '/' : logical;

          window.dispatchEvent(new CustomEvent('manifest:route-change', {
            detail: {
              from: to,
              to,
              normalizedPath: (typeof to === 'string' && to !== '/') ? to.replace(/^\/|\/$/g, '') : '/'
            }
          }));
          window.dispatchEvent(new PopStateEvent('popstate'));
        } catch {
          // no-op
        }
      }, { allLocales: locales, currentLocale }).catch(() => { });
      await page.waitForTimeout(60).catch(() => { });

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

      // x-for lists: keep static lists in the HTML for SEO; collapse only dynamic lists so Alpine re-renders.
      // Explicit: data-dynamic or data-prerender="dynamic"|"skip". Inferred: x-for uses $search/$query,
      // $url, $auth, or iterates over getter names (filtered*, results, searchResults). See docs prerender + local.data.
      await page.evaluate(() => {
        document.querySelectorAll('template[x-for]').forEach((tpl) => {
          const xFor = (tpl.getAttribute('x-for') || '').trim();
          const prerender = (tpl.getAttribute('data-prerender') || '').toLowerCase();
          const hasDataDynamic = tpl.hasAttribute('data-dynamic');
          const explicit = hasDataDynamic || prerender === 'dynamic' || prerender === 'skip';
          const inferred = xFor.includes('$search') || xFor.includes('$query') ||
            xFor.includes('$url') || xFor.includes('$auth') ||
            /\bin\s+(filtered\w*|results|searchResults)\b/.test(xFor);
          const forceCollapse = explicit || inferred;
          if (!forceCollapse) {
            tpl.removeAttribute('data-prerender-collapsed');
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

      // Remove orphan x-for clones that still reference loop-scope vars (e.g. image/index)
      // outside their template scope. These throw Alpine errors in live static hosting.
      await page.evaluate(() => {
        const loopVarRegex = /^\s*(?:\(\s*([A-Za-z_$][\w$]*)(?:\s*,\s*([A-Za-z_$][\w$]*))?\s*\)|([A-Za-z_$][\w$]*))\s+in\s+/;
        const bindingAttrRegex = /^(?:x-bind:|:|x-text|x-html|x-show|x-if|x-model|x-effect|x-on:|@)/;
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

      // Remove elements marked data-dynamic (so they are not in static HTML; client will render them).
      // Skip <template> since we only collapse those above; other elements and their subtree are removed.
      await page.evaluate(() => {
        const toRemove = Array.from(document.querySelectorAll('[data-dynamic]')).filter((el) => el.tagName !== 'TEMPLATE');
        const depth = (el) => { let d = 0; let n = el; while (n && n !== document.body) { d++; n = n.parentElement; } return d; };
        toRemove.sort((a, b) => depth(a) - depth(b));
        toRemove.forEach((el) => { if (document.contains(el)) el.remove(); });
      });

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
        html = injectAfterHeadOpen(html, '<link rel="stylesheet" href="/prerender.tailwind.css">');
      }
      html = stripDuplicatedLoopDirectives(html);
      html = stripPrerenderedXDataDirectives(html);
      const content = loadContentForPrerender(manifest, config.root, currentLocale);
      const xData = { manifest, content };
      html = resolveHeadXBindings(html, xData);
      html = stripPrerenderDynamicBindings(html);
      html = rewriteHtmlAssetPaths(html, fileSegments.length);
      const liveBase = config.liveUrl.replace(/\/$/, '');
      const canonicalHreflang = buildCanonicalAndHreflang(is404 ? '' : pathSeg, locales, defaultLocale, liveBase);
      const ogLocale = buildOgLocale(is404 ? '' : pathSeg, locales, defaultLocale);
      const injectOgLocale = ogLocale && hasOtherOgMeta(html);
      if (injectOgLocale) html = stripOgLocaleFromHead(html);
      const baseMeta = routerBasePath !== null ? `<meta name="manifest:router-base" content="${String(routerBasePath).replace(/"/g, '&quot;')}">\n` : '';
      const routeDepth = fileSegments.length;
      const prerenderedMeta = `<meta name="manifest:prerendered" content="1">\n`;
      html = html.replace('</head>', `${canonicalHreflang}${injectOgLocale ? ogLocale : ''}${baseMeta}${prerenderedMeta}<meta name="manifest:router-base-depth" content="${routeDepth}">\n</head>`);
      mkdirSync(outDir, { recursive: true });
      writeFileSync(outFile, html, 'utf8');
    } catch (err) {
      // path failed (swallowed to allow other paths to complete)
    } finally {
      await page.close();
    }
  }

  try {
    let index = 0;
    async function worker() {
      while (true) {
        const i = index++;
        if (i >= pathList.length) return;
        await processPath(pathList[i], i);
      }
    }
    await Promise.all(
      Array.from({ length: Math.min(concurrency, pathList.length) }, () => worker())
    );
  } finally {
    await browser.close();
  }

  if (bundleUtilities) {
    const utilMerged = mergeUtilityCssBlocks(utilityBlocks);
    if (utilMerged.trim()) {
      writeFileSync(join(outputResolved, 'prerender.utilities.css'), `${utilMerged}\n`, 'utf8');
      process.stdout.write('prerender: wrote prerender.utilities.css (Manifest custom utilities)\n');
      postProcessInjectStylesheetLink(outputResolved, 'prerender.utilities.css');
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
