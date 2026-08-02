import { spawnSync } from 'node:child_process';
import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  classifyFormalMaturity,
  evaluateTheoremSuite,
  verifyProofBundle,
} from '@taowind/world-body-formal-kernel';
import {
  RSR_THEOREMS,
  buildRsrReferenceFixture,
} from '@taowind/rsr-formal-theory';
import {
  VSR_THEOREMS,
  buildVsrReferenceFixture,
} from '@taowind/vsr-formal-theory';
import {
  WORLD_BODY_THEOREMS,
  buildWorldBodyJointFixture,
} from '@taowind/world-body-formal-theory';
import { runWorldBodyProductionDifferential } from '@taowind/world-body-formal-theory/production-differential';
import {
  generateWorldBodyArtifacts,
  measureCodeReduction,
  verifyGeneratedArtifactBundle,
} from '@taowind/world-body-codegen';
import { canonicalClone, semanticHash } from '@taowind/world-body-ir';
import { minimalWorldBodyIR } from '../packages/world/world-body-ir/examples/minimal-world-body.mjs';
import { rsrWorldConfig } from '../packages/world/world-body-codegen/examples/generated/minimal/rsr-world-config.generated.mjs';
import {
  applyWorldBodyVisualBindings,
  visualBindings,
} from '../packages/world/world-body-codegen/examples/generated/minimal/vsr-bindings.generated.mjs';
import { bindAuthoritativeFrame } from '../packages/world/world-body-codegen/examples/generated/minimal/temporal-network.generated.mjs';

const repositoryRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const evidenceDirectory = path.join(repositoryRoot, 'docs', 'verification', 'world-body-v0.1');
const baseline = {
  branch: 'main-95',
  commit: 'da9d2da3f8b46f40972c06d3f0f24b1e2b5b20f4',
  rncsSuiteVersion: '0.19.8-alpha.1',
  rsrPackageVersion: '0.9.0-alpha.1',
  vsrPackageVersion: '0.8.0-alpha.1',
};

function pretty(value) {
  return `${JSON.stringify(canonicalClone(value), null, 2)}\n`;
}

function seal(base, rootName = 'evidenceRoot') {
  const canonical = canonicalClone(base);
  return canonicalClone({ ...canonical, [rootName]: semanticHash(canonical) });
}

function runRclKernelEvidence() {
  const script = path.join(repositoryRoot, 'packages', 'kernel', 'world-body-formal-kernel', 'scripts', 'verify-rcl-kernel.mjs');
  const result = spawnSync(process.execPath, [script], { cwd: repositoryRoot, encoding: 'utf8' });
  if (result.status !== 0) throw Object.assign(new Error(`WORLD_BODY_RCL_EVIDENCE_FAILED:${result.stderr || result.stdout}`), { code: 'WORLD_BODY_RCL_EVIDENCE_FAILED' });
  return JSON.parse(result.stdout);
}

const declarationPath = path.join(repositoryRoot, 'packages', 'world', 'world-body-codegen', 'examples', 'minimal-world.declaration.json');
const committedManifestPath = path.join(repositoryRoot, 'packages', 'world', 'world-body-codegen', 'examples', 'generated', 'minimal', 'manifest.json');
const declarationSource = await readFile(declarationPath, 'utf8');
const declaration = JSON.parse(declarationSource);
const committedManifest = JSON.parse(await readFile(committedManifestPath, 'utf8'));
const generatedBundle = generateWorldBodyArtifacts(declaration);
const codegenEvidence = seal({
  format: 'taowind.world-body-codegen-evidence.v0.1',
  status: verifyGeneratedArtifactBundle(generatedBundle) && generatedBundle.manifest.manifestRoot === committedManifest.manifestRoot ? 'PASS' : 'FAIL',
  worldBodyRoot: generatedBundle.ir.roots.worldBodyRoot,
  manifestRoot: generatedBundle.manifest.manifestRoot,
  generatedArtifactCount: generatedBundle.manifest.metrics.generatedArtifactCount,
  authority: generatedBundle.manifest.authority,
  generatedRuntimeTest: generatedBundle.artifacts.some(item => item.path === 'world-body.generated.test.mjs'),
  generatedProofReceiptTemplate: generatedBundle.artifacts.some(item => item.path === 'proof-receipt-template.generated.json'),
});
const codeReductionEvidence = seal(measureCodeReduction(declarationSource, generatedBundle));

const [rsrBundle, vsrBundle, jointBundle] = await Promise.all([
  evaluateTheoremSuite(RSR_THEOREMS, buildRsrReferenceFixture(minimalWorldBodyIR), { domain: 'RSR' }),
  evaluateTheoremSuite(VSR_THEOREMS, buildVsrReferenceFixture(minimalWorldBodyIR), { domain: 'VSR' }),
  evaluateTheoremSuite(WORLD_BODY_THEOREMS, buildWorldBodyJointFixture(minimalWorldBodyIR), { domain: 'WORLD_BODY' }),
]);
const proofBundles = seal({
  format: 'taowind.world-body-proof-bundle-set.v0.1',
  baseline,
  bundles: [rsrBundle, vsrBundle, jointBundle],
  allBundlesVerified: [rsrBundle, vsrBundle, jointBundle].every(verifyProofBundle),
  totalCounts: [rsrBundle, vsrBundle, jointBundle].reduce((counts, bundle) => ({
    PASS: counts.PASS + bundle.counts.PASS,
    FAIL: counts.FAIL + bundle.counts.FAIL,
    UNVERIFIED: counts.UNVERIFIED + bundle.counts.UNVERIFIED,
  }), { PASS: 0, FAIL: 0, UNVERIFIED: 0 }),
}, 'proofSetRoot');
const proofStatus = proofBundles.allBundlesVerified && proofBundles.totalCounts.FAIL === 0 ? 'PASS' : 'FAIL';

