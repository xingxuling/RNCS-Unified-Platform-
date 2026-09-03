import fs from 'node:fs';
import path from 'node:path';
import {
  UNIVERSAL_ART_ASSET_FORGE_VERSION,
  UNIVERSAL_ART_ASSET_GENOME_FORMAT,
  UNIVERSAL_ART_ASSET_PROFILES,
  UNIVERSAL_ART_ASSET_QUALITY_TIERS,
  createUniversalArtAssetGenome,
  createUniversalArtAssetProviderPipelinePlan,
  createUniversalArtAssetProviderPipelineArtifact,
  executeUniversalArtAssetProviderPipeline,
  verifyUniversalArtAssetProviderPipelineArtifact,
  verifyUniversalArtAssetProviderPipelineExecution,
  verifyUniversalArtAssetProviderPipelinePlan,
  verifyUniversalArtAssetGenome
} from './universal-art-asset-forge.mjs';
import {
  GenesisError,
  clone,
  rootHash,
  seal,
  stableId
} from '@taowind/reality-asset-genesis-fabric';

export const UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT = 'urrf.universal-art-asset-component-graph.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_LOWERING_FORMAT = 'urrf.universal-art-asset-component-lowering.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_FORMAT = 'urrf.universal-art-asset-component-execution.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_CONTEXT_FORMAT = 'urrf.universal-art-asset-component-execution-context.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION = '0.1.0';

export const UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS = Object.freeze([
  'mesh',
  'sdf',
  'voxel',
  'point-cloud',
  'gaussian-splat',
  'neural-field',
  'curve',
  'particle',
  'material',
  'rig',
  'animation'
]);

const COMPONENT_ID_PATTERN = /^[A-Za-z0-9][A-Za-z0-9._:-]{0,95}$/;
const TEXT_LIMIT = 4096;

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const nonEmptyText = value => typeof value === 'string' && value.trim().length > 0;
const hexRoot = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);

function fail(condition, code, detail = '') {
  if (!condition) throw new GenesisError(code, detail);
}

function text(value, fallback, field, max = 96) {
  const result = String(value ?? fallback ?? '').trim();
  fail(result.length > 0 && result.length <= max, `${field}_INVALID`);
  return result;
}

function componentId(value, fallback) {
  const result = text(value, fallback, 'UNIVERSAL_ART_ASSET_COMPONENT_ID');
  fail(COMPONENT_ID_PATTERN.test(result), 'UNIVERSAL_ART_ASSET_COMPONENT_ID_INVALID');
  return result;
}

function integer(value, fallback, {min = Number.MIN_SAFE_INTEGER, max = Number.MAX_SAFE_INTEGER, field} = {}) {
  const result = value === undefined || value === null ? fallback : Number(value);
  fail(Number.isSafeInteger(result) && result >= min && result <= max, `${field}_INVALID`);
  return result;
}

function vector(value, fallback, {min, max, field}) {
  const source = value === undefined || value === null ? fallback : value;
  const raw = Array.isArray(source)
    ? source
    : source && typeof source === 'object'
      ? [source.x, source.y, source.z]
      : [source, source, source];
  fail(raw.length === 3, `${field}_LENGTH_INVALID`);
  return raw.map(component => integer(component, null, {min, max, field: `${field}_VALUE`}));
}

function optionalRoot(value, field) {
  if (value === undefined || value === null || value === '') return null;
  const result = String(value).trim();
  fail(hexRoot(result), `${field}_INVALID`);
  return result;
}

function optionalText(value, field, max = 256) {
  if (value === undefined || value === null || value === '') return null;
  return text(value, null, field, max);
}

function keySort(left, right) {
  return String(left).localeCompare(String(right), 'en');
}

function normalizeRepresentationKind(value, fallback = 'mesh') {
  const result = String(value ?? fallback).trim().toLowerCase();
  fail(UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS.includes(result), 'UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KIND_INVALID');
  return result;
}

function pickGenomeInput(value, fallback = {}) {
  const source = clone(record(value));
  for (const key of [
    'genome',
    'asset_genome',
    'component_id',
    'componentId',
    'role',
    'depends_on',
    'dependsOn',
    'dependencies',
    'parent_component_id',
    'parentComponentId',
    'attach_to',
    'attachTo',
    'representation',
    'representation_kind',
    'representationKind',
    'representation_profile',
    'representationProfile',
    'source_root',
    'sourceRoot',
    'provider_id',
    'providerId',
    'transform_mm',
    'transformMm',
    'translation_mm',
    'translationMm',
    'rotation_deg',
    'rotationDeg',
    'scale_milli',
    'scaleMilli',
    'variant',
    'authoritative',
    'candidate_only',
    'canonical_write_authorized',
    'authority'
  ]) delete source[key];
  for (const [key, value] of Object.entries(record(fallback))) {
    if (source[key] === undefined && value !== undefined) source[key] = clone(value);
  }
  return source;
}

function resolveGenome(value, fallback = {}) {
  const source = record(value);
  if (source.format === UNIVERSAL_ART_ASSET_GENOME_FORMAT) {
    const verification = verifyUniversalArtAssetGenome(source);
    fail(verification.valid, 'UNIVERSAL_ART_ASSET_COMPONENT_GENOME_INVALID', verification.errors.join(','));
    return clone(source);
  }
  return createUniversalArtAssetGenome(pickGenomeInput(source, fallback));
}

function normalizeDependencies(value) {
  const raw = Array.isArray(value) ? value : value === undefined || value === null || value === '' ? [] : [value];
  const dependencies = raw.map((dependency, index) => componentId(dependency, null, `UNIVERSAL_ART_ASSET_COMPONENT_DEPENDENCY_${index}`));
  return [...new Set(dependencies)].sort(keySort);
}

