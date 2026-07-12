#!/usr/bin/env node
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

const root = process.argv[2];
if (!root) {
  console.error('Usage: node check_release.mjs <release-dir>');
  process.exit(2);
}

const required = [
  'README_RELEASE.md',
  'CONFORMANCE.md',
  'FILE_SHA256SUMS.txt',
  'conformance/index.json',
  'source',
  'evidence',
];

const failures = [];
for (const rel of required) {
  if (!fs.existsSync(path.join(root, rel))) failures.push(`missing:${rel}`);
}

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? walk(full) : [full];
  });
}

if (fs.existsSync(root)) {
  const files = walk(root).filter((f) => !f.endsWith('FILE_SHA256SUMS.txt')).sort();
  const manifest = files.map((file) => {
    const digest = crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
    return `${digest}  ${path.relative(root, file).replaceAll('\\', '/')}`;
  }).join('\n') + '\n';
  fs.writeFileSync(path.join(root, 'FILE_SHA256SUMS.txt'), manifest);
}

if (failures.length) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}
console.log(JSON.stringify({ ok: true, release: path.resolve(root) }, null, 2));
