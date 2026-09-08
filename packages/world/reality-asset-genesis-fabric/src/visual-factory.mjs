import {clone, GenesisError, rootHash, seal, verifySeal} from './canonical.mjs';
import {createAssetGenerationJob, transitionAssetGenerationJob, failAssetGenerationJob} from './asset-provider-contract.mjs';
import {validateVisualCapabilityProfile, VISUAL_OPERATIONS} from './visual-capability-profile.mjs';
import {validateVisualIR, verifyVisualArtifacts} from './visual-ir.mjs';
import {createRepresentationRef} from '@taowind/rncs-core-contract';
const fail = (ok, code) => { if (!ok) throw new GenesisError(code); };
const FORMAT = 'ragf.visual-ir.v0.1';

export function planVisualFactory(input, providers, operations) {
  fail(validateVisualIR(input).valid, 'VISUAL_INPUT_INVALID');
  fail(Array.isArray(operations) && operations.length > 0 && operations.length <= 32 && operations.every(v => VISUAL_OPERATIONS.includes(v)), 'VISUAL_PLAN_OPERATIONS');
  fail(Array.isArray(providers) && providers.length > 0, 'VISUAL_PROVIDERS_REQUIRED');
  const ids = new Set();
  for (const {manifest, profile} of providers) {
    fail(validateVisualCapabilityProfile(profile, manifest).valid, 'VISUAL_PROFILE_INVALID');
    fail(!ids.has(manifest.id), 'VISUAL_PROVIDER_DUPLICATE'); ids.add(manifest.id);
  }
  const sorted = clone(providers).sort((a, b) => Buffer.compare(Buffer.from(a.manifest.id), Buffer.from(b.manifest.id)));
  const stages = operations.map((operation, index) => {
    const provider = sorted.find(({profile}) => profile.operations.some(op => op.operation === operation && op.representation_kinds.includes(input.representation_kind) && op.input_formats.includes(FORMAT) && op.output_formats.includes(FORMAT)));
    fail(provider, 'VISUAL_CAPABILITY_GAP:' + operation);
    return {index, operation, provider_id: provider.manifest.id, provider_manifest_root: provider.manifest.manifest_root, profile_root: provider.profile.profile_root};
  });
  return seal({format: 'ragf.visual-factory-plan.v0.1', candidate_only: true, input: clone(input), providers: sorted, operations: clone(operations), stages,
    bridges: {rncs: 'RAGF_EXECUTOR', rcl: 'OPTIONAL_HOST_CALL_WRAPPER', dwac: 'OPTIONAL_LOCAL_VERIFICATION_SIDECAR', opp6: 'RCP_RXP_EXPORT_ADAPTER'}}, 'plan_root');
}

async function invoke(adapter, request, timeoutMs, signal) {
  fail(!signal?.aborted, 'VISUAL_EXECUTION_ABORTED');
  const controller = new AbortController();
  let timer, onAbort;
  try {
    return await Promise.race([
      Promise.resolve().then(() => { fail(!controller.signal.aborted, 'VISUAL_EXECUTION_ABORTED'); return adapter(clone(request), {signal: controller.signal}); }),
      new Promise((_, reject) => { onAbort = () => { controller.abort(); reject(new GenesisError('VISUAL_EXECUTION_ABORTED')); }; signal?.addEventListener('abort', onAbort, {once:true}); if(signal?.aborted) onAbort(); }),
      new Promise((_, reject) => { timer = setTimeout(() => { controller.abort(); reject(new GenesisError('VISUAL_PROVIDER_TIMEOUT')); }, timeoutMs); })
    ]);
  } finally { clearTimeout(timer); if(onAbort) signal?.removeEventListener('abort', onAbort); }
}

