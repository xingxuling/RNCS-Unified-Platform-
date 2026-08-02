import { readFileSync } from 'node:fs';
import { compileReality, RCL_LANGUAGE_VERSION, runReality, verifyNativeParity } from '@taowind/reality-computation-language';
import { semanticHash } from '@taowind/world-body-ir';

const sourceUrl = new URL('../rcl/world-body-formal-kernel.rcl', import.meta.url);
const source = readFileSync(sourceUrl, 'utf8');
const program = compileReality(source);
const reference = await runReality(program);
const parity = await verifyNativeParity(source);

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
};

const base = {
  format: 'taowind.world-body-rcl-kernel-evidence.v0.1',
  packageVersion: '0.1.0-alpha.1',
  rclLanguageVersion: RCL_LANGUAGE_VERSION,
  sourceRoot: semanticHash(source),
  programName: program.name,
  referenceStateRoot: reference.stateRoot,
  nativeStateRoot: parity.native.stateRoot,
  nativeStateRootAlgorithm: parity.native.stateRootAlgorithm,
  checks,
  status: Object.values(checks).every(Boolean) ? 'PASS' : 'FAIL',
  scope: 'RCL source compile plus reference/native execution parity for the exercised WorldBodyFormalKernel subset',
  limitations: [
    'Does not prove the JavaScript World Body validator is implemented inside RCL.',
    'Does not prove unexecuted GPU, VM Provider, physics backend, network, database, filesystem, or device behavior.',
    'Preserves RNCS authority outside this verification kernel.',
  ],
};

const report = { ...base, evidenceRoot: semanticHash(base) };
process.stdout.write(`${JSON.stringify(report, null, 2)}\n`);
if (report.status !== 'PASS') process.exitCode = 1;