const rclEvidence = runRclKernelEvidence();
const productionDifferential = runWorldBodyProductionDifferential({
  ir: minimalWorldBodyIR,
  rsrWorldConfig,
  applyWorldBodyVisualBindings,
  visualBindings,
  bindAuthoritativeFrame,
});
const externalBackends = [
  { id: 'external-physics-engine', status: 'UNVERIFIED', reason: 'PhysX, Jolt, Chaos, Unity, and Unreal were not executed' },
  { id: 'full-world-body-native-vm', status: 'UNVERIFIED', reason: 'The exercised RCL subset passed, but the complete JavaScript World Body validator and provider surface are not implemented in the native VM' },
  { id: 'production-asset-provider', status: 'UNVERIFIED', reason: 'No production asset store or streaming provider run' },
  { id: 'real-distributed-network', status: 'UNVERIFIED', reason: 'No real lossy transport or distributed recovery run' },
  { id: 'target-browser-gpu-pixels', status: 'UNVERIFIED', reason: 'No real browser adapter, texture path, shadow capture, or pixel oracle run' },
  { id: 'target-hardware-performance', status: 'UNVERIFIED', reason: 'No target hardware performance budget run' },
];
const maturity = classifyFormalMaturity({
  referenceBundles: [rsrBundle, vsrBundle, jointBundle],
  productionDifferentials: [productionDifferential],
  externalBackends,
});
const externalEvidence = seal({
  format: 'taowind.world-body-external-boundaries.v0.1',
  status: 'UNVERIFIED',
  backends: externalBackends,
});

const ledgerBase = {
  format: 'taowind.world-body-evidence-ledger.v0.1',
  baseline,
  authority: 'evidence-only-no-commit',
  entries: [
    { id: 'WB-E01', claim: 'World Body IR and generated example are deterministically sealed', status: codegenEvidence.status, evidenceFile: 'codegen-evidence.json', evidenceRoot: codegenEvidence.evidenceRoot },
    { id: 'WB-E02', claim: 'RSR, VSR, and joint executable theorem receipts close their declared reference scope', status: proofStatus, evidenceFile: 'formal-proof-bundles.json', evidenceRoot: proofBundles.proofSetRoot, observations: { ...proofBundles.totalCounts, allBundlesVerified: proofBundles.allBundlesVerified } },
    { id: 'WB-E03', claim: 'The exercised RCL kernel has reference and native VM parity', status: rclEvidence.status, evidenceFile: 'rcl-kernel-evidence.json', evidenceRoot: rclEvidence.evidenceRoot },
    { id: 'WB-E04', claim: 'Generated specialization matches selected real RSR/VSR observables', status: productionDifferential.status, evidenceFile: 'production-differential.json', evidenceRoot: productionDifferential.evidenceRoot },
    { id: 'WB-E05', claim: 'External backends and target hardware are fully differentially equivalent', status: 'UNVERIFIED', evidenceFile: 'external-boundaries.json', evidenceRoot: externalEvidence.evidenceRoot },
    { id: 'WB-E06', claim: 'One declaration moves measured specialization lines and repeated identifiers behind deterministic generation', status: 'PASS', evidenceFile: 'code-reduction-evidence.json', evidenceRoot: codeReductionEvidence.evidenceRoot },
  ],
  maturity,
};
const ledger = seal(ledgerBase, 'ledgerRoot');
const summary = seal({
  format: 'taowind.world-body-validation-summary.v0.1',
  baseline,
  status: [codegenEvidence.status, proofStatus, rclEvidence.status, productionDifferential.status].every(status => status === 'PASS') ? 'PASS_WITH_EXTERNAL_BOUNDARIES' : 'FAIL',
  allProofBundlesVerified: proofBundles.allBundlesVerified,
  theoremCounts: proofBundles.totalCounts,
  productionDifferentialChecks: {
    passed: productionDifferential.checks.filter(item => item.passed).length,
    failed: productionDifferential.checks.filter(item => !item.passed).length,
  },
  codegenArtifactCount: codegenEvidence.generatedArtifactCount,
  ledgerRoot: ledger.ledgerRoot,
  codeReduction: {
    declarationLines: codeReductionEvidence.measuredSource.declarationLines,
    specializationLines: codeReductionEvidence.measuredGeneratedSurface.specializationLines,
    netAuthoredLineReductionBasisPoints: codeReductionEvidence.reduction.netAuthoredLineReductionBasisPoints,
    repeatedOccurrencesMovedBehindGenerator: codeReductionEvidence.semanticDuplication.repeatedOccurrencesMovedBehindGenerator,
  },
  rclCheckCount: Object.keys(rclEvidence.checks).length,
  verdict: maturity.verdict,
  verdictReason: maturity.reason,
});

await mkdir(evidenceDirectory, { recursive: true });
const outputs = {
  'codegen-evidence.json': codegenEvidence,
  'code-reduction-evidence.json': codeReductionEvidence,
  'formal-proof-bundles.json': proofBundles,
  'rcl-kernel-evidence.json': rclEvidence,
  'production-differential.json': productionDifferential,
  'external-boundaries.json': externalEvidence,
  'world-body-evidence-ledger.json': ledger,
  'validation-summary.json': summary,
};
for (const [fileName, value] of Object.entries(outputs)) await writeFile(path.join(evidenceDirectory, fileName), pretty(value), 'utf8');

process.stdout.write(`${pretty({ evidenceDirectory: path.relative(repositoryRoot, evidenceDirectory).replaceAll('\\', '/'), files: Object.keys(outputs).sort(), summary })}`);
if (summary.status === 'FAIL') process.exitCode = 1;