function normalizeComponent(rawInput, genome, index, rootQualityTier) {
  const raw = record(rawInput);
  fail(raw.authoritative !== true && raw.canonical_write_authorized !== true && raw.authority?.provider_can_write_authoritative_world_state !== true && raw.authority?.provider_can_commit !== true, 'UNIVERSAL_ART_ASSET_COMPONENT_AUTHORITY_ESCALATION');
  const componentIdValue = componentId(raw.component_id ?? raw.componentId ?? raw.id, `component-${index + 1}`);
  const role = text(raw.role, `${genome.asset_profile}:${componentIdValue}`, 'UNIVERSAL_ART_ASSET_COMPONENT_ROLE', 96);
  const representation = record(raw.representation);
  const representationKind = normalizeRepresentationKind(
    raw.representation_kind ?? raw.representationKind ?? representation.kind ?? genome.representation_contract?.geometry?.representation,
    'mesh'
  );
  const representationProfile = text(
    raw.representation_profile ?? raw.representationProfile ?? representation.profile,
    'default',
    'UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_PROFILE',
    96
  );
  const sourceRoot = optionalRoot(raw.source_root ?? raw.sourceRoot ?? representation.source_root ?? representation.sourceRoot, 'UNIVERSAL_ART_ASSET_COMPONENT_SOURCE_ROOT');
  const parent = raw.parent_component_id ?? raw.parentComponentId ?? raw.attach_to ?? raw.attachTo;
  const parentComponentId = parent === undefined || parent === null || parent === ''
    ? null
    : componentId(parent, null);
  const dependsOn = normalizeDependencies(raw.depends_on ?? raw.dependsOn ?? raw.dependencies);
  if (parentComponentId && !dependsOn.includes(parentComponentId)) dependsOn.push(parentComponentId);
  dependsOn.sort(keySort);
  return {
    component_id: componentIdValue,
    role,
    asset_id: genome.asset_id,
    asset_profile: genome.asset_profile,
    quality_tier: genome.quality_tier ?? rootQualityTier,
    genome_root: genome.genome_root,
    representation: {
      kind: representationKind,
      profile: representationProfile,
      source_root: sourceRoot,
      candidate_only: true,
      authoritative: false
    },
    parent_component_id: parentComponentId,
    depends_on: [...new Set(dependsOn)],
    transform_mm: vector(raw.transform_mm ?? raw.transformMm ?? raw.translation_mm ?? raw.translation, [0, 0, 0], {min: -1000000, max: 1000000, field: 'UNIVERSAL_ART_ASSET_COMPONENT_TRANSLATION_MM'}),
    rotation_deg: vector(raw.rotation_deg ?? raw.rotationDeg ?? raw.rotation, [0, 0, 0], {min: -360, max: 360, field: 'UNIVERSAL_ART_ASSET_COMPONENT_ROTATION_DEG'}),
    scale_milli: vector(raw.scale_milli ?? raw.scaleMilli ?? raw.scale, [1000, 1000, 1000], {min: 1, max: 100000, field: 'UNIVERSAL_ART_ASSET_COMPONENT_SCALE_MILLI'}),
    variant: integer(raw.variant ?? raw.material_variant ?? raw.materialVariant, 0, {min: 0, max: 255, field: 'UNIVERSAL_ART_ASSET_COMPONENT_VARIANT'}),
    provider_id: optionalText(raw.provider_id ?? raw.providerId, 'UNIVERSAL_ART_ASSET_COMPONENT_PROVIDER_ID'),
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false
  };
}

function componentEdges(components) {
  return components.flatMap(component => component.depends_on.map(dependency => ({from: component.component_id, to: dependency})))
    .sort((left, right) => `${left.from}:${left.to}`.localeCompare(`${right.from}:${right.to}`, 'en'));
}

function ensureComponentReferences(components) {
  const componentIds = new Set();
  for (const component of components) {
    fail(!componentIds.has(component.component_id), 'UNIVERSAL_ART_ASSET_COMPONENT_ID_DUPLICATE');
    componentIds.add(component.component_id);
  }
  for (const component of components) {
    for (const dependency of component.depends_on) {
      fail(componentIds.has(dependency), 'UNIVERSAL_ART_ASSET_COMPONENT_DEPENDENCY_UNKNOWN', `${component.component_id}:${dependency}`);
    }
    if (component.parent_component_id) {
      fail(componentIds.has(component.parent_component_id), 'UNIVERSAL_ART_ASSET_COMPONENT_PARENT_UNKNOWN', component.parent_component_id);
      fail(component.depends_on.includes(component.parent_component_id), 'UNIVERSAL_ART_ASSET_COMPONENT_PARENT_NOT_DEPENDENCY', component.component_id);
    }
  }
  return componentIds;
}

function topologicalOrder(components) {
  const componentIds = ensureComponentReferences(components);
  const indegree = new Map([...componentIds].map(id => [id, 0]));
  const dependents = new Map([...componentIds].map(id => [id, []]));
  for (const component of components) {
    indegree.set(component.component_id, component.depends_on.length);
    for (const dependency of component.depends_on) dependents.get(dependency).push(component.component_id);
  }
  for (const list of dependents.values()) list.sort(keySort);
  const ready = [...indegree.entries()].filter(([, degree]) => degree === 0).map(([id]) => id).sort(keySort);
  const order = [];
  while (ready.length) {
    const id = ready.shift();
    order.push(id);
    for (const dependent of dependents.get(id)) {
      const degree = indegree.get(dependent) - 1;
      indegree.set(dependent, degree);
      if (degree === 0) {
        ready.push(dependent);
        ready.sort(keySort);
      }
    }
  }
  fail(order.length === components.length, 'UNIVERSAL_ART_ASSET_COMPONENT_DEPENDENCY_CYCLE');
  return order;
}

function graphAxes(components) {
  return {
    component_profiles: [...new Set(components.map(component => component.asset_profile))].sort(keySort),
    representation_kinds: [...new Set(components.map(component => component.representation.kind))].sort(keySort),
    dependency_mode: components.some(component => component.depends_on.length > 0) ? 'directed-acyclic-graph' : 'independent-components'
  };
}

const graphAuthority = () => ({
  canonical_owner: 'RNCS',
  representation_owner: 'URRF',
  provider_can_write_authoritative_world_state: false,
  provider_can_commit: false,
  composition_can_commit: false,
  rncs_authority_required: true
});

function graphRootInput(graph) {
  return {
    format: UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT,
    version: UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION,
    composition_id: graph.composition_id,
    name: graph.name,
    description: graph.description,
    asset_id: graph.asset_id,
    asset_profile: graph.asset_profile,
    quality_tier: graph.quality_tier,
    genome_root: graph.genome_root,
    source_reality_root: graph.source_reality_root,
    component_count: graph.component_count,
    dependency_edge_count: graph.dependency_edge_count,
    components: graph.components,
    dependency_edges: graph.dependency_edges,
    topological_order: graph.topological_order,
    axes: graph.axes,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: graphAuthority()
  };
}

