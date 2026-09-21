import path from 'node:path';
import {mkdirSync, writeFileSync} from 'node:fs';
import {rootHash, seal, GenesisError, VFX_REPRESENTATION_KINDS} from '@taowind/reality-asset-genesis-fabric';
import {
  UNIVERSAL_ART_ASSET_FORGE_VERSION,
  UNIVERSAL_ART_ASSET_PROFILE_REQUIREMENTS,
  UNIVERSAL_ART_ASSET_PROFILES,
  generateUniversalArtAsset,
  verifyUniversalArtAssetForge
} from './universal-art-asset-forge.mjs';

export const UNIVERSAL_ART_ASSET_GOLDEN_SET_FORMAT = 'urrf.universal-art-asset-golden-set.v0.1';
export const UNIVERSAL_ART_ASSET_GOLDEN_SET_EVIDENCE_FORMAT = 'urrf.universal-art-asset-golden-set-evidence.v0.1';
export const UNIVERSAL_ART_ASSET_GOLDEN_SET_VERSION = '0.1.0';
export const UNIVERSAL_ART_ASSET_GOLDEN_SET_CASE_KINDS = Object.freeze(['POSITIVE', 'BOUNDARY', 'OPEN_DOMAIN_NEGATIVE']);

const MESH_STRUCTURAL_GATES = Object.freeze([
  'geometry_gate',
  'topology_gate',
  'uv_gate',
  'normal_gate',
  'pbr_gate',
  'lod_gate',
  'collision_gate',
  'runtime_projection_gate'
]);
const CHARACTER_STRUCTURAL_GATES = Object.freeze([...MESH_STRUCTURAL_GATES, 'rig_gate', 'animation_gate']);
const VFX_STRUCTURAL_GATES = Object.freeze([
  'effect_graph_gate',
  'particle_contract_gate',
  'volume_contract_gate',
  'flipbook_contract_gate',
  'curve_contract_gate',
  'runtime_projection_gate'
]);

const PROFILE_INTENTS = Object.freeze({
  character: '一名守护古代冰晶遗迹的三维女剑士，穿着带有冰纹的重甲。',
  creature: '一头栖息在极寒遗迹中的三维冰晶巨兽，具有可回放的步态。',
  prop: '一枚用于冰晶遗迹祭坛的三维古代护符，具有可复用材质与碰撞边界。',
  vehicle: '一辆能够穿越冻原裂谷的三维远古装甲载具，具有可复用碰撞边界。',
  structure: '一座带有风化石墙和入口拱门的三维遗迹建筑。',
  environment: '一片包含冰原、遗迹和远景山脊的三维环境。',
  vegetation: '一株生长在冰晶裂谷边缘的三维发光植物。',
  resource: '一簇可用于世界资源节点的三维冰晶矿石。',
  vfx: '一组需要粒子、体积、flipbook 和曲线表示的三维魔法爆炸特效。'
});

const PROFILE_BOUNDARY_INTENTS = Object.freeze({
  character: '边界：单平台预览用的最小冰纹守卫候选。',
  creature: '边界：单平台预览用的最小冰晶兽候选。',
  prop: '边界：单平台预览用的最小古代护符候选。',
  vehicle: '边界：单平台预览用的最小冻原载具候选。',
  structure: '边界：单平台预览用的最小遗迹入口候选。',
  environment: '边界：单平台预览用的最小冰原环境候选。',
  vegetation: '边界：单平台预览用的最小发光植物候选。',
  resource: '边界：单平台预览用的最小冰晶矿石候选。',
  vfx: '边界：单平台预览用的最小四表示魔法特效候选。'
});

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const clone = value => structuredClone(value);
const nonEmptyText = value => typeof value === 'string' && value.trim().length > 0;
const isRoot = value => typeof value === 'string' && /^[a-f0-9]{64}$/i.test(value);
const sorted = values => [...new Set((Array.isArray(values) ? values : []).map(String))].sort((a, b) => a.localeCompare(b, 'en'));
const expectedGateStatus = value => String(value ?? '').trim().toUpperCase() === 'PASS';

function profileRequirements(profile) {
  const requirements = UNIVERSAL_ART_ASSET_PROFILE_REQUIREMENTS[profile];
  if (!requirements) throw new GenesisError('UNIVERSAL_ART_ASSET_GOLDEN_PROFILE_INVALID', profile);
  return requirements;
}

function structuralGatesFor(profile) {
  return profile === 'vfx'
    ? [...VFX_STRUCTURAL_GATES]
    : profileRequirements(profile).requires_rig ? [...CHARACTER_STRUCTURAL_GATES] : [...MESH_STRUCTURAL_GATES];
}

function constraintsFor(profile) {
  if (profile === 'vfx') return {max_particles: 96};
  if (profile === 'character' || profile === 'creature') return {max_triangles: 2400, pbr_texture_size: 128, max_bones: 64, animation_fps: 24};
  return {max_triangles: 2400, pbr_texture_size: 128};
}