// Adapters are supplied by the host. A profile never grants execution or commit authority.
export async function executeVisualFactory(plan, adapters, {timeoutMs = 30000, replay = true, signal} = {}) {
  plan = clone(plan);
  adapters = {...adapters};
  fail(Number.isSafeInteger(timeoutMs) && timeoutMs > 0 && timeoutMs <= 300000, 'VISUAL_TIMEOUT_INVALID');
  fail(typeof replay === 'boolean', 'VISUAL_REPLAY_INVALID');
  fail(verifySeal(plan, 'plan_root'), 'VISUAL_PLAN_ROOT');
  fail(planVisualFactory(plan.input, plan.providers, plan.operations).plan_root === plan.plan_root, 'VISUAL_PLAN_INVALID');
  const receipts = [];
  let current = clone(plan.input);
  for (const stage of plan.stages) {
    const {manifest, profile} = plan.providers.find(p => p.manifest.id === stage.provider_id);
    const adapter = adapters[stage.provider_id];
    let job = createAssetGenerationJob({job_id: 'visual-job:' + rootHash({plan_root: plan.plan_root, stage: stage.index, input_root: current.visual_ir_root}), provider: manifest, asset_id: current.character_id, operation: stage.operation, seed: current.provenance.seed, request: {plan_root: plan.plan_root, stage: stage.index, input_root: current.visual_ir_root}});
    try {
      fail(!signal?.aborted, 'VISUAL_EXECUTION_ABORTED');
      fail(typeof adapter === 'function', 'VISUAL_ADAPTER_UNAVAILABLE');
      job = transitionAssetGenerationJob(job, 'PREPARING');
      job = transitionAssetGenerationJob(job, 'RUNNING');
      const request = {operation: stage.operation, job: clone(job), input: current};
      const verify = result => {
        fail(validateVisualIR(result?.ir).valid, 'VISUAL_OUTPUT_INVALID');
        fail(result.ir.character_id === plan.input.character_id && result.ir.identity_root === plan.input.identity_root, 'VISUAL_IDENTITY_DRIFT');
        fail(result.ir.representation_kind === plan.input.representation_kind, 'VISUAL_REPRESENTATION_DRIFT');
        fail(result.ir.provenance.seed === current.provenance.seed && result.ir.provenance.generator === manifest.id && result.ir.provenance.version === manifest.version, 'VISUAL_PROVENANCE_BINDING');
        const evidence = verifyVisualArtifacts(result.ir, result.artifacts);
        fail(evidence.valid, 'VISUAL_ARTIFACT_INVALID');
        return evidence;
      };
      const result = clone(await invoke(adapter, request, timeoutMs, signal));
      const evidence = verify(result);
      job = transitionAssetGenerationJob(job, 'VALIDATING');
      let reproducibility = 'NOT_RUN';
      if (replay) {
        const again = clone(await invoke(adapter, request, timeoutMs, signal));
        verify(again);
        fail(result.ir.visual_ir_root === again.ir.visual_ir_root, 'VISUAL_REPLAY_MISMATCH');
        reproducibility = 'LOCAL_REPLAY_MATCH';
      }
      const outputRoot = result.ir.visual_ir_root;
      job = transitionAssetGenerationJob(job, 'COMPLETED', {output_root: outputRoot});
      job = seal({...job, result_root: outputRoot, evidence_root: rootHash(evidence)}, 'job_root');
      const representation_ref = createRepresentationRef({provider_id: manifest.id, provider_root: manifest.manifest_root,
        representation_kind: result.ir.representation_kind, representation_formats: [FORMAT], content_root: outputRoot,
        availability: 'EXECUTED', representation_profile: {profile_id: profile.profile_root, formats: [FORMAT]},
        evidence: {provider_manifest_root: manifest.manifest_root, provider_result_root: outputRoot, notes: 'Local adapter output; visual acceptance not evaluated'}});
      receipts.push(seal({stage, job, representation_ref, input_root: current.visual_ir_root, output_root: outputRoot, evidence, reproducibility,
        deterministic_declared: profile.operations.find(op => op.operation === stage.operation).deterministic}, 'receipt_root'));
      current = clone(result.ir);
    } catch (error) {
      receipts.push(seal({stage, job: failAssetGenerationJob(job, {code: error.code ?? 'VISUAL_PROVIDER_ERROR'}), input_root: current.visual_ir_root}, 'receipt_root'));
      return seal({format: 'ragf.visual-factory-result.v0.1', status: 'FAILED', candidate_only: true, commit_status: 'NOT_COMMITTED', plan_root: plan.plan_root, receipts, error: error.code ?? 'VISUAL_PROVIDER_ERROR'}, 'result_root');
    }
  }
  return seal({format: 'ragf.visual-factory-result.v0.1', status: 'LOCAL_CANDIDATE_EXECUTED', candidate_only: true, commit_status: 'NOT_COMMITTED', plan_root: plan.plan_root, receipts, output: current,
    visual_acceptance: 'NOT_EVALUATED', bridges: clone(plan.bridges)}, 'result_root');
}
