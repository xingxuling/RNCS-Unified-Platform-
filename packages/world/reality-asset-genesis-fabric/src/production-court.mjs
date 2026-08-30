import {clone, GenesisError, rootHash, seal, stableId} from './canonical.mjs';
import {ASSET_PROVIDER_CONTRACT_VERSION, normalizeAssetProviderResult} from './asset-provider-contract.mjs';
import {verifyRepresentationRef} from '@taowind/rncs-core-contract';

export const ASSET_PRODUCTION_COURT_VERSION = '0.1.0';
export const ASSET_PRODUCTION_COURT_FORMAT = 'ragf.asset-production-court.v0.1';

const status = value => String(value ?? '').toUpperCase();
const hasStatus = value => ['PASS', 'PASSED', 'VALID', 'VERIFIED', 'AVAILABLE'].includes(status(value));

const hasRole = (result, roles) => (result?.files ?? []).some(file => roles.includes(file.role) || roles.some(role => String(file.path ?? '').includes(role)));

export function createAssetCandidateFromProviderResult({result, provider, job, genome, assetIntent = null} = {}) {
  if (!result?.result_root) throw new GenesisError('ASSET_CANDIDATE_RESULT_REQUIRED');
  const representation_refs = clone(result.representation_refs ?? []);
  for (const reference of representation_refs) {
    const validation = verifyRepresentationRef(reference);
    if (!validation.valid) throw new GenesisError('ASSET_CANDIDATE_REPRESENTATION_REF_INVALID', validation.errors.join(','));
    if (reference.provider_id !== (result.provider_id ?? provider?.id)) throw new GenesisError('ASSET_CANDIDATE_REPRESENTATION_PROVIDER_MISMATCH');
  }
  const candidate = {
    format: 'ragf.asset-candidate.v0.1',
    version: ASSET_PROVIDER_CONTRACT_VERSION,
    candidate_id: result.candidate_id ?? stableId('asset-candidate', {result: result.result_root, provider: provider?.id}),
    asset_id: result.asset_id ?? genome?.identity?.asset_id ?? null,
    provider_id: result.provider_id ?? provider?.id ?? null,
    provider_root: result.provider_root ?? provider?.manifest_root ?? null,
    job_id: job?.job_id ?? null,
    asset_intent_root: assetIntent?.intent_root ?? null,
    genome_root: genome?.genome_root ?? null,
    quality_tier: result.quality_tier ?? job?.quality_tier ?? 'PRODUCTION',
    stage: result.stage ?? 'generate',
    files: clone(result.files ?? []),
    format_output: result.format_output,
    representation_refs,
    geometry: clone(result.geometry ?? {}),
    materials: clone(result.materials ?? {}),
    pbr_channels: clone(result.pbr_channels ?? []),
    source: clone(result.source ?? {}),
    provenance: clone(result.provenance ?? {}),
    license: clone(result.license ?? {}),
    generator_version: result.generator_version ?? null,
    parameters: clone(result.parameters ?? {}),
    seed: result.seed ?? job?.seed ?? null,
    provider_evidence: clone(result.evidence ?? {}),
    metrics: clone(result.metrics ?? {}),
    warnings: clone(result.warnings ?? []),
    result_root: result.result_root,
    authoritative: false,
    candidate_only: true
  };
  return seal({...candidate, candidate_root: ''}, 'candidate_root');
}

function qualityGate(candidate) {
  return {
    value: candidate.quality_tier === 'PRODUCTION',
    reason: candidate.quality_tier === 'PRODUCTION' ? null : 'PREVIEW_RESULT_CANNOT_BE_PRODUCTION'
  };
}