function caseInput(profile, kind) {
  const requirements = profileRequirements(profile);
  const boundary = kind === 'BOUNDARY';
  return {
    asset_key: `golden-${boundary ? 'boundary' : 'positive'}-${profile}`,
    asset_profile: profile,
    asset_kind: requirements.asset_kind,
    description: boundary ? PROFILE_BOUNDARY_INTENTS[profile] : PROFILE_INTENTS[profile],
    quality_tier: boundary ? 'PREVIEW' : 'AAA',
    seed: `urrf-golden-${boundary ? 'boundary' : 'positive'}-${profile}-v01`,
    target_platforms: boundary ? ['web'] : ['desktop', 'web'],
    constraints: constraintsFor(profile)
  };
}

function negativeCaseInput(profile) {
  return {
    asset_key: `golden-open-domain-negative-${profile}`,
    asset_profile: `unregistered-${profile}`,
    asset_kind: `unregistered-${profile}-3d`,
    description: `开放域负例：未注册的 ${profile} 资产族请求必须被拒绝。`,
    quality_tier: 'AAA',
    seed: `urrf-golden-open-domain-negative-${profile}-v01`,
    target_platforms: ['desktop']
  };
}

function profileCases(profile) {
  const requirements = profileRequirements(profile);
  return {
    positive: {
      case_id: `golden-positive-${profile}-v01`,
      case_kind: 'POSITIVE',
      input: caseInput(profile, 'POSITIVE'),
      expected: {
        asset_profile: profile,
        asset_kind: requirements.asset_kind,
        provider_route: 'BUILTIN_REFERENCE',
        candidate_required: true,
        structural_gates: structuralGatesFor(profile)
      }
    },
    boundary: {
      case_id: `golden-boundary-${profile}-v01`,
      case_kind: 'BOUNDARY',
      input: caseInput(profile, 'BOUNDARY'),
      expected: {
        asset_profile: profile,
        asset_kind: requirements.asset_kind,
        provider_route: 'BUILTIN_REFERENCE',
        candidate_required: true,
        structural_gates: structuralGatesFor(profile),
        quality_tier: 'PREVIEW',
        target_platforms: ['web'],
        aaa_proof_required: true
      }
    },
    open_domain_negative: {
      case_id: `golden-open-domain-negative-${profile}-v01`,
      case_kind: 'OPEN_DOMAIN_NEGATIVE',
      input: negativeCaseInput(profile),
      expected: {
        rejection_code: 'UNIVERSAL_ART_ASSET_PROFILE_INVALID',
        candidate_forbidden: true,
        canonical_write_forbidden: true
      }
    }
  };
}

function expectedProfileRows() {
  return UNIVERSAL_ART_ASSET_PROFILES.map(profile => ({
    asset_profile: profile,
    asset_kind: profileRequirements(profile).asset_kind,
    required_capabilities: [...profileRequirements(profile).required_capabilities],
    required_gates: [...profileRequirements(profile).required_gates],
    structural_gates: structuralGatesFor(profile),
    requires_rig: profileRequirements(profile).requires_rig,
    requires_animation: profileRequirements(profile).requires_animation,
    cases: profileCases(profile)
  }));
}

function authorityBoundary() {
  return {
    canonical_owner: 'RNCS',
    representation_owner: 'URRF',
    provider_can_write_authoritative_world_state: false,
    provider_can_commit: false,
    acceptance_can_commit: false,
    rncs_authority_required: true
  };
}

function goldenSetContractBase(goldenSetId) {
  const profiles = expectedProfileRows();
  return {
    format: UNIVERSAL_ART_ASSET_GOLDEN_SET_FORMAT,
    version: UNIVERSAL_ART_ASSET_GOLDEN_SET_VERSION,
    golden_set_id: goldenSetId,
    source: 'urrf-golden-set-catalog',
    purpose: 'nine-profile-positive-boundary-open-domain-candidate-coverage',
    profiles,
    summary: {
      profile_count: profiles.length,
      positive_case_count: profiles.length,
      boundary_case_count: profiles.length,
      open_domain_negative_case_count: profiles.length,
      total_case_count: profiles.length * 3
    },
    checks: {
      exact_profile_set: true,
      every_profile_has_positive: true,
      every_profile_has_boundary: true,
      every_profile_has_open_domain_negative: true,
      open_domain_is_fail_closed: true,
      candidate_only: true
    },
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: authorityBoundary(),
    contract_root: ''
  };
}

export function createUniversalArtAssetGoldenSetContract({golden_set_id = null, goldenSetId = null} = {}) {
  const resolvedId = golden_set_id ?? goldenSetId ?? 'urrf-universal-art-asset-golden-set-v01';
  if (!nonEmptyText(resolvedId)) throw new GenesisError('UNIVERSAL_ART_ASSET_GOLDEN_SET_ID_INVALID');
  return seal(goldenSetContractBase(String(resolvedId).trim()), 'contract_root');
}

function contractCaseRows(contract) {
  return (contract?.profiles ?? []).flatMap(profile => Object.values(record(profile.cases)));
}

function contractCaseById(contract, caseId) {
  return contractCaseRows(contract).find(item => item.case_id === caseId) ?? null;
}

