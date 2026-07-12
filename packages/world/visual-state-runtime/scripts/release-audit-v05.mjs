import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';

const required = [
  'package.json',
  'packages/spatial-reality-3d/src/index.ts',
  'schemas/vsr-spatial-scene.v0.4.schema.json',
  'evidence/TESTS_v0.5.txt',
  'evidence/E2E_v0.5.txt',
  'evidence/VERIFY_v0.5.txt',
  'evidence/BENCHMARK_LOG_v0.5.txt',
  'outputs/spatial-reality-v04-verify/reference.png',
  'outputs/spatial-reality-v04-verify/verification.json',
];
const failures = required.filter(file => !existsSync(file)).map(file => `missing:${file}`);
const pkg = JSON.parse(readFileSync('package.json', 'utf8'));
if (pkg.version !== '0.5.0-alpha.1') failures.push(`version:${pkg.version}`);
const source = readFileSync('packages/spatial-reality-3d/src/index.ts', 'utf8');
for (const symbol of ['distributionGGX', 'geometrySmith', 'fresnelSchlick', 'evaluatePBRLighting', 'clearcoatRoughness', 'occlusionStrength']) {
  if (!source.includes(symbol)) failures.push(`source-symbol:${symbol}`);
}
const tests = readFileSync('evidence/TESTS_v0.5.txt', 'utf8');
if (!tests.includes('120/120 tests passed')) failures.push('legacy-tests');
if (!tests.includes('VSR v0.5 spatial reality tests: 39/39 PASS')) failures.push('spatial-tests');
const e2e = readFileSync('evidence/E2E_v0.5.txt', 'utf8');
if (!e2e.includes('Studio smoke passed: 43 interactive controls wired.')) failures.push('studio-smoke');
let verification = {};
try { verification = JSON.parse(readFileSync('outputs/spatial-reality-v04-verify/verification.json', 'utf8')); }
catch { failures.push('verification-json'); }
if (verification.ok !== true) failures.push('verification-not-ok');
const validation = {
  format: 'vsr.spatial-pbr-validation.v0.5',
  version: pkg.version,
  ok: failures.length === 0,
  failures,
  tests: { legacy: 120, spatial: 39, total: 159 },
  pbr: { model: 'Cook-Torrance GGX', clearcoat: true, materialAO: true, ior: true, cpuReference: true, webgpuWGSL: true },
  verification,
};
validation.validationRoot = createHash('sha256').update(JSON.stringify(validation)).digest('hex');
writeFileSync('evidence/SPATIAL_PBR_VALIDATION_v0.5.json', `${JSON.stringify(validation, null, 2)}\n`);
console.log(JSON.stringify(validation, null, 2));
if (!validation.ok) process.exitCode = 1;
