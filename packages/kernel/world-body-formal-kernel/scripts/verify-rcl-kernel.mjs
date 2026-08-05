import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import {
  compileReality,
  compileRealityToBytecode,
  decodeBytecode,
  RCL_LANGUAGE_VERSION,
  runReality,
  verifyNativeParity,
} from '@taowind/reality-computation-language';
import { semanticHash } from '@taowind/world-body-ir';

const draftSpecs = [
  ['world-body-ir.rcl', 'WorldBodyIrDraft'],
  ['rsr-spatial-state.rcl', 'RsrSpatialStateDraft'],
  ['rsr-contact-constraint.rcl', 'RsrContactConstraintDraft'],
  ['rsr-authority-replay.rcl', 'RsrAuthorityReplayDraft'],
  ['vsr-authority-projection.rcl', 'VsrAuthorityProjectionDraft'],
  ['vsr-temporal-presentation.rcl', 'VsrTemporalPresentationDraft'],
  ['vsr-render-graph.rcl', 'VsrRenderGraphDraft'],
  ['world-body-closure.rcl', 'WorldBodyClosureDraft'],
];

function sha256(value) {
  return createHash('sha256').update(value).digest('hex');
}

function disassemblySummary(decoded) {
  return decoded.instructions.map(instruction => `${instruction.index}:${instruction.name}:${instruction.a}:${instruction.b}:${instruction.c}`);
}

async function verifySource(fileName, expectedProgramName) {
  const sourceUrl = new URL(`../rcl/${fileName}`, import.meta.url);
  const source = readFileSync(sourceUrl, 'utf8');
  const program = compileReality(source);
  const bytecode = Buffer.from(compileRealityToBytecode(source));
  const decoded = decodeBytecode(bytecode);
  const reference = await runReality(program);
  const parity = await verifyNativeParity(source);
  const base = {
    file: fileName,
    expectedProgramName,
    programName: program.name,
    sourceSha256: sha256(source),
    rbcSha256: sha256(bytecode),
    rbcBytes: bytecode.length,
    bytecodeVersion: `${decoded.version.major}.${decoded.version.minor}`,
    decodedProgramName: decoded.program,
    instructionCount: decoded.instructions.length,
    disassembly: disassemblySummary(decoded),
    referenceStateRoot: reference.stateRoot,
    nativeStateRoot: parity.native.stateRoot,
    nativeStateRootAlgorithm: parity.native.stateRootAlgorithm,
    checks: {
      programNameMatches: program.name === expectedProgramName,
      decodedProgramMatches: decoded.program === expectedProgramName,
      bytecodeDecoded: decoded.instructions.length > 0,
      nativeReferenceParity: parity.ok === true,
      nativeStateRootVerified: parity.native.stateRootVerified === true,
      candidateStatusPreserved: reference.state['draft.status'] === 'candidate' && parity.native.state['draft.status'] === 'candidate',
    },
  };
  return { ...base, status: Object.values(base.checks).every(Boolean) ? 'PASS' : 'FAIL' };
}

const sourceUrl = new URL('../rcl/world-body-formal-kernel.rcl', import.meta.url);
const source = readFileSync(sourceUrl, 'utf8');
const program = compileReality(source);
const bytecode = Buffer.from(compileRealityToBytecode(source));
const decoded = decodeBytecode(bytecode);
const reference = await runReality(program);
const parity = await verifyNativeParity(source);
const drafts = [];
for (const [fileName, expectedProgramName] of draftSpecs) drafts.push(await verifySource(fileName, expectedProgramName));

const checks = {
  sourceIsRclReality: program?.name === 'WorldBodyFormalKernel',
  referenceKernelVerified: reference.state['kernel.status'] === 'reference-verified',
  referenceCheckExecutedOnce: reference.state['kernel.reference_checks'] === 1,
  referenceAuthorityPreserved: reference.state['authority.owned_by_rncs'] === true,
  referenceCandidateBoundaryPreserved: reference.state['codegen.candidate_only'] === true,
  externalBoundaryPreserved: reference.state['backend.external_unverified'] === true,
  nativeReferenceParity: parity.ok === true,
  nativeStateRootVerified: parity.native.stateRootVerified === true,
  nativeAuthorityPreserved: parity.native.state['authority.owned_by_rncs'] === true,
  nativeCandidateBoundaryPreserved: parity.native.state['codegen.candidate_only'] === true,
  aggregateRbcDecoded: decoded.program === program.name && decoded.instructions.length > 0,
  aggregateDisassemblyRecorded: disassemblySummary(decoded).length === decoded.instructions.length,
  requestedDraftSetComplete: drafts.length === draftSpecs.length,
  allDraftsCompileAndDecode: drafts.every(draft => draft.checks.programNameMatches && draft.checks.decodedProgramMatches && draft.checks.bytecodeDecoded),
  allDraftsNativeReferenceParity: drafts.every(draft => draft.checks.nativeReferenceParity && draft.checks.nativeStateRootVerified),
};

const base = {
  format: 'taowind.world-body-rcl-kernel-evidence.v0.1',
  packageVersion: '0.1.0-alpha.1',
  rclLanguageVersion: RCL_LANGUAGE_VERSION,
  sourceRoot: semanticHash(source),
  sourceSha256: sha256(source),
  rbcSha256: sha256(bytecode),
  rbcBytes: bytecode.length,
  bytecodeVersion: `${decoded.version.major}.${decoded.version.minor}`,
  disassembly: disassemblySummary(decoded),
  programName: program.name,
  referenceStateRoot: reference.stateRoot,
  nativeStateRoot: parity.native.stateRoot,
  nativeStateRootAlgorithm: parity.native.stateRootAlgorithm,
  draftSuiteRoot: semanticHash(drafts),
  drafts,
  checks,
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
  scope: 'aggregate RCL kernel plus eight requested formal drafts compiled to RBC, decoded, and executed with reference/native state-root parity',
  limitations: [
    'Does not prove the JavaScript World Body validator is implemented inside RCL.',
    'The drafts encode the bounded boolean subset supported by current RCL; quantified mathematics and graph proofs remain in the executable reference layer.',
    'Does not prove unexecuted GPU, VM Provider, physics backend, network, database, filesystem, or device behavior.',
    'Preserves RNCS authority outside this verification kernel.',
  ],
};

const report = { ...base, evidenceRoot: semanticHash(base) };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'PASS') process.exitCode = 1;