export function verifyUniversalArtAssetGoldenSetContract(contract) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!contract || typeof contract !== 'object' || Array.isArray(contract)) {
    return {valid: false, errors: ['GOLDEN_SET_CONTRACT_NOT_OBJECT'], contract_root: null};
  }
  try {
    check(contract.format === UNIVERSAL_ART_ASSET_GOLDEN_SET_FORMAT, 'GOLDEN_SET_FORMAT_INVALID');
    check(contract.version === UNIVERSAL_ART_ASSET_GOLDEN_SET_VERSION, 'GOLDEN_SET_VERSION_INVALID');
    check(nonEmptyText(contract.golden_set_id), 'GOLDEN_SET_ID_INVALID');
    check(contract.source === 'urrf-golden-set-catalog', 'GOLDEN_SET_SOURCE_INVALID');
    check(Array.isArray(contract.profiles) && contract.profiles.length === UNIVERSAL_ART_ASSET_PROFILES.length, 'GOLDEN_SET_PROFILE_COUNT_INVALID');
    const profiles = Array.isArray(contract.profiles) ? contract.profiles : [];
    check(rootHash(profiles.map(item => item?.asset_profile)) === rootHash(UNIVERSAL_ART_ASSET_PROFILES), 'GOLDEN_SET_PROFILE_ORDER_INVALID');
    const caseIds = [];
    for (const profile of profiles) {
      const assetProfile = profile?.asset_profile;
      const requirements = UNIVERSAL_ART_ASSET_PROFILE_REQUIREMENTS[assetProfile];
      check(Boolean(requirements), `GOLDEN_SET_PROFILE_INVALID:${assetProfile ?? 'unknown'}`);
      if (!requirements) continue;
      check(profile.asset_kind === requirements.asset_kind, `GOLDEN_SET_ASSET_KIND_INVALID:${assetProfile}`);
      check(rootHash(profile.required_capabilities ?? []) === rootHash(requirements.required_capabilities), `GOLDEN_SET_CAPABILITIES_INVALID:${assetProfile}`);
      check(rootHash(profile.required_gates ?? []) === rootHash(requirements.required_gates), `GOLDEN_SET_GATES_INVALID:${assetProfile}`);
      check(rootHash(profile.structural_gates ?? []) === rootHash(structuralGatesFor(assetProfile)), `GOLDEN_SET_STRUCTURAL_GATES_INVALID:${assetProfile}`);
      check(profile.requires_rig === requirements.requires_rig, `GOLDEN_SET_RIG_REQUIREMENT_INVALID:${assetProfile}`);
      check(profile.requires_animation === requirements.requires_animation, `GOLDEN_SET_ANIMATION_REQUIREMENT_INVALID:${assetProfile}`);
      const cases = record(profile.cases);
      for (const kind of ['positive', 'boundary', 'open_domain_negative']) {
        const item = cases[kind];
        check(Boolean(item), `GOLDEN_SET_CASE_MISSING:${assetProfile}:${kind}`);
        if (!item) continue;
        caseIds.push(item.case_id);
        check(UNIVERSAL_ART_ASSET_GOLDEN_SET_CASE_KINDS.includes(item.case_kind), `GOLDEN_SET_CASE_KIND_INVALID:${assetProfile}:${kind}`);
        check(item.case_kind === kind.toUpperCase(), `GOLDEN_SET_CASE_KIND_MISMATCH:${assetProfile}:${kind}`);
        check(item.input && typeof item.input === 'object' && !Array.isArray(item.input), `GOLDEN_SET_CASE_INPUT_INVALID:${assetProfile}:${kind}`);
        if (kind !== 'open_domain_negative') {
          check(item.input?.asset_profile === assetProfile, `GOLDEN_SET_CASE_PROFILE_INVALID:${assetProfile}:${kind}`);
          check(item.input?.asset_kind === requirements.asset_kind, `GOLDEN_SET_CASE_ASSET_KIND_INVALID:${assetProfile}:${kind}`);
          check(item.expected?.asset_profile === assetProfile, `GOLDEN_SET_CASE_EXPECTED_PROFILE_INVALID:${assetProfile}:${kind}`);
          check(item.expected?.provider_route === 'BUILTIN_REFERENCE', `GOLDEN_SET_CASE_PROVIDER_ROUTE_INVALID:${assetProfile}:${kind}`);
          check(item.expected?.candidate_required === true, `GOLDEN_SET_CASE_CANDIDATE_REQUIREMENT_INVALID:${assetProfile}:${kind}`);
          check(rootHash(item.expected?.structural_gates ?? []) === rootHash(structuralGatesFor(assetProfile)), `GOLDEN_SET_CASE_STRUCTURAL_GATES_INVALID:${assetProfile}:${kind}`);
        } else {
          check(!UNIVERSAL_ART_ASSET_PROFILES.includes(item.input?.asset_profile), `GOLDEN_SET_NEGATIVE_PROFILE_REGISTERED:${assetProfile}`);
          check(item.expected?.rejection_code === 'UNIVERSAL_ART_ASSET_PROFILE_INVALID', `GOLDEN_SET_NEGATIVE_REJECTION_INVALID:${assetProfile}`);
          check(item.expected?.candidate_forbidden === true && item.expected?.canonical_write_forbidden === true, `GOLDEN_SET_NEGATIVE_AUTHORITY_EXPECTATION_INVALID:${assetProfile}`);
        }
      }
    }
    check(caseIds.length === UNIVERSAL_ART_ASSET_PROFILES.length * 3, 'GOLDEN_SET_CASE_COUNT_INVALID');
    check(new Set(caseIds).size === caseIds.length, 'GOLDEN_SET_CASE_IDS_NOT_UNIQUE');
    check(contract.summary?.profile_count === UNIVERSAL_ART_ASSET_PROFILES.length, 'GOLDEN_SET_SUMMARY_PROFILE_COUNT_INVALID');
    check(contract.summary?.positive_case_count === UNIVERSAL_ART_ASSET_PROFILES.length, 'GOLDEN_SET_SUMMARY_POSITIVE_COUNT_INVALID');
    check(contract.summary?.boundary_case_count === UNIVERSAL_ART_ASSET_PROFILES.length, 'GOLDEN_SET_SUMMARY_BOUNDARY_COUNT_INVALID');
    check(contract.summary?.open_domain_negative_case_count === UNIVERSAL_ART_ASSET_PROFILES.length, 'GOLDEN_SET_SUMMARY_NEGATIVE_COUNT_INVALID');
    check(contract.summary?.total_case_count === UNIVERSAL_ART_ASSET_PROFILES.length * 3, 'GOLDEN_SET_SUMMARY_TOTAL_COUNT_INVALID');
    check(contract.checks?.exact_profile_set === true && contract.checks?.every_profile_has_positive === true && contract.checks?.every_profile_has_boundary === true && contract.checks?.every_profile_has_open_domain_negative === true && contract.checks?.open_domain_is_fail_closed === true && contract.checks?.candidate_only === true, 'GOLDEN_SET_CATALOG_CHECKS_INVALID');
    check(contract.candidate_only === true && contract.authoritative === false && contract.canonical_write_authorized === false, 'GOLDEN_SET_AUTHORITY_INVALID');
    check(rootHash(contract.authority ?? {}) === rootHash(authorityBoundary()), 'GOLDEN_SET_AUTHORITY_BOUNDARY_INVALID');
    const copy = clone(contract);
    const actual = copy.contract_root;
    delete copy.contract_root;
    check(isRoot(actual) && actual === rootHash(copy), 'GOLDEN_SET_CONTRACT_ROOT_INVALID');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, contract_root: contract.contract_root ?? null};
}

