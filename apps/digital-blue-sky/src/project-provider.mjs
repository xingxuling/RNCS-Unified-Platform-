import fs from 'node:fs';
import path from 'node:path';
import { hash } from './canonical.mjs';

const ignored = new Set(['node_modules', '.git', 'dist', 'build', '.cache']);

function walk(root, current, out, limit) {
  if (out.length >= limit) return;
  for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
    if (out.length >= limit) return;
    if (ignored.has(entry.name)) continue;
    const absolute = path.join(current, entry.name);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    if (entry.isDirectory()) walk(root, absolute, out, limit);
    else if (entry.isFile()) {
      const stat = fs.statSync(absolute);
      const bytes = stat.size <= 2_000_000 ? fs.readFileSync(absolute) : Buffer.from(`${stat.size}:${stat.mtimeMs}`);
      out.push({ path: relative, size: stat.size, root: hash(bytes.toString('base64')) });
    }
  }
}

export function inspectProject(projectPath, limit = 500) {
  const absolute = path.resolve(projectPath);
  if (!fs.existsSync(absolute)) throw Object.assign(new Error(`Project path not found: ${absolute}`), { code: 'PROJECT_PATH_NOT_FOUND' });
  if (!fs.statSync(absolute).isDirectory()) throw Object.assign(new Error(`Project path is not a directory: ${absolute}`), { code: 'PROJECT_PATH_NOT_DIRECTORY' });
  const files = [];
  walk(absolute, absolute, files, limit);
  files.sort((a, b) => a.path.localeCompare(b.path, 'en'));
  return {
    format: 'dml.project-snapshot.v0.1',
    path: absolute,
    file_count: files.length,
    truncated: files.length >= limit,
    files,
    snapshot_root: hash(files),
  };
}
