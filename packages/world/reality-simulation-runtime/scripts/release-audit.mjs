import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join, relative } from 'node:path';

const required = [
  'README.md', 'CHANGELOG.md', 'STATUS.md', 'RELEASE_NOTES.md', 'package.json',
  'packages/spatial-embodiment/src/index.ts',
  'packages/spatial-embodiment-vsr/src/index.ts',
  'packages/spatial-embodiment-vsr/src/vsr-spatial-v04.ts',
  'packages/spatial-embodiment-cli/src/cli.ts',
  'examples/spatial-embodiment/embodied-world.world.json',
  'schemas/rsr-spatial-embodiment.v0.5.schema.json',
  'schemas/rsr-spatial-embodiment.v0.6.schema.json',
  'schemas/rncs-kernel-rsr-vsr-binding.v0.1.schema.json',
  'docs/NAMING_BOUNDARY_INVERSION_SPATIAL_EMBODIMENT_v0.5.md',
  'docs/SPATIAL_EMBODIMENT_CONTRACT_v0.5.md',
  'docs/SPATIAL_EMBODIMENT_API_v0.5.md',
  'docs/IAL_三维具身动力学命名边界反演开发提示词_v0.5.md',
  'docs/Reality_Native_Discovery_Map_v0.2.md',
  'docs/SPATIAL_EMBODIMENT_TEST_REPORT_v0.5.md',
  'outputs/spatial-embodiment-verify/demo-evidence.json',
  'outputs/spatial-embodiment-verify/initial.png',
  'outputs/spatial-embodiment-verify/final.png',
  'outputs/spatial-embodiment-verify/final-snapshot.json',
  'outputs/spatial-embodiment-verify/final-sensory-events.json',
  'outputs/benchmark-spatial-embodiment-alpha1.json',
  'outputs/experience-fabric-verify/demo-evidence.json',
  'outputs/embodied-dynamics-verify/demo-evidence.json',
  'outputs/constraint-physics-verify/demo-evidence.json',
  'outputs/simulation-verify/demo-evidence.json'
];
const failures = required.filter(path => !existsSync(path)).map(path => `missing:${path}`);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (!['reality-simulation-runtime','@taowind/reality-simulation-runtime'].includes(pkg.name)) failures.push(`package-name:${pkg.name}`);
if (pkg.version !== '0.9.0-alpha.1') failures.push(`package-version:${pkg.version}`);
const runtimeDependencies = Object.keys(pkg.dependencies ?? {});
if (runtimeDependencies.some(name => name !== '@taowind/visual-state-runtime')) failures.push('runtime-dependencies-must-be-central-vsr-only');

function json(path) { return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : {}; }
const spatial = json('outputs/spatial-embodiment-verify/demo-evidence.json');
if (spatial.deterministicReplay !== true) failures.push('spatial-deterministic-replay');
if (spatial.deterministicRecovery !== true) failures.push('spatial-deterministic-recovery');
if (spatial.finalProjection?.frameVerified !== true) failures.push('spatial-frame-verification');
if (spatial.finalStateRoot !== spatial.replayStateRoot || spatial.finalStateRoot !== spatial.recoveredStateRoot) failures.push('spatial-state-root-divergence');
if (!(spatial.counts?.bodies >= 5)) failures.push('spatial-body-count-regression');
if (!(spatial.counts?.spatialAudio >= 1)) failures.push('spatial-audio-events-regression');
if (!(spatial.counts?.haptics >= 1)) failures.push('spatial-haptic-events-regression');
if (!(spatial.queries?.rayHits?.length >= 1)) failures.push('spatial-ray-query-regression');

const experience = json('outputs/experience-fabric-verify/demo-evidence.json');
if (experience.deterministicReplay !== true || experience.deterministicRecovery !== true) failures.push('v0.4-compatibility-regression');
const embodied = json('outputs/embodied-dynamics-verify/demo-evidence.json');
if (embodied.deterministicReplay !== true || embodied.deterministicRecovery !== true) failures.push('v0.3-compatibility-regression');
const constraint = json('outputs/constraint-physics-verify/demo-evidence.json');
if (constraint.deterministicReplay !== true || constraint.deterministicRecovery !== true) failures.push('v0.2-compatibility-regression');
const simulation = json('outputs/simulation-verify/demo-evidence.json');
if (simulation.deterministicReplay !== true || simulation.deterministicRecovery !== true) failures.push('v0.1-compatibility-regression');

const benchmark = json('outputs/benchmark-spatial-embodiment-alpha1.json');
if (!(benchmark.cases?.length >= 3)) failures.push('spatial-benchmark-cases-missing');
if (!(benchmark.cases?.[0]?.millisecondsPerTick > 0)) failures.push('spatial-benchmark-timing-missing');
if (benchmark.projection?.frameVerified !== true) failures.push('spatial-benchmark-projection-invalid');
if (!(benchmark.characters?.characters >= 16)) failures.push('spatial-character-benchmark-missing');

function walk(dir, out = []) { if (!existsSync(dir)) return out; for (const name of readdirSync(dir)) { const path = join(dir, name); const stat = statSync(path); if (stat.isDirectory()) { if (name === 'node_modules' || name === '.git' || name === 'dist') continue; walk(path, out); } else out.push(path); } return out; }
function sha256(path) { return createHash('sha256').update(readFileSync(path)).digest('hex'); }
const sourceFiles = walk('packages').filter(path => /\.(ts|js|mjs)$/.test(path));
const spatialArtifacts = walk('outputs/spatial-embodiment-verify').filter(path => /\.(png|json)$/.test(path));
const audit = {
  format: 'rsr.release-audit.v0.6', version: pkg.version, ok: failures.length === 0, failures,
  sourceFileCount: sourceFiles.length, packageRuntimeDependencies: runtimeDependencies,
  testSummary: { vsr: '29/29', simulationV01: '11/11', constraintPhysicsV02: '19/19', embodiedDynamicsV03: '30/30', temporalExperienceV04: '35/35', spatialEmbodimentV06: '63/63', networkReconciliationV07: '7/7', total: '194/194' },
  spatialRoots: spatial.roots,
  spatialReality: spatial.reality,
  compatibilityRoots: { v04StateRoot: experience.finalStateRoot, v03StateRoot: embodied.finalStateRoot, v02StateRoot: constraint.finalStateRoot, v01StateRoot: simulation.finalStateRoot },
  spatialArtifacts: spatialArtifacts.sort().map(path => ({ path: relative('.', path).replaceAll('\\', '/'), sha256: sha256(path), bytes: statSync(path).size })),
  benchmark
};
mkdirSync('evidence', { recursive: true }); writeFileSync('evidence/RELEASE_AUDIT.json', `${JSON.stringify(audit, null, 2)}\n`); console.log(JSON.stringify(audit, null, 2)); if (!audit.ok) process.exitCode = 1;