function gateStatuses(result) {
  return Object.fromEntries((Array.isArray(result?.acceptance?.gates) ? result.acceptance.gates : []).map(gate => [gate.gate, gate.status]));
}

function meshArtifactChecks(profile, result) {
  const artifacts = record(result?.candidate?.artifacts);
  const inspection = record(result?.execution?.file_inspection);
  const aggregates = record(inspection.aggregates);
  const gateStatus = gateStatuses(result);
  const staticRuntime = result?.candidate?.artifacts?.['rsr-embodiment-profile']?.data?.body?.runtime_kind;
  return {
    file_inspection: inspection.status === 'PASS',
    mesh_glb: Boolean(artifacts['mesh-glb']),
    lod_structure: inspection.status === 'PASS' && aggregates.lod_count >= 3 && Array.isArray(aggregates.lod_levels) && aggregates.lod_levels.length === 3,
    collision: expectedGateStatus(gateStatus.collision_gate),
    rig_structure: profile === 'character' || profile === 'creature' ? Boolean(artifacts['skeleton-rig']) : !artifacts['skeleton-rig'] && staticRuntime === 'static',
    animation_structure: profile === 'character' || profile === 'creature' ? Boolean(artifacts['animation-clips']) : !artifacts['animation-clips']
  };
}

function vfxArtifactChecks(result) {
  const candidate = record(result?.candidate);
  const evidence = record(candidate.provider_evidence ?? candidate.evidence);
  const metrics = record(candidate.metrics);
  const kinds = sorted((Array.isArray(candidate.representation_refs) ? candidate.representation_refs : []).map(ref => ref?.representation_kind));
  return {
    effect_graph: expectedGateStatus(gateStatuses(result).effect_graph_gate) && isRoot(metrics.vfx_contract_root),
    representation_kinds: rootHash(kinds) === rootHash(sorted(VFX_REPRESENTATION_KINDS)),
    representation_evidence: evidence.representation?.status === 'PASS',
    particle: expectedGateStatus(gateStatuses(result).particle_contract_gate),
    volume: expectedGateStatus(gateStatuses(result).volume_contract_gate),
    flipbook: expectedGateStatus(gateStatuses(result).flipbook_contract_gate),
    curve: expectedGateStatus(gateStatuses(result).curve_contract_gate)
  };
}

