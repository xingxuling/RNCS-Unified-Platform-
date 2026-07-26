#!/usr/bin/env node
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const RCL_ROOT = path.join(
  ROOT,
  'packages',
  'languages',
  'reality-computation-language',
);
const RECEIPT_PATH = path.join(
  RCL_ROOT,
  'FOUNDATION-NATIVE-BRIDGE-SOURCE.json',
);
const EXPECTED_COMMIT = '78b2c351b90f4971bcdb4db3308e9fd6aee5a7c4';
const EXPECTED_SCOPE_ROOT =
  '71b4bbbe5b4af46c9ed97e59d5a22576333fbc32852807beccdaf322ae4aa94e';

function sha256(value) {
  return crypto.createHash('sha256').update(value).digest('hex');
}

function scopedBytes(relativePath) {
  const resolved = path.resolve(RCL_ROOT, relativePath);
  if (
    resolved !== RCL_ROOT
    && !resolved.startsWith(`${RCL_ROOT}${path.sep}`)
  ) {
    throw new Error(`RCL_SOURCE_SCOPE_PATH_ESCAPE:${relativePath}`);
  }
  const bytes = fs.readFileSync(resolved);
  return relativePath.endsWith('.exe')
    ? bytes
    : Buffer.from(bytes.toString('utf8').replaceAll('\r\n', '\n'));
}

const receipt = JSON.parse(fs.readFileSync(RECEIPT_PATH, 'utf8'));
const problems = [];
const files = Array.isArray(receipt.synchronizedFiles)
  ? receipt.synchronizedFiles
  : [];
const sortedFiles = [...files].sort();
if (receipt.format !== 'taowind.rcl-downstream-source-receipt.v0.2') {
  problems.push('receipt format');
}
if (receipt.canonicalCommit !== EXPECTED_COMMIT) {
  problems.push('canonical commit');
}
if (receipt.scopeRoot !== EXPECTED_SCOPE_ROOT) {
  problems.push('declared scope root');
}
if (
  new Set(files).size !== files.length
  || JSON.stringify(files) !== JSON.stringify(sortedFiles)
) {
  problems.push('synchronized file order or uniqueness');
}
const fileHashKeys = Object.keys(receipt.fileSha256 ?? {}).sort();
if (JSON.stringify(fileHashKeys) !== JSON.stringify(sortedFiles)) {
  problems.push('file hash path set');
}
const scopeHash = crypto.createHash('sha256');
for (const relativePath of sortedFiles) {
  try {
    const bytes = scopedBytes(relativePath);
    const actualHash = sha256(bytes);
    if (receipt.fileSha256[relativePath] !== actualHash) {
      problems.push(`${relativePath}: sha256`);
    }
    scopeHash.update(relativePath);
    scopeHash.update('\0');
    scopeHash.update(bytes);
    scopeHash.update('\0');
  } catch (error) {
    problems.push(`${relativePath}: ${error.code ?? error.message}`);
  }
}
const actualScopeRoot = scopeHash.digest('hex');
if (actualScopeRoot !== receipt.scopeRoot) problems.push('scope root');
for (const deltaPath of receipt.downstreamDeltaFiles ?? []) {
  if (files.includes(deltaPath)) {
    problems.push(`${deltaPath}: downstream delta claimed synchronized`);
  }
}
if (
  !receipt.providerIds?.includes('rcl.foundation.batch-a')
  || !receipt.providerIds?.includes('rcl.foundation.meta-batch-b')
) {
  problems.push('provider IDs');
}

const result = {
  ok: problems.length === 0,
  canonicalRepository: receipt.canonicalRepository,
  canonicalCommit: receipt.canonicalCommit,
  synchronizedFileCount: files.length,
  scopeRoot: actualScopeRoot,
  downstreamDeltaFiles: receipt.downstreamDeltaFiles,
  problems,
};
console.log(JSON.stringify(result, null, 2));
if (!result.ok) process.exitCode = 1;