function normalizeStoredComponent(value) {
  const raw = record(value);
  const component = normalizeComponent({
    component_id: raw.component_id,
    role: raw.role,
    representation: raw.representation,
    parent_component_id: raw.parent_component_id,
    depends_on: raw.depends_on,
    transform_mm: raw.transform_mm,
    rotation_deg: raw.rotation_deg,
    scale_milli: raw.scale_milli,
    variant: raw.variant,
    provider_id: raw.provider_id,
    authoritative: raw.authoritative,
    candidate_only: raw.candidate_only,
    canonical_write_authorized: raw.canonical_write_authorized
  }, {
    asset_id: raw.asset_id,
    asset_profile: raw.asset_profile,
    quality_tier: raw.quality_tier,
    genome_root: raw.genome_root,
    representation_contract: {geometry: {representation: raw.representation?.kind}}
  }, 0, raw.quality_tier);
  return {
    ...component,
    asset_id: text(raw.asset_id, null, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSET_ID', 256),
    asset_profile: text(raw.asset_profile, null, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSET_PROFILE', 32),
    quality_tier: text(raw.quality_tier, null, 'UNIVERSAL_ART_ASSET_COMPONENT_QUALITY_TIER', 16),
    genome_root: optionalRoot(raw.genome_root, 'UNIVERSAL_ART_ASSET_COMPONENT_GENOME_ROOT')
  };
}

function validateStoredComponent(component) {
  const expected = normalizeStoredComponent(component);
  fail(JSON.stringify(component) === JSON.stringify(expected), 'UNIVERSAL_ART_ASSET_COMPONENT_NOT_NORMALIZED');
  fail(UNIVERSAL_ART_ASSET_PROFILES.includes(component.asset_profile), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSET_PROFILE_INVALID');
  fail(UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(component.quality_tier), 'UNIVERSAL_ART_ASSET_COMPONENT_QUALITY_TIER_INVALID');
  fail(hexRoot(component.genome_root), 'UNIVERSAL_ART_ASSET_COMPONENT_GENOME_ROOT_INVALID');
  return expected;
}

export function createUniversalArtAssetComponentGraph(input = {}) {
  const value = record(input);
  const rootGenome = resolveGenome(value.genome ?? value.asset_genome ?? value, {
    asset_profile: value.asset_profile ?? value.profile ?? 'prop',
    asset_kind: value.asset_kind,
    quality_tier: value.quality_tier ?? value.qualityTier ?? 'AAA',
    description: value.description ?? value.name ?? 'URRF composed art asset',
    seed: value.seed ?? 'seed:urrf-universal-art-asset-component-graph'
  });
  const rawComponents = value.components ?? value.parts;
  fail(Array.isArray(rawComponents) && rawComponents.length >= 1 && rawComponents.length <= 128, 'UNIVERSAL_ART_ASSET_COMPONENT_COUNT_INVALID');
  const components = rawComponents.map((rawInput, index) => {
    const raw = record(rawInput);
    const role = raw.role ?? `component-${index + 1}`;
    const componentGenome = resolveGenome(raw.genome ?? raw.asset_genome ?? raw, {
      asset_profile: raw.asset_profile ?? raw.profile ?? 'prop',
      asset_kind: raw.asset_kind,
      quality_tier: raw.quality_tier ?? raw.qualityTier ?? rootGenome.quality_tier,
      description: raw.description ?? `${rootGenome.display_name} · ${role}`,
      seed: raw.seed ?? `seed:urrf-component-${index + 1}`
    });
    return normalizeComponent(raw, componentGenome, index, rootGenome.quality_tier);
  }).sort((left, right) => keySort(left.component_id, right.component_id));
  ensureComponentReferences(components);
  const edges = componentEdges(components);
  const order = topologicalOrder(components);
  const compositionId = text(
    value.composition_id ?? value.compositionId,
    stableId('urrf-universal-art-asset-component-graph', {genome_root: rootGenome.genome_root, component_ids: components.map(component => component.component_id)}),
    'UNIVERSAL_ART_ASSET_COMPONENT_COMPOSITION_ID',
    160
  );
  const graph = {
    format: UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT,
    version: UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION,
    composition_id: compositionId,
    name: text(value.name, rootGenome.display_name, 'UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_NAME', 160),
    description: text(value.description, rootGenome.description ?? rootGenome.display_name, 'UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_DESCRIPTION', TEXT_LIMIT),
    asset_id: rootGenome.asset_id,
    asset_profile: rootGenome.asset_profile,
    quality_tier: rootGenome.quality_tier,
    genome_root: rootGenome.genome_root,
    source_reality_root: optionalRoot(value.source_reality_root ?? value.sourceRealityRoot, 'UNIVERSAL_ART_ASSET_COMPONENT_SOURCE_REALITY_ROOT'),
    component_count: components.length,
    dependency_edge_count: edges.length,
    components,
    dependency_edges: edges,
    topological_order: order,
    axes: graphAxes(components),
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: graphAuthority(),
    component_graph_root: ''
  };
  return seal(graph, 'component_graph_root');
}

export function verifyUniversalArtAssetComponentGraph(graph, {genome = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!graph || typeof graph !== 'object' || Array.isArray(graph)) return {valid: false, errors: ['UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_NOT_OBJECT'], component_graph_root: null};
  try {
    check(graph.format === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT, 'FORMAT_INVALID');
    check(graph.version === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION, 'VERSION_INVALID');
    check(nonEmptyText(graph.composition_id) && graph.composition_id.length <= 160, 'COMPOSITION_ID_INVALID');
    check(nonEmptyText(graph.name) && graph.name.length <= 160, 'NAME_INVALID');
    check(nonEmptyText(graph.description) && graph.description.length <= TEXT_LIMIT, 'DESCRIPTION_INVALID');
    check(nonEmptyText(graph.asset_id), 'ASSET_ID_INVALID');
    check(UNIVERSAL_ART_ASSET_PROFILES.includes(graph.asset_profile), 'ASSET_PROFILE_INVALID');
    check(UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(graph.quality_tier), 'QUALITY_TIER_INVALID');
    check(hexRoot(graph.genome_root), 'GENOME_ROOT_INVALID');
    check(graph.source_reality_root === null || hexRoot(graph.source_reality_root), 'SOURCE_REALITY_ROOT_INVALID');
    check(Array.isArray(graph.components) && graph.components.length >= 1 && graph.components.length <= 128, 'COMPONENTS_INVALID');
    const components = Array.isArray(graph.components) ? graph.components.map(component => {
      try {
        return validateStoredComponent(component);
      } catch (error) {
        errors.push(`COMPONENT_INVALID:${error.message}`);
        return null;
      }
    }) : [];
    const validComponents = components.filter(Boolean);
    check(validComponents.length === components.length, 'COMPONENT_VALIDATION_FAILED');
    check(JSON.stringify(graph.components) === JSON.stringify([...validComponents].sort((left, right) => keySort(left.component_id, right.component_id))), 'COMPONENT_ORDER_INVALID');
    const componentIds = new Set(validComponents.map(component => component.component_id));
    check(componentIds.size === validComponents.length, 'COMPONENT_ID_SET_INVALID');
    for (const component of validComponents) {
      for (const dependency of component.depends_on) check(componentIds.has(dependency), `DEPENDENCY_UNKNOWN:${component.component_id}:${dependency}`);
    }
    const expectedEdges = componentEdges(validComponents);
    check(graph.dependency_edge_count === expectedEdges.length, 'DEPENDENCY_EDGE_COUNT_MISMATCH');
    check(JSON.stringify(graph.dependency_edges) === JSON.stringify(expectedEdges), 'DEPENDENCY_EDGES_MISMATCH');
    let expectedOrder = [];
    try {
      expectedOrder = topologicalOrder(validComponents);
    } catch (error) {
      errors.push(`TOPOLOGICAL_ORDER_EXCEPTION:${error.message}`);
    }
    check(JSON.stringify(graph.topological_order) === JSON.stringify(expectedOrder), 'TOPOLOGICAL_ORDER_MISMATCH');
    check(graph.component_count === validComponents.length, 'COMPONENT_COUNT_MISMATCH');
    check(JSON.stringify(graph.axes) === JSON.stringify(graphAxes(validComponents)), 'AXES_MISMATCH');
    check(graph.candidate_only === true && graph.authoritative === false && graph.canonical_write_authorized === false, 'AUTHORITY_BOUNDARY_INVALID');
    check(JSON.stringify(graph.authority) === JSON.stringify(graphAuthority()), 'AUTHORITY_INVALID');
    if (genome !== null) {
      const genomeVerification = verifyUniversalArtAssetGenome(genome);
      check(genomeVerification.valid, `GENOME_CONTEXT_INVALID:${genomeVerification.errors.join(',')}`);
      check(graph.genome_root === genome.genome_root, 'GENOME_CONTEXT_ROOT_MISMATCH');
      check(graph.asset_id === genome.asset_id, 'GENOME_CONTEXT_ASSET_ID_MISMATCH');
      check(graph.asset_profile === genome.asset_profile, 'GENOME_CONTEXT_PROFILE_MISMATCH');
      check(graph.quality_tier === genome.quality_tier, 'GENOME_CONTEXT_QUALITY_TIER_MISMATCH');
    }
    const actualRoot = graph.component_graph_root;
    check(hexRoot(actualRoot) && actualRoot === rootHash(graphRootInput(graph)), 'COMPONENT_GRAPH_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, component_graph_root: graph.component_graph_root ?? null};
}

function lowerNodeId(compositionId, componentIdValue) {
  return `component:${compositionId}:${componentIdValue}`;
}

function loweringRootInput(lowering) {
  const copy = clone(lowering);
  delete copy.lowering_root;
  return copy;
}

export function lowerUniversalArtAssetComponentGraph(input = {}, options = {}) {
  const value = record(input);
  const graph = value.format === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT
    ? clone(value)
    : createUniversalArtAssetComponentGraph({...value, ...record(options)});
  const verification = verifyUniversalArtAssetComponentGraph(graph);
  fail(verification.valid, 'UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_INVALID', verification.errors.join(','));
  const componentsById = new Map(graph.components.map(component => [component.component_id, component]));
  const nodes = graph.topological_order.map((componentIdValue, index) => {
    const component = componentsById.get(componentIdValue);
    return {
      id: lowerNodeId(graph.composition_id, component.component_id),
      index,
      component_id: component.component_id,
      parent_component_id: component.parent_component_id,
      depends_on: [...component.depends_on],
      role: component.role,
      asset_id: component.asset_id,
      asset_profile: component.asset_profile,
      quality_tier: component.quality_tier,
      genome_root: component.genome_root,
      representation: clone(component.representation),
      transform: {
        translation_mm: [...component.transform_mm],
        translation: component.transform_mm.map(value => value / 1000),
        rotation_deg: [...component.rotation_deg],
        scale_milli: [...component.scale_milli],
        scale: component.scale_milli.map(value => value / 1000)
      },
      provider_input: {
        asset_id: component.asset_id,
        asset_profile: component.asset_profile,
        quality_tier: component.quality_tier,
        genome_root: component.genome_root,
        component_id: component.component_id,
        role: component.role,
        representation_kind: component.representation.kind,
        representation_profile: component.representation.profile,
        dependency_component_ids: [...component.depends_on],
        provider_id: component.provider_id,
        execution_status: 'NOT_EXECUTED',
        candidate_only: true,
        authoritative: false
      },
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false
    };
  });
  const componentRootIndex = {};
  for (const component of graph.components) {
    componentRootIndex[component.genome_root] ??= [];
    componentRootIndex[component.genome_root].push(component.component_id);
  }
  for (const ids of Object.values(componentRootIndex)) ids.sort(keySort);
  const base = {
    format: UNIVERSAL_ART_ASSET_COMPONENT_LOWERING_FORMAT,
    version: UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION,
    lowering_id: stableId('urrf-universal-art-asset-component-lowering', {
      component_graph_root: graph.component_graph_root,
      topological_order: graph.topological_order
    }),
    component_graph_root: graph.component_graph_root,
    source_reality_root: graph.source_reality_root,
    asset_id: graph.asset_id,
    asset_profile: graph.asset_profile,
    quality_tier: graph.quality_tier,
    composition_id: graph.composition_id,
    runtime_consumer: 'URRF_PROVIDER_PIPELINE_OR_VSR',
    execution_status: 'NOT_EXECUTED',
    component_count: nodes.length,
    dependency_edge_count: graph.dependency_edge_count,
    nodes,
    component_root_index: Object.fromEntries(Object.entries(componentRootIndex).sort(([left], [right]) => keySort(left, right))),
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    authority: {
      canonical_owner: 'RNCS',
      representation_owner: 'URRF',
      provider_can_write_authoritative_world_state: false,
      provider_can_commit: false,
      lowering_can_commit: false,
      rncs_authority_required: true
    }
  };
  return seal(base, 'lowering_root');
}

export function verifyUniversalArtAssetComponentLowering(lowering, {graph = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!lowering || typeof lowering !== 'object' || Array.isArray(lowering)) return {valid: false, errors: ['UNIVERSAL_ART_ASSET_COMPONENT_LOWERING_NOT_OBJECT'], lowering_root: null};
  try {
    check(lowering.format === UNIVERSAL_ART_ASSET_COMPONENT_LOWERING_FORMAT, 'FORMAT_INVALID');
    check(lowering.version === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION, 'VERSION_INVALID');
    check(nonEmptyText(lowering.lowering_id), 'LOWERING_ID_INVALID');
    check(hexRoot(lowering.component_graph_root), 'COMPONENT_GRAPH_ROOT_INVALID');
    check(lowering.source_reality_root === null || hexRoot(lowering.source_reality_root), 'SOURCE_REALITY_ROOT_INVALID');
    check(nonEmptyText(lowering.asset_id), 'ASSET_ID_INVALID');
    check(UNIVERSAL_ART_ASSET_PROFILES.includes(lowering.asset_profile), 'ASSET_PROFILE_INVALID');
    check(UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(lowering.quality_tier), 'QUALITY_TIER_INVALID');
    check(lowering.runtime_consumer === 'URRF_PROVIDER_PIPELINE_OR_VSR', 'RUNTIME_CONSUMER_INVALID');
    check(lowering.execution_status === 'NOT_EXECUTED', 'EXECUTION_STATUS_INVALID');
    check(Array.isArray(lowering.nodes) && lowering.nodes.length >= 1 && lowering.nodes.length <= 128, 'NODES_INVALID');
    const nodes = Array.isArray(lowering.nodes) ? lowering.nodes : [];
    check(lowering.component_count === nodes.length, 'COMPONENT_COUNT_MISMATCH');
    check(nodes.every((node, index) => node && node.index === index && nonEmptyText(node.component_id) && nonEmptyText(node.id) && nonEmptyText(node.role) && hexRoot(node.genome_root)), 'NODE_HEADER_INVALID');
    const nodeIds = nodes.map(node => node.component_id);
    check(new Set(nodeIds).size === nodeIds.length, 'NODE_COMPONENT_ID_SET_INVALID');
    check(nodes.every(node => Array.isArray(node.depends_on) && node.depends_on.every(dependency => nodeIds.includes(dependency))), 'NODE_DEPENDENCY_INVALID');
    check(nodes.every(node => UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS.includes(node.representation?.kind) && nonEmptyText(node.representation?.profile) && (node.representation?.source_root === null || hexRoot(node.representation?.source_root))), 'NODE_REPRESENTATION_INVALID');
    check(nodes.every(node => Array.isArray(node.transform?.translation_mm) && node.transform.translation_mm.length === 3 && Array.isArray(node.transform?.rotation_deg) && node.transform.rotation_deg.length === 3 && Array.isArray(node.transform?.scale_milli) && node.transform.scale_milli.length === 3), 'NODE_TRANSFORM_INVALID');
    check(nodes.every(node => node.provider_input?.execution_status === 'NOT_EXECUTED' && node.provider_input?.candidate_only === true && node.provider_input?.authoritative === false), 'NODE_PROVIDER_INPUT_AUTHORITY_INVALID');
    check(lowering.dependency_edge_count === nodes.reduce((count, node) => count + node.depends_on.length, 0), 'DEPENDENCY_EDGE_COUNT_MISMATCH');
    check(lowering.candidate_only === true && lowering.authoritative === false && lowering.canonical_write_authorized === false, 'AUTHORITY_BOUNDARY_INVALID');
    check(lowering.authority?.canonical_owner === 'RNCS' && lowering.authority?.representation_owner === 'URRF' && lowering.authority?.provider_can_write_authoritative_world_state === false && lowering.authority?.provider_can_commit === false && lowering.authority?.lowering_can_commit === false && lowering.authority?.rncs_authority_required === true, 'AUTHORITY_INVALID');
    if (graph !== null) {
      const graphVerification = verifyUniversalArtAssetComponentGraph(graph);
      check(graphVerification.valid, `GRAPH_CONTEXT_INVALID:${graphVerification.errors.join(',')}`);
      check(lowering.component_graph_root === graph.component_graph_root, 'GRAPH_CONTEXT_ROOT_MISMATCH');
      check(lowering.source_reality_root === graph.source_reality_root, 'GRAPH_CONTEXT_REALITY_ROOT_MISMATCH');
      check(lowering.asset_id === graph.asset_id && lowering.asset_profile === graph.asset_profile && lowering.quality_tier === graph.quality_tier, 'GRAPH_CONTEXT_ASSET_MISMATCH');
      check(nodes.map(node => node.component_id).join('|') === graph.topological_order.join('|'), 'GRAPH_CONTEXT_ORDER_MISMATCH');
    }
    const actualRoot = lowering.lowering_root;
    check(hexRoot(actualRoot) && actualRoot === rootHash(loweringRootInput(lowering)), 'LOWERING_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, lowering_root: lowering.lowering_root ?? null};
}

function indexedValue(value, key) {
  if (value instanceof Map) return value.get(key);
  return record(value)[key];
}

function componentDirectoryName(index, componentIdValue) {
  const slug = String(componentIdValue)
    .replace(/[^A-Za-z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || `component-${index + 1}`;
  return `${String(index + 1).padStart(3, '0')}-${slug}`;
}

function writeJson(filePath, value) {
  fs.writeFileSync(filePath, `${JSON.stringify(value, null, 2)}\n`, 'utf8');
}

function componentExecutionContext({graph, component, dependencyBindings}) {
  return seal({
    format: UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_CONTEXT_FORMAT,
    version: UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION,
    component_graph_root: graph.component_graph_root,
    source_reality_root: graph.source_reality_root,
    component_id: component.component_id,
    parent_component_id: component.parent_component_id,
    depends_on: [...component.depends_on],
    dependency_bindings: dependencyBindings,
    candidate_only: true,
    authoritative: false,
    context_root: ''
  }, 'context_root');
}

function componentProviderCandidates(value) {
  if (Array.isArray(value)) return value;
  return value === undefined || value === null ? [] : [value];
}

function componentExecutionStatus(run) {
  if (run?.status === 'CANDIDATE_PROVIDER_PIPELINE_EXECUTED') return 'COMPLETED';
  if (run?.status === 'CANDIDATE_PROVIDER_PIPELINE_FAILED') return 'FAILED';
  if (run?.status === 'CANDIDATE_PROVIDER_PIPELINE_NOT_RUN') return 'NOT_RUN';
  return 'BLOCKED';
}

function componentExecutionResultRoot(execution) {
  return execution?.stages?.at(-1)?.output?.result_root ?? null;
}

function componentExecutionSummary({graph, component, index, context, genome = null, plan = null, run = null, artifact = null, status, failureCode = null, outputDirectory = null}) {
  const execution = run?.execution ?? null;
  return {
    index,
    component_id: component.component_id,
    role: component.role,
    asset_id: component.asset_id,
    asset_profile: component.asset_profile,
    quality_tier: component.quality_tier,
    genome_root: genome?.genome_root ?? component.genome_root,
    depends_on: [...component.depends_on],
    dependency_bindings: clone(context.dependency_bindings ?? []),
    parent_component_id: component.parent_component_id,
    context_root: context.context_root,
    plan_root: plan?.pipeline_root ?? null,
    execution_root: execution?.execution_root ?? null,
    artifact_root: artifact?.artifact_root ?? null,
    output_root: execution?.output?.output_root ?? null,
    result_root: componentExecutionResultRoot(execution),
    pipeline_status: run?.status ?? 'NOT_RUN',
    execution_attempted: execution?.execution_attempted ?? false,
    execution_performed: execution?.execution_performed ?? false,
    status,
    failure_code: failureCode,
    output_directory: outputDirectory,
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    graph_root: graph.component_graph_root
  };
}

function componentExecutionAuthority() {
  return {
    canonical_owner: 'RNCS',
    representation_owner: 'URRF',
    provider_can_write_authoritative_world_state: false,
    provider_can_commit: false,
    composition_can_commit: false,
    rncs_authority_required: true
  };
}

function componentExecutionExpectedStatus(components) {
  if (components.length > 0 && components.every(component => component.status === 'COMPLETED')) return 'CANDIDATE_COMPONENT_GRAPH_EXECUTED';
  if (components.some(component => component.status === 'FAILED')) return 'CANDIDATE_COMPONENT_GRAPH_FAILED';
  if (components.some(component => component.status === 'COMPLETED')) return 'CANDIDATE_COMPONENT_GRAPH_BLOCKED';
  if (components.every(component => component.status === 'NOT_RUN')) return 'CANDIDATE_COMPONENT_GRAPH_NOT_RUN';
  return 'CANDIDATE_COMPONENT_GRAPH_BLOCKED';
}

function componentExecutionSummaryCounts(components) {
  return {
    component_count: components.length,
    completed_count: components.filter(component => component.status === 'COMPLETED').length,
    failed_count: components.filter(component => component.status === 'FAILED').length,
    blocked_count: components.filter(component => component.status === 'BLOCKED').length,
    not_run_count: components.filter(component => component.status === 'NOT_RUN').length,
    planned_count: components.filter(component => component.plan_root !== null).length,
    artifact_count: components.filter(component => component.artifact_root !== null).length
  };
}

/**
 * Execute one existing URRF Provider Pipeline for each component in a rooted
 * component graph. Dependency result/output roots are passed in a sealed
 * request context to the next component, while the existing Provider Job /
 * Result / Failure lifecycle remains the only execution primitive. A missing
 * component Genome or incomplete dependency blocks that component; no path
 * can promote a component or the aggregate into RNCS world truth.
 */
export function executeUniversalArtAssetComponentGraph({
  graph: graphInput = null,
  genomes = null,
  component_genomes = null,
  componentGenomes = null,
  root_genome = null,
  rootGenome = null,
  outDir = null,
  providers_by_component = null,
  providersByComponent = null,
  provider_runners_by_component = null,
  providerRunnersByComponent = null,
  providerTimeout = 60000,
  execution_id = null,
  executionId = null
} = {}) {
  const graph = graphInput?.format === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT
    ? clone(graphInput)
    : createUniversalArtAssetComponentGraph(graphInput ?? {});
  const graphVerification = verifyUniversalArtAssetComponentGraph(graph);
  fail(graphVerification.valid, 'UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_INVALID', graphVerification.errors.join(','));
  const genomeMap = component_genomes ?? componentGenomes ?? genomes;
  const providerMap = providers_by_component ?? providersByComponent;
  const runnerMap = provider_runners_by_component ?? providerRunnersByComponent;
  const resolvedRootGenome = root_genome ?? rootGenome;
  const outputDirectory = outDir === null || outDir === undefined ? null : path.resolve(String(outDir));
  if (outputDirectory) fs.mkdirSync(outputDirectory, {recursive: true});
  const componentById = new Map(graph.components.map(component => [component.component_id, component]));
  const records = new Map();
  const details = [];
  for (const [index, componentIdValue] of graph.topological_order.entries()) {
    const component = componentById.get(componentIdValue);
    const dependencyBindings = component.depends_on.map(dependency => {
      const dependencyRecord = records.get(dependency);
      return {
        component_id: dependency,
        status: dependencyRecord?.status ?? 'NOT_RUN',
        execution_root: dependencyRecord?.execution_root ?? null,
        output_root: dependencyRecord?.output_root ?? null,
        result_root: dependencyRecord?.result_root ?? null
      };
    });
    const context = componentExecutionContext({graph, component, dependencyBindings});
    const candidateGenome = indexedValue(genomeMap, componentIdValue)
      ?? (component.genome_root === graph.genome_root ? resolvedRootGenome : null);
    let genome = null;
    let plan = null;
    let run = null;
    let artifact = null;
    let status = 'BLOCKED';
    let failureCode = null;
    let componentDirectory = outputDirectory ? path.join(outputDirectory, componentDirectoryName(index, componentIdValue)) : null;
    if (!candidateGenome) {
      failureCode = 'COMPONENT_GENOME_REQUIRED';
    } else {
      try {
        const genomeVerification = verifyUniversalArtAssetGenome(candidateGenome);
        fail(genomeVerification.valid, 'COMPONENT_GENOME_INVALID', genomeVerification.errors.join(','));
        fail(candidateGenome.genome_root === component.genome_root, 'COMPONENT_GENOME_ROOT_MISMATCH');
        fail(candidateGenome.asset_id === component.asset_id, 'COMPONENT_GENOME_ASSET_ID_MISMATCH');
        fail(candidateGenome.asset_profile === component.asset_profile, 'COMPONENT_GENOME_PROFILE_MISMATCH');
        fail(candidateGenome.quality_tier === component.quality_tier, 'COMPONENT_GENOME_QUALITY_TIER_MISMATCH');
        genome = clone(candidateGenome);
        const providerCandidates = componentProviderCandidates(indexedValue(providerMap, componentIdValue));
        const provider = providerCandidates[0] ?? null;
        const providerRunner = indexedValue(runnerMap, componentIdValue) ?? null;
        plan = createUniversalArtAssetProviderPipelinePlan({
          genome,
          provider,
          providers: providerCandidates,
          providerRunner
        });
        const dependenciesReady = dependencyBindings.every(binding => binding.status === 'COMPLETED' && hexRoot(binding.result_root) && hexRoot(binding.output_root));
        if (!dependenciesReady) {
          failureCode = 'COMPONENT_DEPENDENCY_NOT_COMPLETED';
        } else {
          if (componentDirectory) fs.mkdirSync(componentDirectory, {recursive: true});
          run = executeUniversalArtAssetProviderPipeline({
            genome,
            plan,
            outDir: componentDirectory,
            provider,
            providers: providerCandidates,
            providerRunner,
            providerTimeout,
            request_context: context,
            execution_id: stableId('urrf-component-pipeline-execution', {graph: graph.component_graph_root, component: component.component_id, context: context.context_root})
          });
          status = componentExecutionStatus(run);
          failureCode = status === 'COMPLETED' ? null : (run.execution?.stages?.find(stage => stage.failure_code)?.failure_code ?? 'COMPONENT_PIPELINE_NOT_COMPLETED');
          if (run.execution) {
            artifact = createUniversalArtAssetProviderPipelineArtifact({
              genome,
              plan: run.plan,
              execution: run.execution,
              output_directory: componentDirectory,
              artifact_id: stableId('urrf-component-pipeline-artifact', {graph: graph.component_graph_root, component: component.component_id, execution: run.execution.execution_root})
            });
          }
        }
      } catch (error) {
        failureCode = nonEmptyText(error?.code) ? error.code : 'COMPONENT_PIPELINE_FAILED';
        status = 'FAILED';
      }
    }
    const summary = componentExecutionSummary({graph, component, index, context, genome, plan, run, artifact, status, failureCode, outputDirectory: componentDirectory});
    records.set(component.component_id, summary);
    details.push({component: summary, genome, plan, execution: run?.execution ?? null, artifact});
    if (componentDirectory && plan) {
      writeJson(path.join(componentDirectory, 'universal-art-asset-provider-pipeline.json'), plan);
      if (run?.execution) writeJson(path.join(componentDirectory, 'universal-art-asset-provider-pipeline-execution.json'), run.execution);
      if (artifact) writeJson(path.join(componentDirectory, 'universal-art-asset-provider-pipeline-artifact.json'), artifact);
    }
  }
  const components = graph.topological_order.map(componentIdValue => records.get(componentIdValue));
  const status = componentExecutionExpectedStatus(components);
  const checks = {
    graph_binding: graphVerification.valid && components.every(component => component.graph_root === graph.component_graph_root),
    topological_order: components.every((component, index) => component.index === index && component.component_id === graph.topological_order[index]),
    dependency_binding: components.every(component => component.dependency_bindings.length === component.depends_on.length
      && component.dependency_bindings.every(binding => {
        const dependencyRecord = records.get(binding.component_id);
        return Boolean(dependencyRecord)
          && dependencyRecord.status === binding.status
          && dependencyRecord.execution_root === binding.execution_root
          && dependencyRecord.output_root === binding.output_root
          && dependencyRecord.result_root === binding.result_root
          && dependencyRecord.index < component.index;
      })),
    execution_truthfulness: components.every(component => component.status === 'COMPLETED'
      ? hexRoot(component.execution_root) && hexRoot(component.artifact_root) && hexRoot(component.output_root)
      : component.status === 'BLOCKED' || component.status === 'FAILED' || component.status === 'NOT_RUN'),
    authority_boundary: components.every(component => component.candidate_only === true && component.authoritative === false && component.canonical_write_authorized === false)
  };
  const base = {
    format: UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_FORMAT,
    version: UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION,
    execution_id: executionId ?? execution_id ?? stableId('urrf-universal-art-asset-component-execution', {graph: graph.component_graph_root, components}),
    source: 'urrf-component-graph-executor',
    component_graph_root: graph.component_graph_root,
    source_reality_root: graph.source_reality_root,
    asset_id: graph.asset_id,
    asset_profile: graph.asset_profile,
    quality_tier: graph.quality_tier,
    component_count: components.length,
    components,
    summary: componentExecutionSummaryCounts(components),
    checks,
    status,
    execution_attempted: components.some(component => component.execution_attempted === true),
    execution_performed: status === 'CANDIDATE_COMPONENT_GRAPH_EXECUTED',
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    aaa_ready: false,
    release_ready: false,
    authority: componentExecutionAuthority(),
    component_execution_root: ''
  };
  const execution = seal(base, 'component_execution_root');
  if (outputDirectory) writeJson(path.join(outputDirectory, 'universal-art-asset-component-graph-execution.json'), execution);
  return {status, output_directory: outputDirectory, graph, execution, components, componentExecutions: details};
}

export function verifyUniversalArtAssetComponentExecution(receipt, {graph = null, componentExecutions = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object' || Array.isArray(receipt)) return {valid: false, errors: ['UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_NOT_OBJECT'], component_execution_root: null};
  try {
    check(receipt.format === UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_FORMAT, 'FORMAT_INVALID');
    check(receipt.version === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION, 'VERSION_INVALID');
    check(nonEmptyText(receipt.execution_id), 'EXECUTION_ID_INVALID');
    check(receipt.source === 'urrf-component-graph-executor', 'SOURCE_INVALID');
    check(hexRoot(receipt.component_graph_root), 'GRAPH_ROOT_INVALID');
    check(receipt.source_reality_root === null || hexRoot(receipt.source_reality_root), 'SOURCE_REALITY_ROOT_INVALID');
    check(nonEmptyText(receipt.asset_id) && UNIVERSAL_ART_ASSET_PROFILES.includes(receipt.asset_profile) && UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(receipt.quality_tier), 'ASSET_BINDING_INVALID');
    check(Array.isArray(receipt.components) && receipt.components.length >= 1 && receipt.components.length <= 128, 'COMPONENTS_INVALID');
    const components = Array.isArray(receipt.components) ? receipt.components : [];
    check(receipt.component_count === components.length, 'COMPONENT_COUNT_MISMATCH');
    const componentIds = components.map(component => component?.component_id);
    check(componentIds.every(nonEmptyText) && new Set(componentIds).size === componentIds.length, 'COMPONENT_IDS_INVALID');
    const componentById = new Map(components.map(component => [component?.component_id, component]));
    check(components.every((component, index) => component?.index === index && component?.component_id === componentIds[index] && nonEmptyText(component?.role) && nonEmptyText(component?.asset_id) && UNIVERSAL_ART_ASSET_PROFILES.includes(component?.asset_profile) && UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(component?.quality_tier) && hexRoot(component?.genome_root) && hexRoot(component?.context_root)), 'COMPONENT_HEADER_INVALID');
    check(components.every(component => Array.isArray(component?.depends_on) && component.depends_on.every(dependency => componentById.has(dependency))), 'COMPONENT_DEPENDENCIES_INVALID');
    check(components.every(component => Array.isArray(component?.dependency_bindings)
      && component.dependency_bindings.length === component.depends_on.length
      && component.dependency_bindings.every(binding => {
        const dependency = componentById.get(binding?.component_id);
        return Boolean(dependency)
          && dependency.index < component.index
          && dependency.status === binding.status
          && dependency.execution_root === binding.execution_root
          && dependency.output_root === binding.output_root
          && dependency.result_root === binding.result_root;
      })
      && JSON.stringify(component.dependency_bindings.map(binding => binding.component_id).sort(keySort)) === JSON.stringify([...component.depends_on].sort(keySort))), 'COMPONENT_DEPENDENCY_BINDINGS_INVALID');
    check(components.every(component => component?.plan_root === null || hexRoot(component.plan_root)), 'COMPONENT_PLAN_ROOT_INVALID');
    check(components.every(component => component?.execution_root === null || hexRoot(component.execution_root)), 'COMPONENT_EXECUTION_ROOT_INVALID');
    check(components.every(component => component?.artifact_root === null || hexRoot(component.artifact_root)), 'COMPONENT_ARTIFACT_ROOT_INVALID');
    check(components.every(component => component?.output_root === null || hexRoot(component.output_root)), 'COMPONENT_OUTPUT_ROOT_INVALID');
    check(components.every(component => component?.result_root === null || hexRoot(component.result_root)), 'COMPONENT_RESULT_ROOT_INVALID');
    check(components.every(component => ['COMPLETED', 'FAILED', 'BLOCKED', 'NOT_RUN'].includes(component?.status)), 'COMPONENT_STATUS_INVALID');
    check(components.every(component => typeof component?.execution_attempted === 'boolean' && typeof component?.execution_performed === 'boolean'), 'COMPONENT_EXECUTION_FLAGS_INVALID');
    check(components.every(component => component.execution_performed === (component.status === 'COMPLETED')), 'COMPONENT_EXECUTION_STATUS_MISMATCH');
    check(components.every(component => component.status === 'COMPLETED' ? component.failure_code === null : nonEmptyText(component.failure_code)), 'COMPONENT_FAILURE_BINDING_INVALID');
    check(components.every(component => component.candidate_only === true && component.authoritative === false && component.canonical_write_authorized === false), 'COMPONENT_AUTHORITY_INVALID');
    const expectedStatus = componentExecutionExpectedStatus(components);
    check(receipt.status === expectedStatus, 'STATUS_MISMATCH');
    const expectedSummary = componentExecutionSummaryCounts(components);
    for (const [key, value] of Object.entries(expectedSummary)) check(receipt.summary?.[key] === value, `SUMMARY_${key.toUpperCase()}_MISMATCH`);
    const expectedChecks = {
      graph_binding: components.every(component => component.graph_root === receipt.component_graph_root),
      topological_order: components.every((component, index) => component.index === index),
      dependency_binding: components.every(component => component.dependency_bindings.length === component.depends_on.length
        && component.dependency_bindings.every(binding => {
          const dependency = componentById.get(binding.component_id);
          return Boolean(dependency)
            && dependency.index < component.index
            && dependency.status === binding.status
            && dependency.execution_root === binding.execution_root
            && dependency.output_root === binding.output_root
            && dependency.result_root === binding.result_root;
        })
        && JSON.stringify(component.dependency_bindings.map(binding => binding.component_id).sort(keySort)) === JSON.stringify([...component.depends_on].sort(keySort))),
      execution_truthfulness: components.every(component => component.status === 'COMPLETED' ? hexRoot(component.execution_root) && hexRoot(component.artifact_root) && hexRoot(component.output_root) : true),
      authority_boundary: components.every(component => component.candidate_only === true && component.authoritative === false && component.canonical_write_authorized === false)
    };
    for (const [key, value] of Object.entries(expectedChecks)) check(receipt.checks?.[key] === value, `CHECK_${key.toUpperCase()}_MISMATCH`);
    check(receipt.execution_attempted === components.some(component => component.execution_attempted === true), 'EXECUTION_ATTEMPTED_MISMATCH');
    check(receipt.execution_performed === (receipt.status === 'CANDIDATE_COMPONENT_GRAPH_EXECUTED'), 'EXECUTION_PERFORMED_MISMATCH');
    check(receipt.candidate_only === true && receipt.authoritative === false && receipt.canonical_write_authorized === false && receipt.aaa_ready === false && receipt.release_ready === false, 'AUTHORITY_BOUNDARY_INVALID');
    check(JSON.stringify(receipt.authority) === JSON.stringify(componentExecutionAuthority()), 'AUTHORITY_INVALID');
    if (graph !== null) {
      const graphVerification = verifyUniversalArtAssetComponentGraph(graph);
      check(graphVerification.valid, `GRAPH_CONTEXT_INVALID:${graphVerification.errors.join(',')}`);
      check(receipt.component_graph_root === graph.component_graph_root, 'GRAPH_CONTEXT_ROOT_MISMATCH');
      check(receipt.source_reality_root === graph.source_reality_root, 'GRAPH_CONTEXT_REALITY_ROOT_MISMATCH');
      check(receipt.asset_id === graph.asset_id && receipt.asset_profile === graph.asset_profile && receipt.quality_tier === graph.quality_tier, 'GRAPH_CONTEXT_ASSET_MISMATCH');
      check(JSON.stringify(componentIds) === JSON.stringify(graph.topological_order), 'GRAPH_CONTEXT_ORDER_MISMATCH');
      for (const component of components) {
        const graphComponent = graph.components.find(candidate => candidate.component_id === component.component_id);
        check(Boolean(graphComponent) && graphComponent.asset_id === component.asset_id && graphComponent.asset_profile === component.asset_profile && graphComponent.quality_tier === component.quality_tier && graphComponent.genome_root === component.genome_root && JSON.stringify(graphComponent.depends_on) === JSON.stringify(component.depends_on), `GRAPH_COMPONENT_BINDING_INVALID:${component.component_id}`);
      }
    }
    if (componentExecutions !== null) {
      const detailById = new Map(componentExecutions.map(detail => [detail?.component?.component_id, detail]));
      for (const component of components) {
        const detail = detailById.get(component.component_id);
        check(Boolean(detail), `COMPONENT_DETAIL_MISSING:${component.component_id}`);
        if (!detail) continue;
        check(detail.component?.context_root === component.context_root && detail.component?.execution_root === component.execution_root && detail.component?.artifact_root === component.artifact_root, `COMPONENT_DETAIL_ROOT_MISMATCH:${component.component_id}`);
        check(JSON.stringify(detail.component?.dependency_bindings) === JSON.stringify(component.dependency_bindings), `COMPONENT_DETAIL_DEPENDENCY_BINDING_MISMATCH:${component.component_id}`);
        if (detail.genome) {
          const genomeVerification = verifyUniversalArtAssetGenome(detail.genome);
          check(genomeVerification.valid && detail.genome.genome_root === component.genome_root, `COMPONENT_DETAIL_GENOME_INVALID:${component.component_id}`);
        }
        if (detail.plan && detail.genome) {
          const planVerification = verifyUniversalArtAssetProviderPipelinePlan(detail.plan, {genome: detail.genome});
          check(planVerification.valid && detail.plan.pipeline_root === component.plan_root, `COMPONENT_DETAIL_PLAN_INVALID:${component.component_id}`);
        }
        if (detail.execution && detail.plan && detail.genome) {
          const executionVerification = verifyUniversalArtAssetProviderPipelineExecution(detail.execution, {plan: detail.plan, genome: detail.genome});
          check(executionVerification.valid && detail.execution.execution_root === component.execution_root, `COMPONENT_DETAIL_EXECUTION_INVALID:${component.component_id}`);
          for (const stage of detail.execution.stages ?? []) {
            const context = stage.request?.context;
            const contextCopy = clone(context ?? {});
            const actualContextRoot = contextCopy.context_root;
            delete contextCopy.context_root;
            check(context?.format === UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_CONTEXT_FORMAT && context?.version === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION && context?.component_graph_root === receipt.component_graph_root && context?.component_id === component.component_id && context?.context_root === component.context_root && JSON.stringify(context?.dependency_bindings) === JSON.stringify(component.dependency_bindings) && hexRoot(actualContextRoot) && actualContextRoot === rootHash(contextCopy), `COMPONENT_DETAIL_CONTEXT_INVALID:${component.component_id}`);
          }
        }
        if (detail.artifact && detail.plan && detail.execution && detail.genome) {
          const artifactVerification = verifyUniversalArtAssetProviderPipelineArtifact(detail.artifact, {genome: detail.genome, plan: detail.plan, execution: detail.execution});
          check(artifactVerification.valid && detail.artifact.artifact_root === component.artifact_root, `COMPONENT_DETAIL_ARTIFACT_INVALID:${component.component_id}`);
        }
      }
    }
    const copy = clone(receipt);
    const actual = copy.component_execution_root;
    delete copy.component_execution_root;
    check(hexRoot(actual) && actual === rootHash(copy), 'ROOT_MISMATCH');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, component_execution_root: receipt.component_execution_root ?? null};
}