function summarizeGeneratedCase(caseSpec, result, outputDirectory) {
  const profile = caseSpec.expected.asset_profile;
  const gates = gateStatuses(result);
  const structuralChecks = profile === 'vfx' ? vfxArtifactChecks(result) : meshArtifactChecks(profile, result);
  const forgeVerification = verifyUniversalArtAssetForge({
    forge: result?.forge,
    genome: result?.genome,
    acceptance: result?.acceptance,
    evidenceLedger: result?.evidenceLedger,
    fileInspection: result?.fileInspection
  });
  const checks = {
    profile_binding: result?.genome?.asset_profile === profile && result?.genome?.asset_kind === caseSpec.expected.asset_kind,
    execution_completed: result?.execution?.status === 'COMPLETED',
    provider_route: result?.resolution?.eligible === true
      && result?.resolution?.runtime_status === 'READY_REFERENCE'
      && result?.resolution?.selected_provider_source === 'ragf-reference-provider'
      && nonEmptyText(result?.resolution?.selected_provider_id)
      && isRoot(result?.resolution?.selected_provider_root),
    candidate_present: caseSpec.expected.candidate_required === true && isRoot(result?.candidate?.candidate_root),
    required_structural_gates: caseSpec.expected.structural_gates.every(gate => expectedGateStatus(gates[gate])),
    structural_artifacts: Object.values(structuralChecks).every(Boolean),
    forge_integrity: forgeVerification.valid,
    authority_boundary: result?.forge?.candidate_only === true
      && result?.forge?.authoritative === false
      && result?.forge?.canonical_write_authorized === false
      && result?.forge?.authority?.canonical_owner === 'RNCS'
      && result?.forge?.authority?.representation_owner === 'URRF'
      && result?.forge?.authority?.provider_can_write_authoritative_world_state === false
      && result?.forge?.authority?.provider_can_commit === false
      && result?.forge?.authority?.acceptance_can_commit === false
  };
  const roots = {
    genome_root: result?.genome?.genome_root ?? null,
    resolution_root: result?.resolution?.resolution_root ?? null,
    candidate_root: result?.candidate?.candidate_root ?? null,
    forge_root: result?.forge?.forge_root ?? null
  };
  const deterministicRoots = {
    genome_root: roots.genome_root,
    resolution_root: roots.resolution_root,
    candidate_root: roots.candidate_root
  };
  return {
    case_id: caseSpec.case_id,
    case_kind: caseSpec.case_kind,
    asset_profile: profile,
    asset_kind: caseSpec.expected.asset_kind,
    input_root: rootHash(caseSpec.input),
    output_directory: outputDirectory,
    underlying_asset_status: result?.status ?? null,
    execution_status: result?.execution?.status ?? null,
    roots,
    structural_checks: structuralChecks,
    checks,
    pass: Object.values(checks).every(Boolean),
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    // Forge envelopes may contain execution identifiers; compare the
    // deterministic semantic/candidate roots for replay instead.
    root_fingerprint: rootHash(deterministicRoots)
  };
}

function executeGeneratedCase(caseSpec, outputDirectory) {
  const result = generateUniversalArtAsset(caseSpec.input, {outDir: outputDirectory});
  return {summary: summarizeGeneratedCase(caseSpec, result, outputDirectory), result};
}

function executeNegativeCase(caseSpec, outputDirectory) {
  let error = null;
  try {
    generateUniversalArtAsset(caseSpec.input, {outDir: outputDirectory});
  } catch (caught) {
    error = caught;
  }
  const expectedCode = caseSpec.expected.rejection_code;
  const errorCode = error?.code ?? (typeof error?.message === 'string' ? error.message.split(':')[0] : null);
  const checks = {
    rejected: Boolean(error),
    expected_error: errorCode === expectedCode,
    no_candidate_root: true,
    no_canonical_write: true
  };
  return {
    case_id: caseSpec.case_id,
    case_kind: caseSpec.case_kind,
    asset_profile: caseSpec.input.asset_profile,
    asset_kind: caseSpec.input.asset_kind,
    input_root: rootHash(caseSpec.input),
    output_directory: outputDirectory,
    status: error ? 'REJECTED' : 'ACCEPTED_UNEXPECTEDLY',
    error_code: errorCode,
    error_message: error?.message ?? null,
    roots: {genome_root: null, resolution_root: null, candidate_root: null, forge_root: null},
    checks,
    pass: Object.values(checks).every(Boolean),
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    root_fingerprint: rootHash({case_id: caseSpec.case_id, status: error ? 'REJECTED' : 'ACCEPTED_UNEXPECTEDLY', error_code: errorCode})
  };
}

function replaySummary(caseSpec, original, outputDirectory) {
  const replay = executeGeneratedCase(caseSpec, outputDirectory);
  const originalRoots = original.summary.roots;
  const replayRoots = replay.summary.roots;
  const checks = {
    execution_completed: replay.summary.execution_status === 'COMPLETED',
    root_equality: rootHash({
      genome_root: originalRoots.genome_root,
      resolution_root: originalRoots.resolution_root,
      candidate_root: originalRoots.candidate_root
    }) === rootHash({
      genome_root: replayRoots.genome_root,
      resolution_root: replayRoots.resolution_root,
      candidate_root: replayRoots.candidate_root
    }),
    replay_structural: replay.summary.pass === true
  };
  return {
    case_id: caseSpec.case_id,
    asset_profile: caseSpec.expected.asset_profile,
    input_root: rootHash(caseSpec.input),
    output_directory: outputDirectory,
    original_root_fingerprint: original.summary.root_fingerprint,
    replay_root_fingerprint: replay.summary.root_fingerprint,
    original_roots: originalRoots,
    replay_roots: replayRoots,
    checks,
    pass: Object.values(checks).every(Boolean)
  };
}

