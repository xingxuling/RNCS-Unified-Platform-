import fs from 'node:fs';
import path from 'node:path';
import { hash, id, now } from './canonical.mjs';

const DEFAULT_IGNORES = new Set(['node_modules', '.git', 'outputs', '.cache']);

function assertInside(root, candidate) {
  const resolvedRoot = path.resolve(root);
  const resolved = path.resolve(candidate);
  if (resolved !== resolvedRoot && !resolved.startsWith(`${resolvedRoot}${path.sep}`)) {
    throw Object.assign(new Error(`路径越界：${candidate}`), { code: 'PATH_OUTSIDE_ROOT' });
  }
  return resolved;
}

function scan(root, limit = 20_000) {
  const files = new Map();
  const stack = [root];
  while (stack.length && files.size < limit) {
    const current = stack.pop();
    for (const entry of fs.readdirSync(current, { withFileTypes: true })) {
      if (DEFAULT_IGNORES.has(entry.name)) continue;
      const absolute = path.join(current, entry.name);
      if (entry.isDirectory()) stack.push(absolute);
      else if (entry.isFile()) {
        const relative = path.relative(root, absolute).replace(/\\/g, '/');
        const buffer = fs.readFileSync(absolute);
        files.set(relative, { root: hash([...buffer]), bytes: buffer.byteLength });
      }
    }
  }
  return files;
}

