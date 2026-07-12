import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { hash as hashValue } from '../reference-js/src/replicated-authority-v050.js';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const failures = [];
const checks = [];
const check = (name, condition, detail = null) => {
  checks.push({ name, status: condition ? 'PASS' : 'FAIL', detail });
  if (!condition) failures.push(name);
};
const read = (relative) => fs.readFileSync(path.join(root, relative), 'utf8');
const exists = (relative) => fs.existsSync(path.join(root, relative));

const requiredFiles = [
  'README.md',
  'CHANGELOG.md',
  'docs/C11_PARTITION_HEALING_CONTRACT.md',
  'conformance/vectors/index.json',
  'conformance/vectors/c11-partition-healing-reality.json',
  'evidence/C11_RESULT_v0.9.0.json',
  'reference-js/src/partition-healing-reality-v090.js',
  'reference-js/test/v090.test.js',
  'crates/rfe-partition-healing/src/lib.rs',
  'crates/rfe-partition-healing/tests/c11.rs',
  'crates/rfe-conformance/tests/c11.rs',
];
for (const file of requiredFiles) check(`required:${file}`, exists(file));

const index = JSON.parse(read('conformance/vectors/index.json'));
const levels = Object.fromEntries(Object.entries(index.levels).map(([level, file]) => [level.toLowerCase(), JSON.parse(read(`conformance/vectors/${file}`))]));
check('index-format-v9', index.format === 'rfe.conformance.index.v9', index.format);
check('levels-c1-through-c11', Object.keys(index.levels).join(',') === Array.from({ length: 11 }, (_, i) => `C${i + 1}`).join(','), Object.keys(index.levels));
const computedVectorHash = hashValue(levels);
check('vector-hash', computedVectorHash === index.vectorHash, computedVectorHash);

const c11 = levels.c11;
const result = JSON.parse(read('evidence/C11_RESULT_v0.9.0.json'));
check('c11-frozen-result', JSON.stringify(c11.expected) === JSON.stringify(result));
check('c11-result-hash', result.partitionHealingRealityResultHash === '0b8400004dcb598a5576b344f84586e433013284f3104ed8e574f027423ffc04', result.partitionHealingRealityResultHash);
check('c11-final-view', result.finalView === 2, result.finalView);
check('c11-recovery-idempotent', result.commitReceipt.receiptHash === result.recoveryReplayReceipt.receiptHash, result.commitReceipt.receiptHash);
check('c11-no-divergence', result.metrics.federationRootDivergences === 0, result.metrics.federationRootDivergences);

const rootCargo = read('Cargo.toml');
check('workspace-version-0.9.0', /version\s*=\s*"0\.9\.0"/.test(rootCargo));
check('workspace-includes-partition-healing', rootCargo.includes('"crates/rfe-partition-healing"'));
const rustFiles = [];
const walk = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (entry.name.endsWith('.rs')) rustFiles.push(absolute);
  }
};
walk(path.join(root, 'crates'));
const rustText = rustFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n');
check('rust-source-present', rustFiles.length >= 10, rustFiles.length);
check('unsafe-forbidden', !/\bunsafe\b\s*\{/.test(rustText));
check('native-c11-tests-present', (read('crates/rfe-partition-healing/tests/c11.rs').match(/#\[test\]/g) ?? []).length >= 4);
check('native-conformance-c11-present', read('crates/rfe-conformance/tests/c11.rs').includes('c11_partition_healing_reality_vector_is_native_conformant'));

const manifests = [];
const walkManifests = (directory) => {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walkManifests(absolute);
    else if (entry.name === 'Cargo.toml') manifests.push(absolute);
  }
};
walkManifests(root);
const externalDependencyLines = [];
for (const manifest of manifests) {
  const lines = fs.readFileSync(manifest, 'utf8').split(/\r?\n/);
  let inDependencies = false;
  for (const line of lines) {
    if (/^\[.*dependencies.*\]$/.test(line.trim())) inDependencies = true;
    else if (/^\[/.test(line.trim())) inDependencies = false;
    else if (inDependencies && line.includes('=') && !line.includes('path =')) externalDependencyLines.push(`${path.relative(root, manifest)}:${line.trim()}`);
  }
}
check('workspace-zero-external-runtime-dependencies', externalDependencyLines.length === 0, externalDependencyLines);

const report = {
  format: 'rfe.source-audit.v0.9',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  nodeRuntime: process.version,
  checkedRustFiles: rustFiles.length,
  vectorHash: computedVectorHash,
  c11ResultHash: result.partitionHealingRealityResultHash,
  checks,
  failures,
};
fs.writeFileSync(path.join(root, 'evidence/SOURCE_AUDIT_v0.9.0.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
