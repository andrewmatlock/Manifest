import { copyFileSync, chmodSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const packageRoot = join(__dirname, '..');
const repoRoot = join(packageRoot, '..', '..');
const source = join(repoRoot, 'src', 'scripts', 'manifest.render.mjs');
const target = join(packageRoot, 'manifest.render.mjs');

copyFileSync(source, target);
chmodSync(target, 0o755);
console.log('synced', source, '->', target);
