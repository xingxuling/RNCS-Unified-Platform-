import { createHash } from 'node:crypto';
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const excludedNames = new Set(['node_modules', '.git', 'dist', 'outputs']);
const manifestName = 'FILE_SHA256SUMS.txt';

function walk(dir, files = []) {
  for (const name of readdirSync(dir)) {
    if (excludedNames.has(name) || name === manifestName) continue;
    const path = join(dir, name);
    const stat = statSync(path);
    if (stat.isDirectory()) walk(path, files);
    else files.push(relative('.', path).replaceAll('\\', '/'));
  }
  return files;
}

function hash(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

const files = walk('.').sort();
const sums = files.map(path => `${hash(path)}  ${path}`).join('\n') + '\n';
writeFileSync(manifestName, sums);
console.log(JSON.stringify({ fileCount: files.length, manifest: manifestName }, null, 2));