export function evaluateAssetProductionCourt({candidate, provider = null, genome = null, requirement = null} = {}) {
  if (!candidate) throw new GenesisError('ASSET_COURT_CANDIDATE_REQUIRED');
  const evidence = candidate.provider_evidence ?? {};
  const isCharacter = String(genome?.identity?.kind ?? requirement?.asset_kind ?? '').includes('character');
  const is3d = String(genome?.identity?.kind ?? requirement?.asset_kind ?? '').includes('3d') ||
    Boolean(candidate.geometry?.triangle_count) ||
    hasRole(candidate, ['mesh-glb', 'glb', 'refined-glb']);
  const geometry = Boolean(candidate.geometry?.glb_valid ?? true) &&
    Number(candidate.geometry?.triangle_count ?? 0) > 0 &&
    (hasStatus(evidence.geometry?.status) || Object.keys(candidate.geometry ?? {}).length > 0) &&
    (is3d ? hasRole(candidate, ['mesh-glb', 'glb', 'refined-glb']) : true);
  const topology = hasStatus(evidence.topology?.status) ||
    ['manifold', 'valid', 'watertight'].includes(status(candidate.geometry?.topology_status));
  const materialPbr = (!is3d && !candidate.pbr_channels?.length) ||
    (candidate.pbr_channels?.length >= 3 && (hasStatus(evidence.material_pbr?.status) || Object.keys(candidate.materials ?? {}).length > 0));
  const rig = !isCharacter || (hasStatus(evidence.rig?.status) && hasRole(candidate, ['rig-candidate', 'skeleton-rig', 'rig']));
  const animation = !isCharacter || (hasStatus(evidence.animation?.status) && Boolean(evidence.animation?.smoke_test ?? evidence.animation?.clip_count));
  const collision = hasStatus(evidence.collision?.status);
  const lodPlatform = !is3d || (hasStatus(evidence.lod_platform?.status) && hasRole(candidate, ['mesh-lod1-glb', 'mesh-lod2-glb', 'lod']));
  const license = candidate.license?.status === 'VERIFIED' && candidate.license?.identifier;
  const provenance = Boolean(
    candidate.provenance?.provider_id &&
    candidate.provenance?.upstream_url &&
    candidate.provenance?.source_revision &&
    candidate.provenance?.generator_version &&
    candidate.provenance?.seed
  );
  const vsrProjection = !is3d || hasStatus(evidence.vsr_projection);
  const rsrSimulation = !is3d || hasStatus(evidence.rsr_simulation);
  const quality = qualityGate(candidate);
  const providerSuccess = evidence.provider_success === true;
  const commercialRelease = provider?.commercialPolicy?.default_release_dependency_allowed === true &&
    candidate.license?.dependency_status === 'VERIFIED' &&
    candidate.license?.model_weights_status === 'VERIFIED';
  const gates = {
    geometry_gate: geometry,
    topology_gate: topology,
    material_pbr_gate: materialPbr,
    rig_gate: rig,
    animation_gate: animation,
    collision_gate: collision,
    lod_platform_budget_gate: lodPlatform,
    license_gate: license,
    provenance_gate: provenance,
    vsr_projection_gate: vsrProjection,
    rsr_simulation_gate: rsrSimulation,
    quality_tier_gate: quality.value,
    provider_success_is_not_acceptance: providerSuccess,
    commercial_release_gate: commercialRelease
  };
  const failures = Object.entries(gates).filter(([, value]) => !value).map(([key]) => key);
  const pass = failures.length === 0;
  const previewOnly = candidate.quality_tier === 'PREVIEW' && failures.every(key => key === 'quality_tier_gate' || key === 'commercial_release_gate');
  return seal({
    format: ASSET_PRODUCTION_COURT_FORMAT,
    version: ASSET_PRODUCTION_COURT_VERSION,
    candidate_id: candidate.candidate_id,
    candidate_root: candidate.candidate_root,
    provider_id: candidate.provider_id,
    asset_id: candidate.asset_id,
    quality_tier: candidate.quality_tier,
    gates,
    failures,
    status: pass ? 'PASS' : (previewOnly ? 'PREVIEW_ONLY' : 'FAIL'),
    pass,
    promotion_allowed: pass,
    commercial_release_allowed: commercialRelease,
    authority: {
      provider_can_commit: false,
      court_can_commit: false,
      rncs_authority_required: true
    },
    evidence: {
      provider_result_root: candidate.result_root,
      provider_evidence_root: evidence.evidence_root ?? rootHash(evidence),
      court_inputs_root: rootHash({candidate_root: candidate.candidate_root, provider_root: candidate.provider_root, genome_root: candidate.genome_root})
    },
    rejection_reasons: failures.map(key => ({gate: key, reason: key === 'commercial_release_gate' ? 'DEPENDENCY_OR_WEIGHT_LICENSE_AUDIT_REQUIRED' : 'GATE_NOT_SATISFIED'})),
    court_root: ''
  }, 'court_root');
}