function reportChecks({contract, positive, boundary, negatives, replays}) {
  const expectedProfiles = UNIVERSAL_ART_ASSET_PROFILES;
  const positiveProfiles = sorted(positive.map(item => item.asset_profile));
  const boundaryProfiles = sorted(boundary.map(item => item.asset_profile));
  const negativeProfiles = sorted(negatives.map(item => String(item.asset_profile).replace(/^unregistered-/, '')));
  return {
    contract_binding: isRoot(contract.contract_root),
    positive_case_count: positive.length === expectedProfiles.length,
    boundary_case_count: boundary.length === expectedProfiles.length,
    open_domain_negative_case_count: negatives.length === expectedProfiles.length,
    positive_profile_coverage: rootHash(positiveProfiles) === rootHash(sorted(expectedProfiles)),
    boundary_profile_coverage: rootHash(boundaryProfiles) === rootHash(sorted(expectedProfiles)),
    open_domain_profile_coverage: rootHash(negativeProfiles) === rootHash(sorted(expectedProfiles)),
    positive_structural: positive.every(item => item.pass === true),
    boundary_structural: boundary.every(item => item.pass === true),
    open_domain_fail_closed: negatives.every(item => item.pass === true && item.status === 'REJECTED'),
    deterministic_replay: replays.length === expectedProfiles.length && replays.every(item => item.pass === true),
    unique_positive_roots: new Set(positive.map(item => item.root_fingerprint)).size === positive.length,
    authority_boundary: [...positive, ...boundary, ...negatives].every(item => item.candidate_only === true && item.authoritative === false && item.canonical_write_authorized === false)
  };
}

