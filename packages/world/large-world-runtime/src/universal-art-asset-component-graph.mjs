import fs from 'node:fs';
import path from 'node:path';
import {createHash} from 'node:crypto';
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
import {
  createRepresentationRef,
  verifyRepresentationRef
} from '@taowind/rncs-core-contract';

export const UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT = 'urrf.universal-art-asset-component-graph.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_LOWERING_FORMAT = 'urrf.universal-art-asset-component-lowering.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_FORMAT = 'urrf.universal-art-asset-component-execution.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_CONTEXT_FORMAT = 'urrf.universal-art-asset-component-execution-context.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION = '0.1.0';
export const UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_FORMAT = 'urrf.universal-art-asset-component-assembly.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_VERSION = UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION;
export const UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT = 'urrf.universal-art-asset-component-representation-directory.v0.1';
export const UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_VERSION = UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_VERSION;

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

function componentAssemblyAuthority() {
  return {
    canonical_owner: 'RNCS',
    representation_owner: 'URRF',
    provider_can_write_authoritative_world_state: false,
    provider_can_commit: false,
    composition_can_commit: false,
    rncs_authority_required: true
  };
}

function componentAssemblyTransform(value = {}) {
  const raw = record(value);
  return {
    translation_mm: vector(raw.transform_mm ?? raw.transformMm ?? raw.translation_mm ?? raw.translationMm, [0, 0, 0], {
      min: -1000000,
      max: 1000000,
      field: 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_TRANSLATION_MM'
    }),
    rotation_deg: vector(raw.rotation_deg ?? raw.rotationDeg, [0, 0, 0], {
      min: -360,
      max: 360,
      field: 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_ROTATION_DEG'
    }),
    scale_milli: vector(raw.scale_milli ?? raw.scaleMilli, [1000, 1000, 1000], {
      min: 1,
      max: 100000,
      field: 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_SCALE_MILLI'
    })
  };
}

function normalizeComponentAssemblyPath(value) {
  const result = String(value ?? '').trim().replaceAll('\\', '/');
  fail(
    result.length > 0
      && result.length <= 1024
      && !result.startsWith('/')
      && !path.win32.isAbsolute(result)
      && !result.includes('\0')
      && !result.split('/').includes('..'),
    'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_RESOURCE_PATH_INVALID'
  );
  return result;
}

function componentAssemblyResourceFormat(filePath) {
  const lower = String(filePath ?? '').toLowerCase();
  if (lower.endsWith('.glb') || lower.endsWith('.gltf')) return 'model/gltf-binary';
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  if (lower.endsWith('.ktx2')) return 'image/ktx2';
  if (lower.endsWith('.json')) return 'application/json';
  if (lower.endsWith('.wav')) return 'audio/wav';
  if (lower.endsWith('.mp4')) return 'video/mp4';
  return 'application/octet-stream';
}

function componentAssemblyResourceRole(file) {
  const role = String(file?.role ?? '').trim();
  return role || 'asset-output';
}

function componentAssemblyResourcePathIsSafe(resource) {
  try {
    const relativePath = normalizeComponentAssemblyPath(resource?.path);
    const outputDirectory = String(resource?.output_directory ?? '').trim();
    if (!outputDirectory) return false;
    const root = path.resolve(outputDirectory);
    const target = path.resolve(root, relativePath);
    const relative = path.relative(root, target);
    return relative.length > 0
      && !relative.startsWith(`..${path.sep}`)
      && !path.isAbsolute(relative);
  } catch {
    return false;
  }
}

function componentAssemblyResourceLocation(resource) {
  if (!componentAssemblyResourcePathIsSafe(resource)) {
    return {valid: false, code: 'RESOURCE_PATH_INVALID', detail: String(resource?.path ?? '')};
  }
  const outputDirectory = path.resolve(String(resource.output_directory));
  const relativePath = normalizeComponentAssemblyPath(resource.path);
  const absolutePath = path.resolve(outputDirectory, relativePath);
  if (!fs.existsSync(outputDirectory)) {
    return {valid: false, code: 'RESOURCE_OUTPUT_DIRECTORY_MISSING', detail: outputDirectory};
  }
  if (!fs.existsSync(absolutePath)) {
    return {valid: false, code: 'RESOURCE_FILE_MISSING', detail: absolutePath};
  }
  try {
    const realRoot = fs.realpathSync(outputDirectory);
    const realFile = fs.realpathSync(absolutePath);
    const relativeRealPath = path.relative(realRoot, realFile);
    if (!relativeRealPath || relativeRealPath.startsWith(`..${path.sep}`) || path.isAbsolute(relativeRealPath)) {
      return {valid: false, code: 'RESOURCE_SYMLINK_ESCAPE', detail: absolutePath};
    }
  } catch (error) {
    return {valid: false, code: 'RESOURCE_REALPATH_FAILED', detail: error.message};
  }
  return {valid: true, outputDirectory, relativePath, absolutePath};
}

function componentAssemblyResourceBytes(resource) {
  const location = componentAssemblyResourceLocation(resource);
  if (!location.valid) return location;
  try {
    const bytes = fs.readFileSync(location.absolutePath);
    return {
      valid: true,
      ...location,
      byte_length: bytes.length,
      sha256: createHash('sha256').update(bytes).digest('hex')
    };
  } catch (error) {
    return {valid: false, code: 'RESOURCE_READ_FAILED', detail: error.message};
  }
}