export function createRealityBranch({ sourcePath, branchesRoot, projectId, label, strategy = {}, copyDist = true }) {
  const source = path.resolve(sourcePath);
  if (!fs.statSync(source).isDirectory()) throw Object.assign(new Error('项目目录不存在'), { code: 'PROJECT_NOT_FOUND' });
  fs.mkdirSync(branchesRoot, { recursive: true });
  const branchId = id('branch', { source, projectId, label, at: now() });
  const branchPath = path.join(branchesRoot, branchId.replace(/[:]/g, '_'));
  fs.cpSync(source, branchPath, {
    recursive: true,
    filter: (entry) => {
      const name = path.basename(entry);
      if (name === 'node_modules' || name === '.git' || name === 'outputs') return false;
      if (!copyDist && name === 'dist') return false;
      return true;
    },
  });
  const baseFiles = scan(source);
  const manifest = {
    format: 'dml.reality-branch.v0.2',
    branch_id: branchId,
    project_id: projectId,
    label,
    source_path: source,
    branch_path: branchPath,
    created_at: now(),
    strategy,
    base_root: hash([...baseFiles.entries()]),
    status: 'candidate',
    reversible: true,
  };
  fs.writeFileSync(path.join(branchPath, '.dml-branch.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  return manifest;
}

export function applyBranchChanges(branch, operations) {
  const changed = [];
  for (const operation of operations || []) {
    const file = assertInside(branch.branch_path, path.join(branch.branch_path, operation.path));
    fs.mkdirSync(path.dirname(file), { recursive: true });
    if (operation.type === 'write') {
      fs.writeFileSync(file, String(operation.content ?? ''), 'utf8');
    } else if (operation.type === 'replace') {
      const before = fs.readFileSync(file, 'utf8');
      const needle = String(operation.search ?? '');
      if (!needle || !before.includes(needle)) throw Object.assign(new Error(`未找到替换目标：${operation.path}`), { code: 'PATCH_TARGET_NOT_FOUND' });
      const occurrences = before.split(needle).length - 1;
      if (operation.expectedOccurrences && occurrences !== operation.expectedOccurrences) throw Object.assign(new Error(`替换次数不符：${operation.path}，期望 ${operation.expectedOccurrences}，实际 ${occurrences}`), { code: 'PATCH_OCCURRENCE_MISMATCH' });
      const after = operation.all === false ? before.replace(needle, String(operation.replace ?? '')) : before.split(needle).join(String(operation.replace ?? ''));
      fs.writeFileSync(file, after, 'utf8');
    } else if (operation.type === 'regex-replace') {
      const before = fs.readFileSync(file, 'utf8');
      const expression = new RegExp(String(operation.pattern || ''), String(operation.flags || 'g'));
      const matches = [...before.matchAll(new RegExp(String(operation.pattern || ''), String(operation.flags || 'g').includes('g') ? String(operation.flags || 'g') : `${String(operation.flags || '')}g`))];
      if (!matches.length) throw Object.assign(new Error(`未找到正则替换目标：${operation.path}`), { code: 'PATCH_TARGET_NOT_FOUND' });
      if (operation.expectedOccurrences && matches.length !== operation.expectedOccurrences) throw Object.assign(new Error(`正则替换次数不符：${operation.path}，期望 ${operation.expectedOccurrences}，实际 ${matches.length}`), { code: 'PATCH_OCCURRENCE_MISMATCH' });
      fs.writeFileSync(file, before.replace(expression, String(operation.replace ?? '')), 'utf8');
    } else if (operation.type === 'delete') {
      fs.rmSync(file, { force: true, recursive: true });
    } else {
      throw Object.assign(new Error(`不支持的变更类型：${operation.type}`), { code: 'PATCH_TYPE_UNSUPPORTED' });
    }
    changed.push({ path: operation.path, type: operation.type, root: fs.existsSync(file) && fs.statSync(file).isFile() ? hash([...fs.readFileSync(file)]) : null });
  }
  return { branch_id: branch.branch_id, changed, change_root: hash(changed) };
}

export function diffRealityBranch(branch) {
  const sourceFiles = scan(branch.source_path);
  const branchFiles = scan(branch.branch_path);
  branchFiles.delete('.dml-branch.json');
  const paths = [...new Set([...sourceFiles.keys(), ...branchFiles.keys()])].sort();
  const changes = [];
  for (const file of paths) {
    const source = sourceFiles.get(file);
    const candidate = branchFiles.get(file);
    if (!source && candidate) changes.push({ path: file, kind: 'added', after_root: candidate.root, bytes: candidate.bytes });
    else if (source && !candidate) changes.push({ path: file, kind: 'deleted', before_root: source.root, bytes: source.bytes });
    else if (source.root !== candidate.root) changes.push({ path: file, kind: 'modified', before_root: source.root, after_root: candidate.root, bytes: candidate.bytes });
  }
  return { branch_id: branch.branch_id, changes, diff_root: hash(changes) };
}

export function commitRealityBranch({ branch, backupRoot, allowedPaths = null }) {
  const diff = diffRealityBranch(branch);
  const backupId = id('backup', { branch: branch.branch_id, diff: diff.diff_root, at: now() });
  const backupPath = path.join(backupRoot, backupId.replace(/[:]/g, '_'));
  fs.mkdirSync(backupPath, { recursive: true });
  const committed = [];
  for (const change of diff.changes) {
    if (allowedPaths && !allowedPaths.includes(change.path)) continue;
    const source = assertInside(branch.source_path, path.join(branch.source_path, change.path));
    const candidate = assertInside(branch.branch_path, path.join(branch.branch_path, change.path));
    const backup = assertInside(backupPath, path.join(backupPath, change.path));
    if (fs.existsSync(source) && fs.statSync(source).isFile()) {
      fs.mkdirSync(path.dirname(backup), { recursive: true });
      fs.copyFileSync(source, backup);
    }
    if (change.kind === 'deleted') fs.rmSync(source, { force: true });
    else {
      fs.mkdirSync(path.dirname(source), { recursive: true });
      fs.copyFileSync(candidate, source);
    }
    committed.push(change);
  }
  const receipt = {
    format: 'dml.branch-commit-receipt.v0.2',
    branch_id: branch.branch_id,
    source_path: branch.source_path,
    backup_path: backupPath,
    committed,
    committed_at: now(),
  };
  receipt.receipt_root = hash(receipt);
  fs.writeFileSync(path.join(backupPath, 'commit-receipt.json'), `${JSON.stringify(receipt, null, 2)}\n`, 'utf8');
  return receipt;
}
