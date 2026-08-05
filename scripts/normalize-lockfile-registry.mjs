import fs from 'node:fs';

const lockfilePath = process.argv[2] ?? 'package-lock.json';
const internalRegistry = 'https://packages.applied-caas-gateway1.internal.api.openai.org/artifactory/api/npm/npm-public/';
const publicRegistry = 'https://registry.npmjs.org/';
const lockfile = JSON.parse(fs.readFileSync(lockfilePath, 'utf8'));
let replaced = 0;

for (const entry of Object.values(lockfile.packages ?? {})) {
  if (typeof entry?.resolved === 'string' && entry.resolved.startsWith(internalRegistry)) {
    entry.resolved = publicRegistry + entry.resolved.slice(internalRegistry.length);
    replaced += 1;
  }
}

fs.writeFileSync(lockfilePath, `${JSON.stringify(lockfile, null, 2)}\n`);
console.log(`Normalized ${replaced} lockfile package URLs to ${publicRegistry}`);