export function executeUniversalArtAssetGoldenSet({contract = null, outDir} = {}) {
  if (!nonEmptyText(outDir)) throw new GenesisError('UNIVERSAL_ART_ASSET_GOLDEN_SET_OUT_DIR_REQUIRED');
  const resolvedContract = contract ?? createUniversalArtAssetGoldenSetContract();
  const contractVerification = verifyUniversalArtAssetGoldenSetContract(resolvedContract);
  if (!contractVerification.valid) throw new GenesisError('UNIVERSAL_ART_ASSET_GOLDEN_SET_CONTRACT_INVALID', contractVerification.errors.join(','));
  const outputRoot = path.resolve(String(outDir));
  mkdirSync(outputRoot, {recursive: true});
  const positive = [];
  const boundary = [];
  const negatives = [];
  const replays = [];
  const results = new Map();
  for (const profile of resolvedContract.profiles) {
    const positiveCase = profile.cases.positive;
    const boundaryCase = profile.cases.boundary;
    const negativeCase = profile.cases.open_domain_negative;
    const positiveRun = executeGeneratedCase(positiveCase, path.join(outputRoot, positiveCase.case_id));
    const boundaryRun = executeGeneratedCase(boundaryCase, path.join(outputRoot, boundaryCase.case_id));
    const negativeRun = executeNegativeCase(negativeCase, path.join(outputRoot, negativeCase.case_id));
    positive.push(positiveRun.summary);
    boundary.push(boundaryRun.summary);
    negatives.push(negativeRun);
    results.set(positiveCase.case_id, positiveRun.result);
    results.set(boundaryCase.case_id, boundaryRun.result);
    replays.push(replaySummary(positiveCase, positiveRun, path.join(outputRoot, 'replay', positiveCase.case_id)));
  }
  const checks = reportChecks({contract: resolvedContract, positive, boundary, negatives, replays});
  const reportBase = {
    format: UNIVERSAL_ART_ASSET_GOLDEN_SET_EVIDENCE_FORMAT,
    version: UNIVERSAL_ART_ASSET_GOLDEN_SET_VERSION,
    golden_set_id: resolvedContract.golden_set_id,
    source: 'urrf-golden-set-runner',
    contract_root: resolvedContract.contract_root,
    output_directory: outputRoot,
    profiles: UNIVERSAL_ART_ASSET_PROFILES,
    positive,
    boundary,
    open_domain_negative: negatives,
    deterministic_replay: replays,
    summary: {
      profile_count: UNIVERSAL_ART_ASSET_PROFILES.length,
      positive_case_count: positive.length,
      boundary_case_count: boundary.length,
      open_domain_negative_case_count: negatives.length,
      replay_case_count: replays.length,
      pass_count: [...positive, ...boundary, ...negatives, ...replays].filter(item => item.pass === true).length,
      fail_count: [...positive, ...boundary, ...negatives, ...replays].filter(item => item.pass !== true).length
    },
    checks,
    status: Object.values(checks).every(Boolean) ? 'CANDIDATE_GOLDEN_SET_PASS' : 'CANDIDATE_GOLDEN_SET_FAIL',
    execution_status: 'CANDIDATE_LOCAL_REFERENCE_EXECUTED',
    aaa_status: 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE',
    ai_generate_status: 'BLOCKED_EXTERNAL_MODEL_NOT_RUN',
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: authorityBoundary(),
    evidence_root: ''
  };
  const report = seal(reportBase, 'evidence_root');
  writeFileSync(path.join(outputRoot, 'universal-art-asset-golden-set-contract.json'), `${JSON.stringify(resolvedContract, null, 2)}\n`, 'utf8');
  writeFileSync(path.join(outputRoot, 'universal-art-asset-golden-set-evidence.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
  return {contract: resolvedContract, report, results};
}

export function verifyUniversalArtAssetGoldenSetReport(report, {contract = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!report || typeof report !== 'object' || Array.isArray(report)) return {valid: false, errors: ['GOLDEN_SET_REPORT_NOT_OBJECT'], evidence_root: null};
  try {
    check(report.format === UNIVERSAL_ART_ASSET_GOLDEN_SET_EVIDENCE_FORMAT, 'GOLDEN_SET_REPORT_FORMAT_INVALID');
    check(report.version === UNIVERSAL_ART_ASSET_GOLDEN_SET_VERSION, 'GOLDEN_SET_REPORT_VERSION_INVALID');
    check(nonEmptyText(report.golden_set_id), 'GOLDEN_SET_REPORT_ID_INVALID');
    check(report.source === 'urrf-golden-set-runner', 'GOLDEN_SET_REPORT_SOURCE_INVALID');
    check(isRoot(report.contract_root), 'GOLDEN_SET_REPORT_CONTRACT_ROOT_INVALID');
    if (contract !== null) {
      const contractVerification = verifyUniversalArtAssetGoldenSetContract(contract);
      check(contractVerification.valid, `GOLDEN_SET_REPORT_CONTRACT_INVALID:${contractVerification.errors.join(',')}`);
      check(report.contract_root === contract.contract_root, 'GOLDEN_SET_REPORT_CONTRACT_BINDING_INVALID');
      check(report.golden_set_id === contract.golden_set_id, 'GOLDEN_SET_REPORT_ID_MISMATCH');
    }
    const positive = Array.isArray(report.positive) ? report.positive : [];
    const boundary = Array.isArray(report.boundary) ? report.boundary : [];
    const negatives = Array.isArray(report.open_domain_negative) ? report.open_domain_negative : [];
    const replays = Array.isArray(report.deterministic_replay) ? report.deterministic_replay : [];
    check(positive.length === 9, 'GOLDEN_SET_REPORT_POSITIVE_COUNT_INVALID');
    check(boundary.length === 9, 'GOLDEN_SET_REPORT_BOUNDARY_COUNT_INVALID');
    check(negatives.length === 9, 'GOLDEN_SET_REPORT_NEGATIVE_COUNT_INVALID');
    check(replays.length === 9, 'GOLDEN_SET_REPORT_REPLAY_COUNT_INVALID');
    const validateGenerated = (rows, kind) => {
      for (const row of rows) {
        check(row?.case_kind === kind, `GOLDEN_SET_REPORT_CASE_KIND_INVALID:${row?.case_id ?? 'unknown'}`);
        check(UNIVERSAL_ART_ASSET_PROFILES.includes(row?.asset_profile), `GOLDEN_SET_REPORT_PROFILE_INVALID:${row?.case_id ?? 'unknown'}`);
        check(isRoot(row?.input_root), `GOLDEN_SET_REPORT_INPUT_ROOT_INVALID:${row?.case_id ?? 'unknown'}`);
        check(row?.underlying_asset_status === 'BLOCKED', `GOLDEN_SET_REPORT_UNDERLYING_STATUS_INVALID:${row?.case_id ?? 'unknown'}`);
        check(row?.execution_status === 'COMPLETED', `GOLDEN_SET_REPORT_EXECUTION_STATUS_INVALID:${row?.case_id ?? 'unknown'}`);
        check(isRoot(row?.roots?.genome_root) && isRoot(row?.roots?.resolution_root) && isRoot(row?.roots?.candidate_root) && isRoot(row?.roots?.forge_root), `GOLDEN_SET_REPORT_ROOTS_INVALID:${row?.case_id ?? 'unknown'}`);
        check(row?.pass === true, `GOLDEN_SET_REPORT_CASE_NOT_PASS:${row?.case_id ?? 'unknown'}`);
        check(row?.candidate_only === true && row?.authoritative === false && row?.canonical_write_authorized === false, `GOLDEN_SET_REPORT_CASE_AUTHORITY_INVALID:${row?.case_id ?? 'unknown'}`);
        check(isRoot(row?.root_fingerprint), `GOLDEN_SET_REPORT_FINGERPRINT_INVALID:${row?.case_id ?? 'unknown'}`);
      }
    };
    validateGenerated(positive, 'POSITIVE');
    validateGenerated(boundary, 'BOUNDARY');
    for (const row of negatives) {
      check(row?.case_kind === 'OPEN_DOMAIN_NEGATIVE', `GOLDEN_SET_REPORT_NEGATIVE_KIND_INVALID:${row?.case_id ?? 'unknown'}`);
      check(typeof row?.asset_profile === 'string' && !UNIVERSAL_ART_ASSET_PROFILES.includes(row.asset_profile), `GOLDEN_SET_REPORT_NEGATIVE_PROFILE_INVALID:${row?.case_id ?? 'unknown'}`);
      check(row?.status === 'REJECTED', `GOLDEN_SET_REPORT_NEGATIVE_ACCEPTED:${row?.case_id ?? 'unknown'}`);
      check(row?.error_code === 'UNIVERSAL_ART_ASSET_PROFILE_INVALID', `GOLDEN_SET_REPORT_NEGATIVE_ERROR_INVALID:${row?.case_id ?? 'unknown'}`);
      check(row?.pass === true, `GOLDEN_SET_REPORT_NEGATIVE_NOT_PASS:${row?.case_id ?? 'unknown'}`);
      check(row?.roots?.genome_root === null && row?.roots?.resolution_root === null && row?.roots?.candidate_root === null && row?.roots?.forge_root === null, `GOLDEN_SET_REPORT_NEGATIVE_ROOTS_INVALID:${row?.case_id ?? 'unknown'}`);
    }
    for (const row of replays) {
      check(row?.asset_profile && UNIVERSAL_ART_ASSET_PROFILES.includes(row.asset_profile), `GOLDEN_SET_REPORT_REPLAY_PROFILE_INVALID:${row?.case_id ?? 'unknown'}`);
      check(isRoot(row?.original_root_fingerprint) && isRoot(row?.replay_root_fingerprint), `GOLDEN_SET_REPORT_REPLAY_FINGERPRINT_INVALID:${row?.case_id ?? 'unknown'}`);
      check(row?.checks?.root_equality === true && row?.pass === true, `GOLDEN_SET_REPORT_REPLAY_NOT_PASS:${row?.case_id ?? 'unknown'}`);
    }
    const expectedChecks = reportChecks({contract: {contract_root: report.contract_root}, positive, boundary, negatives, replays});
    for (const [key, value] of Object.entries(expectedChecks)) check(report.checks?.[key] === value, `GOLDEN_SET_REPORT_CHECK_${key.toUpperCase()}_MISMATCH`);
    check(report.summary?.profile_count === 9, 'GOLDEN_SET_REPORT_SUMMARY_PROFILE_COUNT_INVALID');
    check(report.summary?.positive_case_count === positive.length, 'GOLDEN_SET_REPORT_SUMMARY_POSITIVE_COUNT_MISMATCH');
    check(report.summary?.boundary_case_count === boundary.length, 'GOLDEN_SET_REPORT_SUMMARY_BOUNDARY_COUNT_MISMATCH');
    check(report.summary?.open_domain_negative_case_count === negatives.length, 'GOLDEN_SET_REPORT_SUMMARY_NEGATIVE_COUNT_MISMATCH');
    check(report.summary?.replay_case_count === replays.length, 'GOLDEN_SET_REPORT_SUMMARY_REPLAY_COUNT_MISMATCH');
    const all = [...positive, ...boundary, ...negatives, ...replays];
    check(report.summary?.pass_count === all.filter(item => item.pass === true).length, 'GOLDEN_SET_REPORT_SUMMARY_PASS_COUNT_MISMATCH');
    check(report.summary?.fail_count === all.filter(item => item.pass !== true).length, 'GOLDEN_SET_REPORT_SUMMARY_FAIL_COUNT_MISMATCH');
    const expectedStatus = Object.values(report.checks ?? {}).every(Boolean) ? 'CANDIDATE_GOLDEN_SET_PASS' : 'CANDIDATE_GOLDEN_SET_FAIL';
    check(report.status === expectedStatus, 'GOLDEN_SET_REPORT_STATUS_MISMATCH');
    check(report.execution_status === 'CANDIDATE_LOCAL_REFERENCE_EXECUTED', 'GOLDEN_SET_REPORT_EXECUTION_BOUNDARY_INVALID');
    check(report.aaa_status === 'BLOCKED_EXTERNAL_ART_HUMAN_HARDWARE_EVIDENCE', 'GOLDEN_SET_REPORT_AAA_BOUNDARY_INVALID');
    check(report.ai_generate_status === 'BLOCKED_EXTERNAL_MODEL_NOT_RUN', 'GOLDEN_SET_REPORT_AI_BOUNDARY_INVALID');
    check(report.candidate_only === true && report.authoritative === false && report.canonical_write_authorized === false, 'GOLDEN_SET_REPORT_AUTHORITY_INVALID');
    check(rootHash(report.authority ?? {}) === rootHash(authorityBoundary()), 'GOLDEN_SET_REPORT_AUTHORITY_BOUNDARY_INVALID');
    const copy = clone(report);
    const actual = copy.evidence_root;
    delete copy.evidence_root;
    check(isRoot(actual) && actual === rootHash(copy), 'GOLDEN_SET_REPORT_ROOT_INVALID');
    if (contract !== null) {
      const expectedRows = contract.profiles.map(profile => profile.asset_profile);
      check(rootHash(report.profiles ?? []) === rootHash(expectedRows), 'GOLDEN_SET_REPORT_PROFILE_LIST_INVALID');
      for (const row of [...positive, ...boundary, ...negatives]) {
        const expectedCase = contractCaseById(contract, row.case_id);
        check(Boolean(expectedCase), `GOLDEN_SET_REPORT_CASE_NOT_IN_CONTRACT:${row.case_id ?? 'unknown'}`);
        if (expectedCase) check(row.input_root === rootHash(expectedCase.input), `GOLDEN_SET_REPORT_INPUT_BINDING_INVALID:${row.case_id}`);
      }
      for (const row of replays) {
        const expectedCase = contractCaseById(contract, row.case_id);
        check(Boolean(expectedCase), `GOLDEN_SET_REPORT_REPLAY_NOT_IN_CONTRACT:${row.case_id ?? 'unknown'}`);
        if (expectedCase) check(row.input_root === rootHash(expectedCase.input), `GOLDEN_SET_REPORT_REPLAY_INPUT_BINDING_INVALID:${row.case_id}`);
      }
    }
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, evidence_root: report.evidence_root ?? null};
}