export function createLivingAssetFamilyCandidate({candidate, court, assetIntent = null, genome = null} = {}) {
  if (!court?.pass) throw new GenesisError('LIVING_ASSET_COURT_FAILED', (court?.failures ?? []).join(','));
  if (candidate?.authoritative) throw new GenesisError('PROVIDER_AUTHORITY_ESCALATION');
  return seal({
    format: 'ragf.living-asset-family-candidate.v0.1',
    version: ASSET_PRODUCTION_COURT_VERSION,
    family_id: stableId('living-asset-family', {asset_id: candidate.asset_id, candidate_root: candidate.candidate_root}),
    asset_id: candidate.asset_id,
    intent_root: assetIntent?.intent_root ?? null,
    genome_root: genome?.genome_root ?? candidate.genome_root ?? null,
    members: [{candidate_id: candidate.candidate_id, candidate_root: candidate.candidate_root, selected: true, quality_tier: candidate.quality_tier}],
    selected_candidate_id: candidate.candidate_id,
    candidate_root: candidate.candidate_root,
    court_root: court.court_root,
    provider_roots: [candidate.provider_root].filter(Boolean),
    representation_refs: clone(candidate.representation_refs ?? []),
    lineage: {
      source_result_root: candidate.result_root,
      source_job_id: candidate.job_id,
      seed: candidate.seed,
      generator_version: candidate.generator_version
    },
    lifecycle: 'LIVING_ASSET_CANDIDATE',
    authoritative: false,
    rncs_commit_status: 'NOT_COMMITTED',
    family_root: ''
  }, 'family_root');
}

export function createRNCSAssetCommitRequest({livingAssetFamily, court, authorityDecision = 'PENDING'} = {}) {
  if (!livingAssetFamily?.family_root || !court?.court_root) throw new GenesisError('RNCS_ASSET_COMMIT_INPUT_REQUIRED');
  const approved = authorityDecision === 'APPROVED';
  return seal({
    format: 'rncs.asset-commit-request.v0.1',
    version: ASSET_PRODUCTION_COURT_VERSION,
    request_id: stableId('rncs-asset-commit', {family: livingAssetFamily.family_root, court: court.court_root, authorityDecision}),
    asset_id: livingAssetFamily.asset_id,
    family_root: livingAssetFamily.family_root,
    court_root: court.court_root,
    status: approved ? 'APPROVED_FOR_RNCS_COMMIT' : 'PROPOSED',
    authority_decision: authorityDecision,
    provider_may_not_commit: true,
    authoritative_world_state_mutated: false,
    required_next_authority: 'RNCS_INTEGRATION_COURT',
    commit_root: ''
  }, 'commit_root');
}

export function commitLivingAssetToRNCS({livingAssetFamily, court, authorityDecision = 'PENDING'} = {}) {
  const request = createRNCSAssetCommitRequest({livingAssetFamily, court, authorityDecision});
  if (authorityDecision !== 'APPROVED') throw new GenesisError('RNCS_AUTHORITY_APPROVAL_REQUIRED', request.request_id);
  return seal({
    ...request,
    status: 'COMMITTED',
    authoritative_world_state_mutated: true,
    authority: 'RNCS',
    commit_root: ''
  }, 'commit_root');
}

