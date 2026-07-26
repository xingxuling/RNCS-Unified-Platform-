import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const registry = JSON.parse(fs.readFileSync(path.join(root, 'rncs.modules.json'), 'utf8'));
const errors = [];

for (const module of registry.modules) {
  if (!fs.existsSync(path.join(root, module.path))) errors.push(`MODULE_MISSING:${module.id}`);
}

function readTrackedFiles() {
  const result = spawnSync('git', ['-C', root, 'ls-files', '-z'], {
    encoding: 'utf8',
    windowsHide: true,
  });
  if (result.status !== 0) return null;
  return result.stdout.split('\0').filter(Boolean).map(file => file.replaceAll('\\', '/'));
}

function scanFilesystem() {
  const banned = [];
  function walk(directory) {
    for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
      const target = path.join(directory, entry.name);
      if (entry.name === '.git') continue;
      if (entry.name === 'node_modules') {
        if (directory !== root) banned.push(path.relative(root, target));
        continue;
      }
      if (entry.name === '__pycache__' || entry.name === '.pytest_cache') {
        banned.push(path.relative(root, target));
        continue;
      }
      if (entry.isDirectory()) walk(target);
      else if (entry.name.endsWith('.pyc')) banned.push(path.relative(root, target));
    }
  }
  walk(root);
  return banned;
}

const trackedFiles = readTrackedFiles();
const banned = trackedFiles
  ? trackedFiles.filter(file => {
    const segments = file.split('/');
    return segments.includes('node_modules')
      || segments.includes('__pycache__')
      || segments.includes('.pytest_cache')
      || file.endsWith('.pyc');
  })
  : scanFilesystem();

const duplicatePaths = {
  'studio-vendor': ['apps/reality-studio/vendor'],
  'dbs-project-vsr': ['apps/digital-blue-sky/projects'],
  'dml-vendor': ['packages/host/dml-remote-link/vendor'],
};
const duplicates = [];
for (const [name, paths] of Object.entries(duplicatePaths)) {
  for (const duplicatePath of paths) {
    const normalized = duplicatePath.replaceAll('\\', '/');
    const exists = trackedFiles
      ? trackedFiles.some(file => file === normalized || file.startsWith(`${normalized}/`))
      : fs.existsSync(path.join(root, duplicatePath));
    if (exists) duplicates.push(`${name}:${duplicatePath}`);
  }
}

const report = {
  valid: errors.length === 0 && banned.length === 0 && duplicates.length === 0,
  suiteVersion: registry.suiteVersion,
  moduleCount: registry.modules.length,
  inventory: trackedFiles ? 'git-index' : 'filesystem',
  trackedFileCount: trackedFiles?.length ?? null,
  errors,
  banned,
  duplicates,
};

fs.mkdirSync(path.join(root, 'artifacts'), { recursive: true });
fs.writeFileSync(
  path.join(root, 'artifacts', 'release-verification.json'),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (!report.valid) process.exitCode = 1;