function componentAssemblyResource({graph, component, artifact, file}) {
  const stageId = text(file?.stage_id, null, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_STAGE_ID', 160);
  const role = componentAssemblyResourceRole(file);
  const outputDirectory = artifact?.output_directory;
  fail(nonEmptyText(outputDirectory), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_OUTPUT_DIRECTORY_REQUIRED');
  const byteLength = integer(file?.byte_length, null, {
    min: 1,
    max: Number.MAX_SAFE_INTEGER,
    field: 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_BYTE_LENGTH'
  });
  const sha256 = String(file?.sha256 ?? '').trim();
  fail(hexRoot(sha256), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_SHA256_INVALID');
  const stage = artifact.stages.find(candidate => candidate.stage_id === stageId);
  fail(Boolean(stage), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_STAGE_UNKNOWN', stageId);
  const stageRelativePath = 'stages/' + String(stage.index + 1).padStart(3, '0') + '-' + stage.stage_id + '/' + normalizeComponentAssemblyPath(file?.path);
  const relativePath = normalizeComponentAssemblyPath(stageRelativePath);
  return seal({
    resource_id: stableId('urrf-universal-art-asset-component-resource', {
      component_graph_root: graph.component_graph_root,
      component_id: component.component_id,
      stage_id: stageId,
      role,
      path: relativePath,
      sha256
    }),
    component_id: component.component_id,
    stage_id: stageId,
    role,
    representation_kind: component.representation.kind,
    format: componentAssemblyResourceFormat(relativePath),
    path: relativePath,
    output_directory: path.resolve(String(outputDirectory)),
    byte_length: byteLength,
    sha256,
    declared_sha256: optionalRoot(file?.declared_sha256, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_DECLARED_SHA256'),
    artifact_root: artifact.artifact_root,
    output_root: artifact.output.output_root,
    result_root: stage.output?.result_root ?? null,
    candidate_only: true,
    authoritative: false,
    resource_root: ''
  }, 'resource_root');
}

function componentAssemblyProviderBindings(detail) {
  const stages = Array.isArray(detail?.artifact?.stages) ? detail.artifact.stages : [];
  return stages.map(stage => ({
    index: stage.index,
    stage_id: stage.stage_id,
    provider_id: stage.provider_id ?? null,
    provider_root: stage.provider_root ?? null,
    provider_source: stage.provider_source ?? null,
    route_status: stage.route_status ?? null,
    status: stage.status,
    result_root: stage.output?.result_root ?? stage.result_root ?? null,
    output_root: stage.output?.output_root ?? null
  }));
}

function componentAssemblyResources({graph, component, detail}) {
  const artifact = detail?.artifact ?? null;
  if (!artifact) return [];
  const files = Array.isArray(artifact.output?.files) ? artifact.output.files : [];
  for (const file of files) {
    fail(nonEmptyText(file?.path), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_RESOURCE_PATH_REQUIRED', component.component_id);
    fail(hexRoot(file?.sha256), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_RESOURCE_SHA256_REQUIRED', component.component_id);
    fail(Number.isSafeInteger(file?.byte_length) && file.byte_length > 0, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_RESOURCE_LENGTH_REQUIRED', component.component_id);
  }
  return [...files]
    .sort((left, right) => `${left.stage_id}:${left.path}:${left.role ?? ''}`.localeCompare(`${right.stage_id}:${right.path}:${right.role ?? ''}`, 'en'))
    .map(file => componentAssemblyResource({graph, component, artifact, file}));
}

function componentAssemblyComponent({graph, component, executionComponent, detail, index}) {
  fail(Boolean(executionComponent), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_EXECUTION_COMPONENT_REQUIRED', component.component_id);
  const artifact = detail?.artifact ?? null;
  if (artifact) {
    const artifactVerification = verifyUniversalArtAssetProviderPipelineArtifact(artifact, {
      genome: detail.genome,
      plan: detail.plan,
      execution: detail.execution
    });
    fail(artifactVerification.valid, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_ARTIFACT_INVALID', artifactVerification.errors.join(','));
    fail(artifact.artifact_root === executionComponent.artifact_root, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_ARTIFACT_ROOT_MISMATCH', component.component_id);
  }
  const resources = componentAssemblyResources({graph, component, detail});
  const status = executionComponent.status;
  const resourceStatus = status === 'NOT_RUN' ? 'NOT_RUN' : resources.length > 0 ? 'BOUND' : 'MISSING';
  const providerBindings = componentAssemblyProviderBindings(detail);
  return {
    component: seal({
      index,
      component_id: component.component_id,
      role: component.role,
      asset_id: component.asset_id,
      asset_profile: component.asset_profile,
      quality_tier: component.quality_tier,
      genome_root: component.genome_root,
      parent_component_id: component.parent_component_id,
      depends_on: [...component.depends_on],
      dependency_bindings: clone(executionComponent.dependency_bindings),
      provider_bindings: providerBindings,
      representation: clone(component.representation),
      transform: componentAssemblyTransform(component),
      pipeline_status: executionComponent.pipeline_status,
      status,
      failure_code: executionComponent.failure_code,
      artifact_root: executionComponent.artifact_root,
      execution_root: executionComponent.execution_root,
      output_root: executionComponent.output_root,
      result_root: executionComponent.result_root,
      resource_status: resourceStatus,
      resource_count: resources.length,
      resource_ids: resources.map(resource => resource.resource_id),
      graph_root: graph.component_graph_root,
      candidate_only: true,
      authoritative: false,
      canonical_write_authorized: false,
      component_root: ''
    }, 'component_root'),
    resources
  };
}

function componentAssemblyResourceIndex(resources) {
  return Object.fromEntries([...resources]
    .sort((left, right) => left.resource_id.localeCompare(right.resource_id, 'en'))
    .map(resource => [resource.resource_id, {
      component_id: resource.component_id,
      stage_id: resource.stage_id,
      role: resource.role,
      path: resource.path,
      byte_length: resource.byte_length,
      sha256: resource.sha256,
      resource_root: resource.resource_root
    }]));
}

function componentAssemblySummary(components, resources) {
  return {
    component_count: components.length,
    completed_count: components.filter(component => component.status === 'COMPLETED').length,
    failed_count: components.filter(component => component.status === 'FAILED').length,
    blocked_count: components.filter(component => component.status === 'BLOCKED').length,
    not_run_count: components.filter(component => component.status === 'NOT_RUN').length,
    resource_count: resources.length,
    bound_component_count: components.filter(component => component.resource_status === 'BOUND').length,
    missing_resource_component_count: components.filter(component => component.resource_status === 'MISSING').length
  };
}

function componentAssemblyFileVerification(resources, verifyFiles) {
  if (!verifyFiles) {
    return {
      mode: 'NOT_RUN',
      checked_count: 0,
      passed_count: 0,
      failed_count: 0,
      failures: []
    };
  }
  const failures = [];
  let checkedCount = 0;
  let passedCount = 0;
  for (const resource of resources) {
    checkedCount++;
    const actual = componentAssemblyResourceBytes(resource);
    if (!actual.valid) {
      failures.push({resource_id: resource.resource_id, code: actual.code, detail: actual.detail});
      continue;
    }
    if (actual.byte_length !== resource.byte_length) {
      failures.push({resource_id: resource.resource_id, code: 'RESOURCE_BYTE_LENGTH_MISMATCH', detail: `${actual.byte_length}:${resource.byte_length}`});
      continue;
    }
    if (actual.sha256 !== resource.sha256) {
      failures.push({resource_id: resource.resource_id, code: 'RESOURCE_SHA256_MISMATCH', detail: `${actual.sha256}:${resource.sha256}`});
      continue;
    }
    passedCount++;
  }
  failures.sort((left, right) => left.resource_id.localeCompare(right.resource_id, 'en'));
  return {
    mode: 'LOCAL_BYTES',
    checked_count: checkedCount,
    passed_count: passedCount,
    failed_count: failures.length,
    failures
  };
}

function componentAssemblyRootInput(assembly) {
  const copy = clone(assembly);
  delete copy.component_assembly_root;
  return copy;
}

function componentAssemblyReady(assembly, checks) {
  return assembly.execution_status === 'CANDIDATE_COMPONENT_GRAPH_EXECUTED'
    && assembly.components.every(component => component.status === 'COMPLETED' && component.resource_status === 'BOUND' && component.resource_count > 0)
    && Object.values(checks).every(value => value === true);
}

/**
 * Package component Pipeline Artifacts into one candidate-only reusable
 * resource catalog. It preserves each component's local transform and
 * dependency edges, binds every resource to its artifact/output/result roots,
 * and verifies local bytes when materialized files are available. It does not
 * merge meshes, infer missing representations, or grant commit authority.
 */
export function createUniversalArtAssetComponentAssembly({
  graph: graphInput = null,
  component_graph = null,
  componentGraph = null,
  execution: executionInput = null,
  component_execution = null,
  componentExecution = null,
  component_executions = null,
  componentExecutions = null,
  root_transform = null,
  rootTransform = null,
  scene_id = null,
  sceneId = null,
  world_id = null,
  worldId = null,
  verify_files = null,
  verifyFiles = null
} = {}) {
  const graphValue = graphInput ?? component_graph ?? componentGraph;
  const executionValue = executionInput ?? component_execution ?? componentExecution;
  const graph = graphValue?.format === UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT
    ? clone(graphValue)
    : createUniversalArtAssetComponentGraph(graphValue ?? {});
  const execution = executionValue?.format === UNIVERSAL_ART_ASSET_COMPONENT_EXECUTION_FORMAT
    ? clone(executionValue)
    : null;
  fail(Boolean(execution), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_EXECUTION_REQUIRED');
  const details = component_executions ?? componentExecutions;
  fail(Array.isArray(details) && details.length === graph.components.length, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_DETAILS_REQUIRED');
  const graphVerification = verifyUniversalArtAssetComponentGraph(graph);
  fail(graphVerification.valid, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_GRAPH_INVALID', graphVerification.errors.join(','));
  const executionVerification = verifyUniversalArtAssetComponentExecution(execution, {
    graph,
    componentExecutions: details
  });
  fail(executionVerification.valid, 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_EXECUTION_INVALID', executionVerification.errors.join(','));
  const executionById = new Map(execution.components.map(component => [component.component_id, component]));
  const detailById = new Map(details.map(detail => [detail?.component?.component_id, detail]));
  const graphById = new Map(graph.components.map(component => [component.component_id, component]));
  const built = graph.topological_order.map((componentIdValue, index) => {
    const component = graphById.get(componentIdValue);
    const executionComponent = executionById.get(componentIdValue);
    const detail = detailById.get(componentIdValue);
    fail(Boolean(component && executionComponent && detail), 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_COMPONENT_CONTEXT_MISSING', componentIdValue);
    return componentAssemblyComponent({graph, component, executionComponent, detail, index});
  });
  const components = built.map(entry => entry.component);
  const resources = built.flatMap(entry => entry.resources);
  const resourceIndex = componentAssemblyResourceIndex(resources);
  const resolvedSceneId = text(
    scene_id ?? sceneId,
    `urrf-component-assembly:${graph.component_graph_root.slice(0, 16)}`,
    'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_SCENE_ID',
    160
  );
  const resolvedWorldId = text(
    world_id ?? worldId,
    'world:urrf-component-assembly',
    'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_WORLD_ID',
    160
  );
  const resolvedRootTransform = componentAssemblyTransform(root_transform ?? rootTransform ?? {});
  const verifyPhysicalFiles = verify_files ?? verifyFiles ?? true;
  fail(typeof verifyPhysicalFiles === 'boolean', 'UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_VERIFY_FILES_INVALID');
  const fileVerification = componentAssemblyFileVerification(resources, verifyPhysicalFiles);
  const checks = {
    graph_binding: graph.component_graph_root === graphVerification.component_graph_root
      && components.every(component => component.graph_root === graph.component_graph_root),
    execution_binding: hexRoot(execution.component_execution_root)
      && execution.component_graph_root === graph.component_graph_root
      && components.every(component => component.status !== 'COMPLETED' || (hexRoot(component.execution_root) && hexRoot(component.output_root) && hexRoot(component.result_root))),
    component_order: components.every((component, index) => component.index === index && component.component_id === graph.topological_order[index]),
    dependency_binding: components.every(component => component.dependency_bindings.length === component.depends_on.length
      && component.dependency_bindings.every(binding => {
        const dependency = components.find(candidate => candidate.component_id === binding.component_id);
        return Boolean(dependency) && dependency.index < component.index;
      })
      && JSON.stringify(component.dependency_bindings.map(binding => binding.component_id).sort(keySort)) === JSON.stringify([...component.depends_on].sort(keySort))),
    artifact_binding: components.every(component => component.status !== 'COMPLETED'
      || (hexRoot(component.artifact_root) && component.resource_count > 0)),
    resource_binding: resources.every(resource => graphById.has(resource.component_id)
      && hexRoot(resource.artifact_root)
      && hexRoot(resource.output_root)
      && hexRoot(resource.sha256))
      && components.every(component => component.status !== 'COMPLETED' || component.resource_status === 'BOUND'),
    resource_path_safety: resources.every(componentAssemblyResourcePathIsSafe),
    resource_file_integrity: fileVerification.mode === 'LOCAL_BYTES'
      && fileVerification.failed_count === 0
      && fileVerification.checked_count === resources.length
      && fileVerification.passed_count === resources.length,
    transform_integrity: components.every(component => Array.isArray(component.transform?.translation_mm)
      && component.transform.translation_mm.length === 3
      && Array.isArray(component.transform?.rotation_deg)
      && component.transform.rotation_deg.length === 3
      && Array.isArray(component.transform?.scale_milli)
      && component.transform.scale_milli.length === 3),
    authority_boundary: components.every(component => component.candidate_only === true && component.authoritative === false && component.canonical_write_authorized === false)
  };
  const base = {
    format: UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_FORMAT,
    version: UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_VERSION,
    assembly_id: stableId('urrf-universal-art-asset-component-assembly', {
      component_graph_root: graph.component_graph_root,
      component_execution_root: execution.component_execution_root,
      scene_id: resolvedSceneId,
      world_id: resolvedWorldId,
      root_transform: resolvedRootTransform,
      resource_roots: resources.map(resource => resource.resource_root)
    }),
    source: 'urrf-component-graph-assembly',
    component_graph_root: graph.component_graph_root,
    component_execution_root: execution.component_execution_root,
    execution_status: execution.status,
    source_reality_root: graph.source_reality_root,
    scene_id: resolvedSceneId,
    world_id: resolvedWorldId,
    root_transform: resolvedRootTransform,
    component_count: components.length,
    components,
    resource_count: resources.length,
    resources,
    resource_index: resourceIndex,
    summary: componentAssemblySummary(components, resources),
    checks,
    file_verification: fileVerification,
    status: componentAssemblyReady({execution_status: execution.status, components}, checks)
      ? 'CANDIDATE_COMPONENT_ASSEMBLY_READY'
      : 'CANDIDATE_COMPONENT_ASSEMBLY_BLOCKED',
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    aaa_ready: false,
    release_ready: false,
    authority: componentAssemblyAuthority(),
    component_assembly_root: ''
  };
  return seal(base, 'component_assembly_root');
}

export function verifyUniversalArtAssetComponentAssembly(assembly, {
  graph = null,
  execution = null,
  componentExecutions = null,
  verifyFiles = true
} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!assembly || typeof assembly !== 'object' || Array.isArray(assembly)) {
    return {valid: false, errors: ['UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_NOT_OBJECT'], component_assembly_root: null};
  }
  try {
    check(assembly.format === UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_FORMAT, 'FORMAT_INVALID');
    check(assembly.version === UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_VERSION, 'VERSION_INVALID');
    check(nonEmptyText(assembly.assembly_id), 'ASSEMBLY_ID_INVALID');
    check(assembly.source === 'urrf-component-graph-assembly', 'SOURCE_INVALID');
    check(hexRoot(assembly.component_graph_root), 'GRAPH_ROOT_INVALID');
    check(hexRoot(assembly.component_execution_root), 'EXECUTION_ROOT_INVALID');
    check(['CANDIDATE_COMPONENT_GRAPH_EXECUTED', 'CANDIDATE_COMPONENT_GRAPH_FAILED', 'CANDIDATE_COMPONENT_GRAPH_BLOCKED', 'CANDIDATE_COMPONENT_GRAPH_NOT_RUN'].includes(assembly.execution_status), 'EXECUTION_STATUS_INVALID');
    check(assembly.source_reality_root === null || hexRoot(assembly.source_reality_root), 'SOURCE_REALITY_ROOT_INVALID');
    check(nonEmptyText(assembly.scene_id) && nonEmptyText(assembly.world_id), 'SCENE_WORLD_ID_INVALID');
    const rootTransform = record(assembly.root_transform);
    check(Array.isArray(rootTransform.translation_mm) && rootTransform.translation_mm.length === 3 && rootTransform.translation_mm.every(value => Number.isSafeInteger(value)), 'ROOT_TRANSLATION_INVALID');
    check(Array.isArray(rootTransform.rotation_deg) && rootTransform.rotation_deg.length === 3 && rootTransform.rotation_deg.every(value => Number.isSafeInteger(value)), 'ROOT_ROTATION_INVALID');
    check(Array.isArray(rootTransform.scale_milli) && rootTransform.scale_milli.length === 3 && rootTransform.scale_milli.every(value => Number.isSafeInteger(value) && value > 0), 'ROOT_SCALE_INVALID');
    const components = Array.isArray(assembly.components) ? assembly.components : [];
    const resources = Array.isArray(assembly.resources) ? assembly.resources : [];
    check(components.length >= 1 && components.length <= 128, 'COMPONENTS_INVALID');
    check(resources.length <= 16384, 'RESOURCES_INVALID');
    check(assembly.component_count === components.length, 'COMPONENT_COUNT_MISMATCH');
    check(assembly.resource_count === resources.length, 'RESOURCE_COUNT_MISMATCH');
    const componentIds = components.map(component => component?.component_id);
    const componentById = new Map(components.map(component => [component?.component_id, component]));
    check(componentIds.every(nonEmptyText) && new Set(componentIds).size === componentIds.length, 'COMPONENT_IDS_INVALID');
    check(components.every((component, index) => component?.index === index
      && component?.component_id === componentIds[index]
      && nonEmptyText(component?.role)
      && nonEmptyText(component?.asset_id)
      && UNIVERSAL_ART_ASSET_PROFILES.includes(component?.asset_profile)
      && UNIVERSAL_ART_ASSET_QUALITY_TIERS.includes(component?.quality_tier)
      && hexRoot(component?.genome_root)
      && ['COMPLETED', 'FAILED', 'BLOCKED', 'NOT_RUN'].includes(component?.status)
      && ['BOUND', 'MISSING', 'NOT_RUN'].includes(component?.resource_status)
      && typeof component?.pipeline_status === 'string'
      && (component?.failure_code === null || nonEmptyText(component?.failure_code))
      && (component?.artifact_root === null || hexRoot(component?.artifact_root))
      && (component?.execution_root === null || hexRoot(component?.execution_root))
      && (component?.output_root === null || hexRoot(component?.output_root))
      && (component?.result_root === null || hexRoot(component?.result_root))
      && Array.isArray(component?.resource_ids)
      && component?.resource_count === component.resource_ids.length
      && Array.isArray(component?.provider_bindings)
      && hexRoot(component?.graph_root)
      && hexRoot(component?.component_root)), 'COMPONENT_HEADER_INVALID');
    check(components.every(component => component?.candidate_only === true && component?.authoritative === false && component?.canonical_write_authorized === false), 'COMPONENT_AUTHORITY_INVALID');
    check(components.every(component => component?.status === 'COMPLETED'
      ? component.failure_code === null && component.resource_status === 'BOUND' && component.resource_count > 0
      : component.failure_code !== null), 'COMPONENT_STATUS_BINDING_INVALID');
    check(components.every(component => Array.isArray(component?.depends_on)
      && component.depends_on.every(dependency => componentById.has(dependency))
      && Array.isArray(component?.dependency_bindings)
      && component.dependency_bindings.length === component.depends_on.length
      && component.dependency_bindings.every(binding => {
        const dependency = componentById.get(binding?.component_id);
        return Boolean(dependency) && dependency.index < component.index
          && dependency.status === binding.status
          && dependency.execution_root === binding.execution_root
          && dependency.output_root === binding.output_root
          && dependency.result_root === binding.result_root;
      })
      && JSON.stringify(component.dependency_bindings.map(binding => binding.component_id).sort(keySort)) === JSON.stringify([...component.depends_on].sort(keySort))), 'DEPENDENCY_BINDING_INVALID');
    check(components.every(component => component.provider_bindings.every((binding, index) => binding?.index === index
      && nonEmptyText(binding?.stage_id)
      && (binding?.provider_id === null || nonEmptyText(binding?.provider_id))
      && (binding?.provider_root === null || hexRoot(binding?.provider_root))
      && (binding?.provider_source === null || nonEmptyText(binding?.provider_source))
      && (binding?.route_status === null || nonEmptyText(binding?.route_status))
      && nonEmptyText(binding?.status)
      && (binding?.result_root === null || hexRoot(binding?.result_root))
      && (binding?.output_root === null || hexRoot(binding?.output_root)))), 'PROVIDER_BINDING_INVALID');
    const resourceById = new Map(resources.map(resource => [resource?.resource_id, resource]));
    check(resources.every(resource => nonEmptyText(resource?.resource_id)
      && componentById.has(resource?.component_id)
      && nonEmptyText(resource?.stage_id)
      && nonEmptyText(resource?.role)
      && UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS.includes(resource?.representation_kind)
      && nonEmptyText(resource?.format)
      && nonEmptyText(resource?.path)
      && nonEmptyText(resource?.output_directory)
      && Number.isSafeInteger(resource?.byte_length) && resource.byte_length > 0
      && hexRoot(resource?.sha256)
      && (resource?.declared_sha256 === null || hexRoot(resource.declared_sha256))
      && hexRoot(resource?.artifact_root)
      && hexRoot(resource?.output_root)
      && (resource?.result_root === null || hexRoot(resource.result_root))
      && resource?.candidate_only === true
      && resource?.authoritative === false
      && hexRoot(resource?.resource_root)
      && componentAssemblyResourcePathIsSafe(resource)), 'RESOURCE_HEADER_INVALID');
    check(new Set(resources.map(resource => resource?.resource_id)).size === resources.length, 'RESOURCE_IDS_INVALID');
    check(resources.every(resource => componentById.get(resource?.component_id)?.provider_bindings.some(binding => binding.stage_id === resource.stage_id)), 'RESOURCE_PROVIDER_STAGE_BINDING_INVALID');
    check(components.every(component => component.resource_ids.every(resourceId => resourceById.has(resourceId)
      && resourceById.get(resourceId).component_id === component.component_id)), 'COMPONENT_RESOURCE_BINDING_INVALID');
    check(components.every(component => component.resource_count === resources.filter(resource => resource.component_id === component.component_id).length), 'COMPONENT_RESOURCE_COUNT_MISMATCH');
    check(rootHash(record(assembly.resource_index)) === rootHash(componentAssemblyResourceIndex(resources)), 'RESOURCE_INDEX_MISMATCH');
    check(assembly.summary?.component_count === components.length, 'SUMMARY_COMPONENT_COUNT_MISMATCH');
    check(assembly.summary?.completed_count === components.filter(component => component.status === 'COMPLETED').length, 'SUMMARY_COMPLETED_COUNT_MISMATCH');
    check(assembly.summary?.failed_count === components.filter(component => component.status === 'FAILED').length, 'SUMMARY_FAILED_COUNT_MISMATCH');
    check(assembly.summary?.blocked_count === components.filter(component => component.status === 'BLOCKED').length, 'SUMMARY_BLOCKED_COUNT_MISMATCH');
    check(assembly.summary?.not_run_count === components.filter(component => component.status === 'NOT_RUN').length, 'SUMMARY_NOT_RUN_COUNT_MISMATCH');
    check(assembly.summary?.resource_count === resources.length, 'SUMMARY_RESOURCE_COUNT_MISMATCH');
    check(assembly.summary?.bound_component_count === components.filter(component => component.resource_status === 'BOUND').length, 'SUMMARY_BOUND_COMPONENT_COUNT_MISMATCH');
    check(assembly.summary?.missing_resource_component_count === components.filter(component => component.resource_status === 'MISSING').length, 'SUMMARY_MISSING_RESOURCE_COUNT_MISMATCH');
    const fileVerification = record(assembly.file_verification);
    check(['LOCAL_BYTES', 'NOT_RUN'].includes(fileVerification.mode), 'FILE_VERIFICATION_MODE_INVALID');
    check(Number.isSafeInteger(fileVerification.checked_count) && fileVerification.checked_count >= 0, 'FILE_VERIFICATION_CHECKED_COUNT_INVALID');
    check(Number.isSafeInteger(fileVerification.passed_count) && fileVerification.passed_count >= 0, 'FILE_VERIFICATION_PASSED_COUNT_INVALID');
    check(Number.isSafeInteger(fileVerification.failed_count) && fileVerification.failed_count >= 0, 'FILE_VERIFICATION_FAILED_COUNT_INVALID');
    check(Array.isArray(fileVerification.failures) && fileVerification.failures.length === fileVerification.failed_count, 'FILE_VERIFICATION_FAILURES_INVALID');
    const structuralFileIntegrity = fileVerification.mode === 'LOCAL_BYTES'
      && fileVerification.checked_count === resources.length
      && fileVerification.passed_count === resources.length
      && fileVerification.failed_count === 0;
    if (verifyFiles && fileVerification.mode === 'LOCAL_BYTES') {
      const actualFileVerification = componentAssemblyFileVerification(resources, true);
      check(actualFileVerification.checked_count === fileVerification.checked_count
        && actualFileVerification.passed_count === fileVerification.passed_count
        && actualFileVerification.failed_count === fileVerification.failed_count
        && JSON.stringify(actualFileVerification.failures) === JSON.stringify(fileVerification.failures), 'FILE_VERIFICATION_BINDING_INVALID');
    }
    const expectedChecks = {
      graph_binding: hexRoot(assembly.component_graph_root) && components.every(component => component.graph_root === assembly.component_graph_root),
      execution_binding: hexRoot(assembly.component_execution_root)
        && components.every(component => component.status !== 'COMPLETED' || (hexRoot(component.execution_root) && hexRoot(component.output_root) && hexRoot(component.result_root))),
      component_order: components.every((component, index) => component.index === index),
      dependency_binding: components.every(component => component.dependency_bindings.length === component.depends_on.length
        && component.dependency_bindings.every(binding => {
          const dependency = componentById.get(binding.component_id);
          return Boolean(dependency) && dependency.index < component.index
            && dependency.status === binding.status
            && dependency.execution_root === binding.execution_root
            && dependency.output_root === binding.output_root
            && dependency.result_root === binding.result_root;
        })
        && JSON.stringify(component.dependency_bindings.map(binding => binding.component_id).sort(keySort)) === JSON.stringify([...component.depends_on].sort(keySort))),
      artifact_binding: components.every(component => component.status !== 'COMPLETED' || (hexRoot(component.artifact_root) && component.resource_count > 0)),
      resource_binding: resources.every(resource => componentById.has(resource.component_id) && hexRoot(resource.artifact_root) && hexRoot(resource.output_root) && hexRoot(resource.sha256))
        && components.every(component => component.status !== 'COMPLETED' || component.resource_status === 'BOUND'),
      resource_path_safety: resources.every(componentAssemblyResourcePathIsSafe),
      resource_file_integrity: structuralFileIntegrity,
      transform_integrity: components.every(component => Array.isArray(component.transform?.translation_mm) && component.transform.translation_mm.length === 3
        && Array.isArray(component.transform?.rotation_deg) && component.transform.rotation_deg.length === 3
        && Array.isArray(component.transform?.scale_milli) && component.transform.scale_milli.length === 3),
      authority_boundary: components.every(component => component.candidate_only === true && component.authoritative === false && component.canonical_write_authorized === false)
    };
    for (const [key, value] of Object.entries(expectedChecks)) check(assembly.checks?.[key] === value, `CHECK_${key.toUpperCase()}_MISMATCH`);
    const expectedStatus = componentAssemblyReady({execution_status: assembly.execution_status, components}, expectedChecks)
      ? 'CANDIDATE_COMPONENT_ASSEMBLY_READY'
      : 'CANDIDATE_COMPONENT_ASSEMBLY_BLOCKED';
    check(assembly.status === expectedStatus, 'STATUS_MISMATCH');
    check(assembly.candidate_only === true && assembly.authoritative === false && assembly.canonical_write_authorized === false && assembly.aaa_ready === false && assembly.release_ready === false, 'AUTHORITY_BOUNDARY_INVALID');
    check(JSON.stringify(assembly.authority) === JSON.stringify(componentAssemblyAuthority()), 'AUTHORITY_INVALID');
    if (graph !== null) {
      const graphVerification = verifyUniversalArtAssetComponentGraph(graph);
      check(graphVerification.valid, `GRAPH_CONTEXT_INVALID:${graphVerification.errors.join(',')}`);
      check(assembly.component_graph_root === graph.component_graph_root, 'GRAPH_CONTEXT_ROOT_MISMATCH');
      check(assembly.source_reality_root === graph.source_reality_root, 'GRAPH_CONTEXT_REALITY_ROOT_MISMATCH');
      check(JSON.stringify(componentIds) === JSON.stringify(graph.topological_order), 'GRAPH_CONTEXT_ORDER_MISMATCH');
      for (const component of components) {
        const graphComponent = graph.components.find(candidate => candidate.component_id === component.component_id);
        check(Boolean(graphComponent)
          && graphComponent.asset_id === component.asset_id
          && graphComponent.asset_profile === component.asset_profile
          && graphComponent.quality_tier === component.quality_tier
          && graphComponent.genome_root === component.genome_root
          && graphComponent.parent_component_id === component.parent_component_id
          && JSON.stringify(graphComponent.depends_on) === JSON.stringify(component.depends_on)
          && JSON.stringify(componentAssemblyTransform(graphComponent)) === JSON.stringify(component.transform)
          && JSON.stringify(graphComponent.representation) === JSON.stringify(component.representation), `GRAPH_COMPONENT_BINDING_INVALID:${component.component_id}`);
      }
    }
    if (execution !== null) {
      const executionVerification = verifyUniversalArtAssetComponentExecution(execution, {graph, componentExecutions});
      check(executionVerification.valid, `EXECUTION_CONTEXT_INVALID:${executionVerification.errors.join(',')}`);
      check(assembly.component_execution_root === execution.component_execution_root, 'EXECUTION_CONTEXT_ROOT_MISMATCH');
      check(assembly.execution_status === execution.status, 'EXECUTION_CONTEXT_STATUS_MISMATCH');
      check(JSON.stringify(componentIds) === JSON.stringify(execution.components.map(component => component.component_id)), 'EXECUTION_CONTEXT_ORDER_MISMATCH');
    }
    if (graph !== null && execution !== null && Array.isArray(componentExecutions)) {
      const executionById = new Map(execution.components.map(component => [component.component_id, component]));
      const detailById = new Map(componentExecutions.map(detail => [detail?.component?.component_id, detail]));
      const graphById = new Map(graph.components.map(component => [component.component_id, component]));
      for (const [index, componentIdValue] of graph.topological_order.entries()) {
        const expected = componentAssemblyComponent({
          graph,
          component: graphById.get(componentIdValue),
          executionComponent: executionById.get(componentIdValue),
          detail: detailById.get(componentIdValue),
          index
        });
        const actual = components[index];
        check(JSON.stringify(actual) === JSON.stringify(expected.component), `COMPONENT_CONTENT_MISMATCH:${componentIdValue}`);
        const actualResources = resources.filter(resource => resource.component_id === componentIdValue);
        check(JSON.stringify(actualResources) === JSON.stringify(expected.resources), `RESOURCE_CONTENT_MISMATCH:${componentIdValue}`);
      }
    }
    for (const component of components) {
      const copy = clone(component);
      const actualRoot = copy.component_root;
      delete copy.component_root;
      check(hexRoot(actualRoot) && actualRoot === rootHash(copy), `COMPONENT_ROOT_MISMATCH:${component.component_id}`);
    }
    for (const resource of resources) {
      const copy = clone(resource);
      const actualRoot = copy.resource_root;
      delete copy.resource_root;
      check(hexRoot(actualRoot) && actualRoot === rootHash(copy), `RESOURCE_ROOT_MISMATCH:${resource.resource_id}`);
    }
    const actualRoot = assembly.component_assembly_root;
    check(hexRoot(actualRoot) && actualRoot === rootHash(componentAssemblyRootInput(assembly)), 'ROOT_MISMATCH');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, component_assembly_root: assembly.component_assembly_root ?? null};
}

const UNIVERSAL_ART_ASSET_COMPONENT_VSR_CATALOG_FORMAT = 'vsr.spatial-asset-streaming.v0.1';
const UNIVERSAL_ART_ASSET_COMPONENT_RSR_OBSERVATION_FORMAT = 'rsr.representation-observation-candidate.v0.1';
const UNIVERSAL_ART_ASSET_COMPONENT_VSR_KINDS = Object.freeze(['mesh', 'texture', 'material', 'animation', 'audio', 'shader', 'other']);

function representationDirectoryVsrKind(representationKind, resource = null) {
  if (resource === null) {
    if (representationKind === 'mesh') return 'mesh';
    if (representationKind === 'material') return 'material';
    if (representationKind === 'animation') return 'animation';
    return 'other';
  }
  const role = String(resource.role ?? '').trim().toLowerCase();
  const format = String(resource.format ?? '').trim().toLowerCase();
  if (format.startsWith('image/')) return 'texture';
  if (format.startsWith('audio/')) return 'audio';
  if (role.includes('shader') || format.includes('shader')) return 'shader';
  if (role.includes('animation') || format.includes('animation')) return 'animation';
  if (role.includes('material') || role.includes('pbr')) return 'material';
  if (role.includes('mesh') || format.includes('gltf')) return 'mesh';
  if (representationKind === 'material' && role.length === 0) return 'material';
  if (representationKind === 'animation' && role.length === 0) return 'animation';
  return 'other';
}

function representationDirectoryVsrAssetView(asset) {
  return {
    id: asset.id,
    uri: asset.uri,
    format: asset.format ?? null,
    sha256: asset.sha256,
    byteLength: asset.byteLength,
    kind: asset.kind,
    dependencies: [...(asset.dependencies ?? [])].sort(keySort),
    cellIds: [...(asset.cellIds ?? [])].sort(keySort),
    priority: asset.priority ?? 0,
    metadata: asset.metadata ?? null
  };
}

function representationDirectoryVsrCatalogRoot(assets) {
  return rootHash(assets.map(representationDirectoryVsrAssetView).sort((left, right) => keySort(left.id, right.id)));
}

function representationDirectoryComponentResources(assembly, componentIdValue) {
  return assembly.resources
    .filter(resource => resource.component_id === componentIdValue)
    .sort((left, right) => keySort(left.resource_id, right.resource_id));
}

function representationDirectoryContentRoot(component, resources) {
  return rootHash({
    component_id: component.component_id,
    component_root: component.component_root,
    representation: component.representation,
    resources: resources.map(resource => ({
      resource_id: resource.resource_id,
      resource_root: resource.resource_root,
      format: resource.format,
      path: resource.path,
      byte_length: resource.byte_length,
      sha256: resource.sha256
    }))
  });
}

function representationDirectoryProviderBinding(component, resources) {
  const resourceStageIds = new Set(resources.map(resource => resource.stage_id));
  return [...(component.provider_bindings ?? [])]
    .filter(binding => resourceStageIds.has(binding.stage_id)
      && binding.status === 'COMPLETED'
      && nonEmptyText(binding.provider_id)
      && hexRoot(binding.provider_root))
    .sort((left, right) => right.index - left.index || keySort(left.stage_id, right.stage_id))[0] ?? null;
}

function representationDirectoryVsrAssetId(assembly, resource) {
  return stableId('urrf-vsr-component-resource', {
    component_assembly_root: assembly.component_assembly_root,
    resource_id: resource.resource_id,
    resource_root: resource.resource_root
  });
}

function representationDirectoryVsrAsset({assembly, component, resource, representation, resourceIdsByComponent}) {
  const dependencies = component.depends_on
    .flatMap(dependency => resourceIdsByComponent.get(dependency) ?? [])
    .sort(keySort);
  const kind = representationDirectoryVsrKind(component.representation.kind, resource);
  const assetId = representationDirectoryVsrAssetId(assembly, resource);
  return {
    id: assetId,
    uri: `candidate://urrf/${assembly.component_assembly_root}/${assetId}`,
    format: resource.format,
    sha256: resource.sha256,
    byteLength: resource.byte_length,
    kind,
    dependencies,
    cellIds: [component.component_id],
    priority: Math.max(1, 100000 - component.index * 1000 - resource.resource_id.length),
    metadata: {
      source: UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_FORMAT,
      assembly_root: assembly.component_assembly_root,
      component_id: component.component_id,
      component_root: component.component_root,
      representation_id: representation.representation_ref?.representation_id ?? null,
      representation_root: representation.representation_ref?.representation_root ?? null,
      representation_kind: component.representation.kind,
      representation_profile: component.representation.profile,
      vsr_kind: kind,
      import_status: 'NOT_EXECUTED',
      resource_id: resource.resource_id,
      resource_root: resource.resource_root,
      stage_id: resource.stage_id,
      role: resource.role,
      relative_path: resource.path,
      output_directory: resource.output_directory,
      byte_length: resource.byte_length,
      sha256: resource.sha256,
      transform: clone(component.transform),
      candidate_only: true,
      authoritative: false
    }
  };
}

function representationDirectoryRsrInput(representation) {
  const base = {
    target_contract: UNIVERSAL_ART_ASSET_COMPONENT_RSR_OBSERVATION_FORMAT,
    representation_id: representation.representation_ref?.representation_id ?? null,
    representation_root: representation.representation_ref?.representation_root ?? null,
    representation_kind: representation.representation_kind,
    content_root: representation.content_root,
    observation_kinds: ['bounds', 'lod', 'residency'],
    status: representation.representation_ref ? 'INPUT_READY' : 'BLOCKED',
    execution_status: 'NOT_EXECUTED',
    candidate_creation: 'DEFERRED_TO_RSR',
    reconstruction_candidate: null,
    canonical_state_proposal: null,
    authority: {
      provider_can_write_authoritative_world_state: false,
      rsr_can_promote_without_independent_evidence: false,
      rncs_authority_required: true
    },
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return seal(base, 'input_root');
}

function representationDirectoryEntry({assembly, component, resources, resourceIdsByComponent}) {
  const contentRoot = representationDirectoryContentRoot(component, resources);
  const provider = representationDirectoryProviderBinding(component, resources);
  const formats = [...new Set(resources.map(resource => resource.format))].sort(keySort);
  const catalogKinds = [...new Set(resources.map(resource => representationDirectoryVsrKind(component.representation.kind, resource)))].sort(keySort);
  const representationRef = provider && formats.length > 0
    ? createRepresentationRef({
      representation_id: stableId('urrf-component-representation', {
        component_assembly_root: assembly.component_assembly_root,
        component_id: component.component_id,
        content_root: contentRoot
      }),
      provider_id: provider.provider_id,
      provider_root: provider.provider_root,
      representation_kind: component.representation.kind,
      representation_formats: formats,
      content_root: contentRoot,
      source_uri: `candidate://urrf/${assembly.component_assembly_root}/${component.component_id}`,
      representation_profile: {
        profile_id: component.representation.profile,
        encoding: 'urrf-component-resource-catalog',
        fidelity: component.quality_tier,
        precision: 'provider-declared',
        formats
      },
      detail_policy: {
        mode: 'component-transform',
        selectors: ['component-graph', 'screen-space-size', 'representation-kind'],
        budget: {resource_count: resources.length}
      },
      residency_policy: {
        mode: 'paged-streaming',
        selectors: ['component-cell', 'resource-dependency-closure'],
        budget: {byte_length: resources.reduce((sum, resource) => sum + resource.byte_length, 0)}
      },
      authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
      availability: 'EXECUTED',
      provenance: {
        generator_version: UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_VERSION,
        parameters_root: component.genome_root
      },
      evidence: {
        provider_manifest_root: provider.provider_root,
        provider_result_root: provider.result_root,
        runtime_receipt_root: component.execution_root,
        notes: 'candidate component representation; VSR import and RSR observation remain separate runtime steps'
      }
    })
    : null;
  const representation = {
    component_id: component.component_id,
    component_root: component.component_root,
    representation_id: representationRef?.representation_id ?? null,
    representation_root: representationRef?.representation_root ?? null,
    representation_kind: component.representation.kind,
    representation_profile: component.representation.profile,
    content_root: contentRoot,
    resource_ids: resources.map(resource => resource.resource_id),
    transform: clone(component.transform),
    provider_stage_ids: component.provider_bindings.map(binding => binding.stage_id),
    provider_id: provider?.provider_id ?? null,
    provider_root: provider?.provider_root ?? null,
    representation_ref: representationRef,
    consumer_mapping: {
      vsr: {
        target_contract: UNIVERSAL_ART_ASSET_COMPONENT_VSR_CATALOG_FORMAT,
        catalog_kind: representationDirectoryVsrKind(component.representation.kind),
        catalog_kinds: catalogKinds,
        asset_ids: resources.map(resource => representationDirectoryVsrAssetId(assembly, resource)),
        stream_status: resources.length > 0 ? 'CATALOG_READY' : 'BLOCKED',
        direct_import_status: 'NOT_EXECUTED'
      },
      rsr: {
        target_contract: UNIVERSAL_ART_ASSET_COMPONENT_RSR_OBSERVATION_FORMAT,
        observation_input_status: representationRef ? 'INPUT_READY' : 'BLOCKED',
        observation_kinds: ['bounds', 'lod', 'residency'],
        execution_status: 'NOT_EXECUTED',
        reconstruction_status: 'FORBIDDEN_IN_THIS_LAYER'
      }
    },
    candidate_only: true,
    authoritative: false,
    entry_root: ''
  };
  return {
    entry: seal(representation, 'entry_root'),
    rsrInput: representationDirectoryRsrInput({...representation, representation_ref: representationRef})
  };
}

function representationDirectorySummary(entries, vsrAssets, rsrInputs) {
  const representationKindCounts = {};
  for (const entry of entries) representationKindCounts[entry.representation_kind] = (representationKindCounts[entry.representation_kind] ?? 0) + 1;
  return {
    representation_count: entries.length,
    reference_count: entries.filter(entry => entry.representation_ref !== null).length,
    resource_count: vsrAssets.length,
    vsr_asset_count: vsrAssets.length,
    rsr_input_count: rsrInputs.length,
    representation_kind_counts: Object.fromEntries(Object.entries(representationKindCounts).sort(([left], [right]) => keySort(left, right))),
    vsr_catalog_kind_counts: Object.fromEntries(Object.entries(vsrAssets.reduce((counts, asset) => {
      counts[asset.kind] = (counts[asset.kind] ?? 0) + 1;
      return counts;
    }, {})).sort(([left], [right]) => keySort(left, right)))
  };
}

function representationDirectoryAuthority() {
  return {
    canonical_owner: 'RNCS',
    representation_owner: 'URRF',
    provider_can_write_authoritative_world_state: false,
    provider_can_commit: false,
    composition_can_commit: false,
    rsr_can_promote_without_independent_evidence: false,
    rncs_authority_required: true
  };
}

function representationDirectoryRootInput(directory) {
  const copy = clone(directory);
  delete copy.directory_root;
  return copy;
}

function representationDirectoryReady(directory, checks) {
  return directory.assembly_status === 'CANDIDATE_COMPONENT_ASSEMBLY_READY'
    && directory.representations.every(entry => entry.representation_ref !== null)
    && directory.resources.length > 0
    && Object.values(checks).every(value => value === true);
}

function buildUniversalArtAssetComponentRepresentationDirectory(assembly) {
  const components = [...assembly.components].sort((left, right) => left.index - right.index);
  const resourcesByComponent = new Map(components.map(component => [component.component_id, representationDirectoryComponentResources(assembly, component.component_id)]));
  const resourceIdsByComponent = new Map([...resourcesByComponent.entries()].map(([componentIdValue, resources]) => [componentIdValue, resources.map(resource => representationDirectoryVsrAssetId(assembly, resource))]));
  const built = components.map(component => representationDirectoryEntry({
    assembly,
    component,
    resources: resourcesByComponent.get(component.component_id) ?? [],
    resourceIdsByComponent
  }));
  const representations = built.map(item => item.entry);
  const rsrInputs = built.map(item => item.rsrInput);
  const representationByComponent = new Map(representations.map(entry => [entry.component_id, entry]));
  const resources = components.flatMap(component => (resourcesByComponent.get(component.component_id) ?? []).map(resource => representationDirectoryVsrAsset({
    assembly,
    component,
    resource,
    representation: representationByComponent.get(component.component_id),
    resourceIdsByComponent
  })));
  const vsrCatalogRoot = representationDirectoryVsrCatalogRoot(resources);
  const rsrInputRoot = rootHash(rsrInputs);
  const checks = {
    assembly_binding: hexRoot(assembly.component_assembly_root),
    representation_reference_binding: representations.every(entry => entry.representation_ref === null || verifyRepresentationRef(entry.representation_ref).valid),
    provider_binding: representations.every(entry => entry.representation_ref === null || (nonEmptyText(entry.provider_id) && hexRoot(entry.provider_root) && entry.representation_ref.provider_id === entry.provider_id && entry.representation_ref.provider_root === entry.provider_root)),
    representation_kind_preservation: representations.every(entry => UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS.includes(entry.representation_kind)
      && (entry.representation_ref === null || entry.representation_ref.representation_kind === entry.representation_kind)
      && resources.filter(asset => asset.metadata?.component_id === entry.component_id).every(asset => asset.metadata?.representation_kind === entry.representation_kind)),
    representation_resource_binding: representations.every(entry => entry.resource_ids.every(resourceId => resources.some(asset => asset.metadata?.resource_id === resourceId && asset.metadata?.component_id === entry.component_id))
      && entry.consumer_mapping.vsr.asset_ids.length === entry.resource_ids.length),
    vsr_catalog_integrity: resources.every(asset => UNIVERSAL_ART_ASSET_COMPONENT_VSR_KINDS.includes(asset.kind)
      && nonEmptyText(asset.uri)
      && hexRoot(asset.sha256)
      && Number.isSafeInteger(asset.byteLength)
      && asset.byteLength > 0
      && asset.metadata?.candidate_only === true
      && asset.metadata?.authoritative === false)
      && vsrCatalogRoot === representationDirectoryVsrCatalogRoot(resources),
    rsr_observation_boundary: rsrInputs.every(input => input.target_contract === UNIVERSAL_ART_ASSET_COMPONENT_RSR_OBSERVATION_FORMAT
      && input.execution_status === 'NOT_EXECUTED'
      && input.reconstruction_candidate === null
      && input.canonical_state_proposal === null
      && input.authority?.rsr_can_promote_without_independent_evidence === false
      && input.candidate_only === true
      && input.authoritative === false
      && input.commit_status === 'NOT_COMMITTED'),
    transform_binding: representations.every(entry => Array.isArray(entry.transform?.translation_mm)
      && entry.transform.translation_mm.length === 3
      && Array.isArray(entry.transform?.rotation_deg)
      && entry.transform.rotation_deg.length === 3
      && Array.isArray(entry.transform?.scale_milli)
      && entry.transform.scale_milli.length === 3),
    authority_boundary: representations.every(entry => entry.candidate_only === true && entry.authoritative === false)
      && resources.every(asset => asset.metadata?.candidate_only === true && asset.metadata?.authoritative === false)
  };
  const base = {
    format: UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT,
    version: UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_VERSION,
    directory_id: stableId('urrf-universal-art-asset-component-representation-directory', {
      component_assembly_root: assembly.component_assembly_root,
      vsr_catalog_root: vsrCatalogRoot,
      rsr_input_root: rsrInputRoot
    }),
    source: 'urrf-component-assembly-representation-lowering',
    component_assembly_root: assembly.component_assembly_root,
    assembly_status: assembly.status,
    scene_id: assembly.scene_id,
    world_id: assembly.world_id,
    component_count: components.length,
    representation_count: representations.length,
    representations,
    representation_refs: representations.filter(entry => entry.representation_ref !== null).map(entry => entry.representation_ref),
    resource_count: resources.length,
    resources,
    vsr_catalog: {
      format: UNIVERSAL_ART_ASSET_COMPONENT_VSR_CATALOG_FORMAT,
      version: '0.1.0',
      catalog_root: vsrCatalogRoot,
      asset_count: resources.length,
      assets: resources
    },
    rsr_observation_inputs: rsrInputs,
    rsr_observation_input_root: rsrInputRoot,
    summary: representationDirectorySummary(representations, resources, rsrInputs),
    checks,
    status: representationDirectoryReady({assembly_status: assembly.status, representations, resources}, checks)
      ? 'CANDIDATE_REPRESENTATION_DIRECTORY_READY'
      : 'CANDIDATE_REPRESENTATION_DIRECTORY_BLOCKED',
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false,
    aaa_ready: false,
    release_ready: false,
    authority: representationDirectoryAuthority(),
    directory_root: ''
  };
  return seal(base, 'directory_root');
}

/**
 * Lower a verified component assembly into representation-aware VSR and RSR
 * candidate inputs. VSR receives a streamable asset catalog with exact bytes;
 * RSR receives observation inputs that still require the RSR runtime to create
 * an observation candidate. No mesh conversion, GPU import, reconstruction, or
 * canonical state proposal is performed here.
 */
export function lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory({
  assembly: assemblyInput = null,
  component_assembly = null,
  componentAssembly = null
} = {}) {
  const assembly = assemblyInput ?? component_assembly ?? componentAssembly;
  fail(assembly?.format === UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_FORMAT, 'UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_ASSEMBLY_REQUIRED');
  const verification = verifyUniversalArtAssetComponentAssembly(assembly);
  fail(verification.valid, 'UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_ASSEMBLY_INVALID', verification.errors.join(','));
  return buildUniversalArtAssetComponentRepresentationDirectory(clone(assembly));
}

export function verifyUniversalArtAssetComponentRepresentationDirectory(directory, {assembly = null} = {}) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!directory || typeof directory !== 'object' || Array.isArray(directory)) {
    return {valid: false, errors: ['UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_NOT_OBJECT'], directory_root: null};
  }
  try {
    check(directory.format === UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT, 'FORMAT_INVALID');
    check(directory.version === UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_VERSION, 'VERSION_INVALID');
    check(nonEmptyText(directory.directory_id), 'DIRECTORY_ID_INVALID');
    check(directory.source === 'urrf-component-assembly-representation-lowering', 'SOURCE_INVALID');
    check(hexRoot(directory.component_assembly_root), 'ASSEMBLY_ROOT_INVALID');
    check(['CANDIDATE_COMPONENT_ASSEMBLY_READY', 'CANDIDATE_COMPONENT_ASSEMBLY_BLOCKED'].includes(directory.assembly_status), 'ASSEMBLY_STATUS_INVALID');
    check(nonEmptyText(directory.scene_id) && nonEmptyText(directory.world_id), 'SCENE_WORLD_ID_INVALID');
    const representations = Array.isArray(directory.representations) ? directory.representations : [];
    const resources = Array.isArray(directory.resources) ? directory.resources : [];
    const representationRefs = Array.isArray(directory.representation_refs) ? directory.representation_refs : [];
    const rsrInputs = Array.isArray(directory.rsr_observation_inputs) ? directory.rsr_observation_inputs : [];
    const vsrCatalog = record(directory.vsr_catalog);
    const vsrAssets = Array.isArray(vsrCatalog.assets) ? vsrCatalog.assets : [];
    check(representations.length >= 1 && representations.length <= 128, 'REPRESENTATIONS_INVALID');
    check(resources.length <= 16384 && vsrAssets.length === resources.length, 'RESOURCES_INVALID');
    check(directory.component_count === representations.length, 'COMPONENT_COUNT_MISMATCH');
    check(directory.representation_count === representations.length, 'REPRESENTATION_COUNT_MISMATCH');
    check(directory.resource_count === resources.length, 'RESOURCE_COUNT_MISMATCH');
    check(representationRefs.length === representations.filter(entry => entry?.representation_ref !== null).length, 'REFERENCE_COUNT_MISMATCH');
    check(rsrInputs.length === representations.length, 'RSR_INPUT_COUNT_MISMATCH');
    const representationIds = representations.map(entry => entry?.representation_id).filter(nonEmptyText);
    check(new Set(representationIds).size === representationIds.length, 'REPRESENTATION_IDS_INVALID');
    check(representations.every(entry => nonEmptyText(entry?.component_id)
      && hexRoot(entry?.component_root)
      && (entry?.representation_id === null || nonEmptyText(entry.representation_id))
      && (entry?.representation_root === null || hexRoot(entry.representation_root))
      && UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS.includes(entry?.representation_kind)
      && nonEmptyText(entry?.representation_profile)
      && hexRoot(entry?.content_root)
      && Array.isArray(entry?.resource_ids)
      && Array.isArray(entry?.provider_stage_ids)
      && (entry?.provider_id === null || nonEmptyText(entry.provider_id))
      && (entry?.provider_root === null || hexRoot(entry.provider_root))
      && (entry?.representation_ref === null || verifyRepresentationRef(entry.representation_ref).valid)
      && (entry?.representation_ref === null || entry.representation_ref.representation_id === entry.representation_id)
      && (entry?.representation_ref === null || entry.representation_ref.representation_root === entry.representation_root)
      && entry?.consumer_mapping?.vsr?.target_contract === UNIVERSAL_ART_ASSET_COMPONENT_VSR_CATALOG_FORMAT
      && Array.isArray(entry?.consumer_mapping?.vsr?.catalog_kinds)
      && entry.consumer_mapping.vsr.catalog_kinds.every(kind => UNIVERSAL_ART_ASSET_COMPONENT_VSR_KINDS.includes(kind))
      && entry?.consumer_mapping?.rsr?.target_contract === UNIVERSAL_ART_ASSET_COMPONENT_RSR_OBSERVATION_FORMAT
      && entry?.consumer_mapping?.vsr?.direct_import_status === 'NOT_EXECUTED'
      && entry?.consumer_mapping?.rsr?.execution_status === 'NOT_EXECUTED'
      && entry?.consumer_mapping?.rsr?.reconstruction_status === 'FORBIDDEN_IN_THIS_LAYER'
      && entry?.candidate_only === true
      && entry?.authoritative === false
      && hexRoot(entry?.entry_root)), 'REPRESENTATION_HEADER_INVALID');
    check(representations.every(entry => {
      const copy = clone(entry);
      const actual = copy.entry_root;
      delete copy.entry_root;
      return actual === rootHash(copy);
    }), 'REPRESENTATION_ROOT_INVALID');
    check(representationRefs.every(reference => verifyRepresentationRef(reference).valid), 'REPRESENTATION_REFERENCE_INVALID');
    check(representationRefs.every(reference => representations.some(entry => entry.representation_id === reference.representation_id
      && entry.representation_root === reference.representation_root
      && entry.representation_ref?.representation_root === reference.representation_root)), 'REPRESENTATION_REFERENCE_BINDING_INVALID');
    check(new Set(resources.map(resource => resource?.metadata?.resource_id)).size === resources.length, 'RESOURCE_IDS_INVALID');
    check(resources.every(resource => nonEmptyText(resource?.id)
      && nonEmptyText(resource?.metadata?.resource_id)
      && nonEmptyText(resource?.metadata?.component_id)
      && nonEmptyText(resource?.metadata?.representation_kind)
      && UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS.includes(resource.metadata.representation_kind)
      && nonEmptyText(resource?.metadata?.format ?? resource?.format)
      && nonEmptyText(resource?.metadata?.relative_path)
      && nonEmptyText(resource?.metadata?.output_directory)
      && Number.isSafeInteger(resource?.metadata?.byte_length)
      && resource.metadata.byte_length > 0
      && hexRoot(resource?.metadata?.sha256)
      && hexRoot(resource?.metadata?.resource_root)), 'RESOURCE_HEADER_INVALID');
    check(vsrCatalog.format === UNIVERSAL_ART_ASSET_COMPONENT_VSR_CATALOG_FORMAT && vsrCatalog.version === '0.1.0', 'VSR_CATALOG_CONTRACT_INVALID');
    check(vsrCatalog.asset_count === vsrAssets.length && hexRoot(vsrCatalog.catalog_root), 'VSR_CATALOG_HEADER_INVALID');
    check(vsrAssets.every(asset => nonEmptyText(asset?.id)
      && nonEmptyText(asset?.uri)
      && UNIVERSAL_ART_ASSET_COMPONENT_VSR_KINDS.includes(asset?.kind)
      && nonEmptyText(asset?.format)
      && hexRoot(asset?.sha256)
      && Number.isSafeInteger(asset?.byteLength)
      && asset.byteLength > 0
      && Array.isArray(asset?.dependencies)
      && Array.isArray(asset?.cellIds)
      && Number.isSafeInteger(asset?.priority)
      && asset.metadata?.candidate_only === true
      && asset.metadata?.authoritative === false), 'VSR_ASSET_HEADER_INVALID');
    check(new Set(vsrAssets.map(asset => asset?.id)).size === vsrAssets.length, 'VSR_ASSET_IDS_INVALID');
    check(JSON.stringify(resources) === JSON.stringify(vsrAssets), 'RESOURCE_CATALOG_DUPLICATE_MISMATCH');
    check(directory.vsr_catalog.catalog_root === representationDirectoryVsrCatalogRoot(vsrAssets), 'VSR_CATALOG_ROOT_MISMATCH');
    check(vsrAssets.every(asset => {
      const entry = representations.find(candidate => candidate.component_id === asset.metadata?.component_id);
      const resourceIndex = entry?.resource_ids.indexOf(asset.metadata?.resource_id);
      return Boolean(entry)
        && resourceIndex !== undefined
        && resourceIndex >= 0
        && entry.consumer_mapping.vsr.asset_ids[resourceIndex] === asset.id
        && asset.sha256 === asset.metadata?.sha256
        && asset.byteLength === asset.metadata?.byte_length
        && asset.metadata?.representation_kind === entry.representation_kind
        && asset.kind === representationDirectoryVsrKind(entry.representation_kind, {role: asset.metadata?.role, format: asset.format})
        && asset.metadata?.vsr_kind === asset.kind
        && JSON.stringify([...new Set(vsrAssets.filter(candidate => candidate.metadata?.component_id === entry.component_id).map(candidate => candidate.kind))].sort(keySort))
          === JSON.stringify([...entry.consumer_mapping.vsr.catalog_kinds].sort(keySort));
    }), 'VSR_RESOURCE_BINDING_INVALID');
    check(rsrInputs.every(input => nonEmptyText(input?.representation_kind)
      && hexRoot(input?.content_root)
      && Array.isArray(input?.observation_kinds)
      && input.observation_kinds.length === 3
      && input.observation_kinds.includes('bounds')
      && input.observation_kinds.includes('lod')
      && input.observation_kinds.includes('residency')
      && input.execution_status === 'NOT_EXECUTED'
      && input.reconstruction_candidate === null
      && input.canonical_state_proposal === null
      && input.authority?.rsr_can_promote_without_independent_evidence === false
      && input.authority?.rncs_authority_required === true
      && input.candidate_only === true
      && input.authoritative === false
      && input.commit_status === 'NOT_COMMITTED'
      && (input.status === 'INPUT_READY') === (input.representation_root !== null)
      && (input.representation_id === null) === (input.representation_root === null)
      && hexRoot(input.input_root)
      && input.input_root === rootHash(Object.fromEntries(Object.entries(input).filter(([key]) => key !== 'input_root')))), 'RSR_INPUT_INVALID');
    check(directory.rsr_observation_input_root === rootHash(rsrInputs), 'RSR_INPUT_ROOT_MISMATCH');
    const expectedSummary = representationDirectorySummary(representations, vsrAssets, rsrInputs);
    for (const [key, value] of Object.entries(expectedSummary)) check(JSON.stringify(directory.summary?.[key]) === JSON.stringify(value), `SUMMARY_${key.toUpperCase()}_MISMATCH`);
    const expectedChecks = {
      assembly_binding: hexRoot(directory.component_assembly_root),
      representation_reference_binding: representations.every(entry => entry.representation_ref === null || verifyRepresentationRef(entry.representation_ref).valid),
      provider_binding: representations.every(entry => entry.representation_ref === null || (nonEmptyText(entry.provider_id) && hexRoot(entry.provider_root) && entry.representation_ref.provider_id === entry.provider_id && entry.representation_ref.provider_root === entry.provider_root)),
      representation_kind_preservation: representations.every(entry => UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_KINDS.includes(entry.representation_kind)
        && (entry.representation_ref === null || entry.representation_ref.representation_kind === entry.representation_kind)
        && vsrAssets.filter(asset => asset.metadata?.component_id === entry.component_id).every(asset => asset.metadata?.representation_kind === entry.representation_kind)),
      representation_resource_binding: representations.every(entry => entry.resource_ids.every(resourceId => vsrAssets.some(asset => asset.metadata?.resource_id === resourceId && asset.metadata?.component_id === entry.component_id))
        && entry.consumer_mapping.vsr.asset_ids.length === entry.resource_ids.length),
      vsr_catalog_integrity: vsrAssets.every(asset => UNIVERSAL_ART_ASSET_COMPONENT_VSR_KINDS.includes(asset.kind) && nonEmptyText(asset.uri) && hexRoot(asset.sha256) && Number.isSafeInteger(asset.byteLength) && asset.byteLength > 0 && asset.metadata?.candidate_only === true && asset.metadata?.authoritative === false)
        && directory.vsr_catalog.catalog_root === representationDirectoryVsrCatalogRoot(vsrAssets),
      rsr_observation_boundary: rsrInputs.every(input => input.target_contract === UNIVERSAL_ART_ASSET_COMPONENT_RSR_OBSERVATION_FORMAT && input.execution_status === 'NOT_EXECUTED' && input.reconstruction_candidate === null && input.canonical_state_proposal === null && input.authority?.rsr_can_promote_without_independent_evidence === false && input.candidate_only === true && input.authoritative === false && input.commit_status === 'NOT_COMMITTED'),
      transform_binding: representations.every(entry => Array.isArray(entry.transform?.translation_mm) && entry.transform.translation_mm.length === 3 && Array.isArray(entry.transform?.rotation_deg) && entry.transform.rotation_deg.length === 3 && Array.isArray(entry.transform?.scale_milli) && entry.transform.scale_milli.length === 3),
      authority_boundary: representations.every(entry => entry.candidate_only === true && entry.authoritative === false) && vsrAssets.every(asset => asset.metadata?.candidate_only === true && asset.metadata?.authoritative === false)
    };
    for (const [key, value] of Object.entries(expectedChecks)) check(directory.checks?.[key] === value, `CHECK_${key.toUpperCase()}_MISMATCH`);
    const expectedStatus = representationDirectoryReady({assembly_status: directory.assembly_status, representations, resources: vsrAssets}, expectedChecks)
      ? 'CANDIDATE_REPRESENTATION_DIRECTORY_READY'
      : 'CANDIDATE_REPRESENTATION_DIRECTORY_BLOCKED';
    check(directory.status === expectedStatus, 'STATUS_MISMATCH');
    check(directory.candidate_only === true
      && directory.authoritative === false
      && directory.canonical_write_authorized === false
      && directory.aaa_ready === false
      && directory.release_ready === false, 'AUTHORITY_BOUNDARY_INVALID');
    check(JSON.stringify(directory.authority) === JSON.stringify(representationDirectoryAuthority()), 'AUTHORITY_INVALID');
    if (assembly !== null) {
      const assemblyVerification = verifyUniversalArtAssetComponentAssembly(assembly);
      check(assemblyVerification.valid, `ASSEMBLY_CONTEXT_INVALID:${assemblyVerification.errors.join(',')}`);
      check(directory.component_assembly_root === assembly.component_assembly_root, 'ASSEMBLY_CONTEXT_ROOT_MISMATCH');
      check(directory.assembly_status === assembly.status, 'ASSEMBLY_CONTEXT_STATUS_MISMATCH');
      const expected = buildUniversalArtAssetComponentRepresentationDirectory(clone(assembly));
      const expectedCopy = clone(expected);
      delete expectedCopy.directory_root;
      const actualCopy = clone(directory);
      delete actualCopy.directory_root;
      check(JSON.stringify(actualCopy) === JSON.stringify(expectedCopy), 'ASSEMBLY_CONTEXT_CONTENT_MISMATCH');
    }
    const actualRoot = directory.directory_root;
    check(hexRoot(actualRoot) && actualRoot === rootHash(representationDirectoryRootInput(directory)), 'ROOT_MISMATCH');
  } catch (error) {
    errors.push(`VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, directory_root: directory.directory_root ?? null};
}
