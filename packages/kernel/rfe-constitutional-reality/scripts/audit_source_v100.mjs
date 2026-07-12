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
  'docs/C12_CONSTITUTIONAL_REALITY_CONTRACT.md',
  'docs/RFE_v1.0.0_RELEASE_NOTES.md',
  'conformance/vectors/index.json',
  'conformance/vectors/c12-constitutional-reality.json',
  'evidence/C12_RESULT_v1.0.0.json',
  'evidence/JS_TEST_TAP_v1.0.0.txt',
  'evidence/BENCHMARK_JS_v1.0.0.json',
  'evidence/VECTOR_VERIFICATION_v1.0.0.json',
  'evidence/NATIVE_VALIDATION_PROVENANCE_v1.0.0.txt',
  'reference-js/src/constitutional-reality-v100.js',
  'reference-js/test/v100.test.js',
  'reference-js/examples/benchmark-constitutional-reality.js',
  'scripts/verify_constitutional_reality_vector.js',
  'crates/rfe-constitutional-reality/src/lib.rs',
  'crates/rfe-constitutional-reality/tests/c12.rs',
  'crates/rfe-constitutional-reality/examples/dump_c12.rs',
  'crates/rfe-conformance/tests/c12.rs',
  '.agents/skills/rfe-fast-evolution/SKILL.md',
];
for (const file of requiredFiles) check(`required:${file}`, exists(file));

const index = JSON.parse(read('conformance/vectors/index.json'));
const levels = Object.fromEntries(Object.entries(index.levels).map(([level, file]) => [level.toLowerCase(), JSON.parse(read(`conformance/vectors/${file}`))]));
check('index-format-v10', index.format === 'rfe.conformance.index.v10', index.format);
check('levels-c1-through-c12', Object.keys(index.levels).join(',') === Array.from({ length: 12 }, (_, i) => `C${i + 1}`).join(','), Object.keys(index.levels));
const computedVectorHash = hashValue(levels);
check('vector-hash', computedVectorHash === index.vectorHash, computedVectorHash);
const priorLevels = Object.fromEntries(Object.entries(levels).filter(([level]) => level !== 'c12'));
const priorHash = hashValue(priorLevels);
check('c1-c11-byte-frozen', priorHash === 'a2202d1070d91510abf31659957400c132b20a4f88e2acff07fd54264de0682f', priorHash);

const c12 = levels.c12;
const result = JSON.parse(read('evidence/C12_RESULT_v1.0.0.json'));
check('c12-frozen-result', JSON.stringify(c12.expected) === JSON.stringify(result));
check('c12-result-hash', result.constitutionalRealityResultHash === '4779c30f20b1868f139a516bffca52b3a4d68815db1c4b5e75a2c78bdfcb6128', result.constitutionalRealityResultHash);
check('c12-final-epoch', result.finalEpoch === 2, result.finalEpoch);
check('c12-old-quorum', result.oldAuthorizationCertificate.approvedWeight >= result.oldConfiguration.quorumWeight, result.oldAuthorizationCertificate.approvedWeight);
check('c12-new-quorum', result.newAcceptanceCertificate.acceptedWeight >= result.newConfiguration.quorumWeight, result.newAcceptanceCertificate.acceptedWeight);
check('c12-new-confirmation-quorum', result.confirmationCertificate.confirmedWeight >= result.newConfiguration.quorumWeight, result.confirmationCertificate.confirmedWeight);
check('c12-recovery-idempotent', result.activationReceipt.receiptHash === result.recoveryReplayReceipt.receiptHash, result.activationReceipt.receiptHash);
check('c12-old-epoch-rejected', result.staleEpochRejection.code === 'STALE_CONFIGURATION_EPOCH');
check('c12-removed-member-rejected', result.removedMemberRejection.code === 'REMOVED_CONSTITUTION_MEMBER');
check('c12-old-key-rejected', result.oldKeyRejection.code === 'CONFIGURATION_KEY_MISMATCH');
check('c12-no-topology-divergence', result.metrics.topologyDivergences === 0, result.metrics.topologyDivergences);

const tap = read('evidence/JS_TEST_TAP_v1.0.0.txt');
check('js-tests-41', /# tests 41\b/.test(tap));
check('js-tests-pass-41', /# pass 41\b/.test(tap));
check('js-tests-fail-0', /# fail 0\b/.test(tap));
const benchmark = JSON.parse(read('evidence/BENCHMARK_JS_v1.0.0.json'));
check('benchmark-200-iterations', benchmark.iterations === 200, benchmark.iterations);
check('benchmark-positive', benchmark.meanMilliseconds > 0 && benchmark.p95Milliseconds > 0, benchmark);
const provenance = read('evidence/NATIVE_VALIDATION_PROVENANCE_v1.0.0.txt');
check('native-status-explicit', provenance.includes('NOT_EXECUTED_IN_CURRENT_ENVIRONMENT'));
check('native-boundary-explicit', provenance.includes('not claimed as an independently executed result generator'));

const rootCargo = read('Cargo.toml');
check('workspace-version-1.0.0', /version\s*=\s*"1\.0\.0"/.test(rootCargo));
check('workspace-includes-constitutional-reality', rootCargo.includes('"crates/rfe-constitutional-reality"'));
const lock = read('Cargo.lock');
check('lock-includes-constitutional-reality', lock.includes('name = "rfe-constitutional-reality"'));
check('lock-no-old-workspace-version', !lock.includes('version = "0.9.0"'));

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
check('rust-source-present', rustFiles.length >= 20, rustFiles.length);
check('unsafe-forbidden', !/\bunsafe\b\s*\{/.test(rustText));
check('native-c12-tests-present', (read('crates/rfe-constitutional-reality/tests/c12.rs').match(/#\[test\]/g) ?? []).length >= 4);
check('native-conformance-c12-present', read('crates/rfe-conformance/tests/c12.rs').includes('c12_constitutional_reality_vector_is_native_conformant'));
check('native-result-verifier-present', read('crates/rfe-constitutional-reality/src/lib.rs').includes('pub fn verify_constitutional_result'));
check('native-durable-coordinator-present', read('crates/rfe-constitutional-reality/src/lib.rs').includes('pub struct ConstitutionalCoordinator'));

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
  format: 'rfe.source-audit.v1.0',
  status: failures.length === 0 ? 'PASS' : 'FAIL',
  nodeRuntime: process.version,
  checkedRustFiles: rustFiles.length,
  vectorHash: computedVectorHash,
  priorC1C11VectorHash: priorHash,
  c12ResultHash: result.constitutionalRealityResultHash,
  checks,
  failures,
};
fs.writeFileSync(path.join(root, 'evidence/SOURCE_AUDIT_v1.0.0.json'), `${JSON.stringify(report, null, 2)}\n`);
console.log(JSON.stringify(report, null, 2));
if (failures.length) process.exit(1);
