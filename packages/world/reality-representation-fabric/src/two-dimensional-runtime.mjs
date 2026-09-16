import {createRepresentationRef, rootHash, verifyRepresentationRef} from '@taowind/rncs-core-contract';

export const URRF_2D_RUNTIME_FORMAT = 'urrf.2d-runtime.v0.1';
export const URRF_2D_RUNTIME_VERSION = '0.1.0';
export const URRF_2D_SCENE_FORMAT = 'urrf.2d-scene.v0.1';
export const URRF_2D_COMPOSITION_RECEIPT_FORMAT = 'urrf.2d-composition-receipt.v0.1';
export const URRF_2D_DVG_KIND = 'vector-2d-dvg';
export const URRF_2D_PPD_KIND = 'point-diffusion-2d';
export const URRF_2D_BLEND_MODES = Object.freeze(['normal', 'add', 'screen', 'multiply', 'overlay']);

const clone = value => structuredClone(value);
const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const fail = (condition, code) => { if (!condition) throw new Error(code); };
const finite = value => Number.isFinite(Number(value));
const int = value => Number.isSafeInteger(Number(value));
const strings = value => [...new Set((Array.isArray(value) ? value : []).map(String).filter(Boolean))].sort((a, b) => Buffer.compare(Buffer.from(a), Buffer.from(b)));
const without = (value, field) => Object.fromEntries(Object.entries(value).filter(([key]) => key !== field));
const hex64 = value => typeof value === 'string' && /^[0-9a-f]{64}$/i.test(value);
const ppm = value => Math.max(0, Math.min(1000000, Math.round(Number(value) * 1000000)));
const intPpm = value => Math.max(0, Math.min(1000000, Math.round(Number(value))));

function providerManifest(input = {}) {
  const value = record(input);
  const id = String(value.id ?? '');
  const kind = String(value.kind ?? '');
  const profileId = String(value.profile_id ?? value.profileId ?? '');
  const formats = strings(value.formats);
  fail(id, 'URRF_2D_PROVIDER_ID_REQUIRED');
  fail(kind, 'URRF_2D_PROVIDER_KIND_REQUIRED');
  fail(profileId, 'URRF_2D_PROVIDER_PROFILE_REQUIRED');
  fail(formats.length > 0, 'URRF_2D_PROVIDER_FORMAT_REQUIRED');
  const base = {
    id,
    version: URRF_2D_RUNTIME_VERSION,
    runtimeStatus: value.runtime_status ?? value.runtimeStatus ?? 'AVAILABLE',
    capabilities: strings(value.capabilities ?? [
      'representation.visual.render.2d',
      'representation.visual.materialize.2d',
      'representation.visual.residency.2d'
    ]),
    authority: {
      owns_authoritative_world_state: false,
      scope: ['representation_candidate', 'visual_projection']
    },
    representation: {
      kinds: [kind],
      profiles: [{profile_id: profileId, formats}],
      detail_policy: clone(value.detail_policy ?? {}),
      residency_policy: clone(value.residency_policy ?? {})
    },
    metadata: clone(value.metadata ?? {})
  };
  return {...base, manifest_root: rootHash(base)};
}

export function createDvg2DProvider(input = {}) {
  const value = record(input);
  const manifest = providerManifest({
    id: value.id ?? 'provider:taowind:urrf2d:dvg',
    kind: URRF_2D_DVG_KIND,
    profile_id: value.profile_id ?? 'urrf2d.dvg.v0.1',
    formats: value.formats ?? ['application/vnd.taowind.dvg+json', 'image/svg+xml'],
    capabilities: value.capabilities,
    detail_policy: {
      mode: 'hierarchical-vector-lod',
      selectors: ['viewport', 'screen-space-size', 'semantic-priority'],
      budget: {unit: 'vector-node'},
      ...(value.detail_policy ?? {})
    },
    residency_policy: {
      mode: 'paged-vector-working-set',
      selectors: ['viewport-intersection', 'semantic-priority', 'unload-hysteresis'],
      budget: {unit: 'vector-node'},
      ...(value.residency_policy ?? {})
    },
    metadata: {provider_family: 'DVG', ...(value.metadata ?? {})},
    runtime_status: value.materialize ? 'AVAILABLE' : (value.runtime_status ?? 'CONTRACT_ONLY')
  });
  return {manifest, ...(typeof value.materialize === 'function' ? {materialize: value.materialize} : {})};
}

export function createPpd2DProvider(input = {}) {
  const value = record(input);
  const manifest = providerManifest({
    id: value.id ?? 'provider:taowind:urrf2d:ppd',
    kind: URRF_2D_PPD_KIND,
    profile_id: value.profile_id ?? 'urrf2d.ppd.v0.1',
    formats: value.formats ?? ['application/vnd.taowind.ppd+json'],
    capabilities: value.capabilities,
    detail_policy: {
      mode: 'density-field-lod',
      selectors: ['viewport', 'projected-area', 'atmosphere-priority'],
      budget: {unit: 'point'},
      ...(value.detail_policy ?? {})
    },
    residency_policy: {
      mode: 'field-working-set',
      selectors: ['viewport-intersection', 'density-threshold', 'unload-hysteresis'],
      budget: {unit: 'point'},
      ...(value.residency_policy ?? {})
    },
    metadata: {provider_family: 'PPD', ...(value.metadata ?? {})},
    runtime_status: value.materialize ? 'AVAILABLE' : (value.runtime_status ?? 'CONTRACT_ONLY')
  });
  return {manifest, ...(typeof value.materialize === 'function' ? {materialize: value.materialize} : {})};
}

function representationRef(input, provider, kind, defaults) {
  const value = record(input);
  fail(provider?.manifest?.manifest_root, 'URRF_2D_PROVIDER_MANIFEST_REQUIRED');
  const contentRoot = String(value.content_root ?? value.contentRoot ?? '');
  fail(hex64(contentRoot), 'URRF_2D_CONTENT_ROOT_INVALID');
  const formats = strings(value.formats ?? provider.manifest.representation.profiles[0].formats);
  const reference = createRepresentationRef({
    representation_id: value.representation_id ?? value.id,
    provider_id: provider.manifest.id,
    provider_root: provider.manifest.manifest_root,
    representation_kind: kind,
    representation_formats: formats,
    content_root: contentRoot,
    source_uri: value.source_uri ?? null,
    representation_profile: {
      profile_id: value.profile_id ?? provider.manifest.representation.profiles[0].profile_id,
      encoding: value.encoding ?? defaults.encoding,
      fidelity: value.fidelity ?? defaults.fidelity,
      precision: value.precision ?? defaults.precision,
      formats,
      metadata: clone(value.profile_metadata ?? {})
    },
    detail_policy: clone(value.detail_policy ?? provider.manifest.representation.detail_policy),
    residency_policy: clone(value.residency_policy ?? provider.manifest.representation.residency_policy),
    availability: value.availability ?? (provider.materialize ? 'AVAILABLE' : 'CONTRACT_ONLY'),
    authority_scope: ['representation_candidate', 'visual_projection'],
    provenance: clone(value.provenance ?? {}),
    evidence: clone(value.evidence ?? {})
  });
  const verification = verifyRepresentationRef(reference);
  fail(verification.valid, `URRF_2D_REPRESENTATION_REF_INVALID:${verification.errors.join(',')}`);
  return reference;
}

export function createDvg2DRepresentationRef(input = {}, provider) {
  return representationRef(input, provider, URRF_2D_DVG_KIND, {
    encoding: 'semantic-vector-graph', fidelity: 'semantic-geometry', precision: 'subpixel-vector'
  });
}

export function createPpd2DRepresentationRef(input = {}, provider) {
  return representationRef(input, provider, URRF_2D_PPD_KIND, {
    encoding: 'procedural-point-diffusion-field', fidelity: 'atmosphere-detail', precision: 'stochastic-field'
  });
}

function normalizeBounds(value) {
  const bounds = Array.isArray(value) ? value.map(Number) : [];
  fail(bounds.length === 4 && bounds.every(finite), 'URRF_2D_BOUNDS_INVALID');
  fail(bounds[2] >= bounds[0] && bounds[3] >= bounds[1], 'URRF_2D_BOUNDS_ORDER_INVALID');
  return bounds;
}

function normalizeLayer(input = {}) {
  const value = record(input);
  const representationKind = String(value.representation_kind ?? value.kind ?? '');
  fail([URRF_2D_DVG_KIND, URRF_2D_PPD_KIND].includes(representationKind), 'URRF_2D_LAYER_KIND_INVALID');
  const blendMode = String(value.blend_mode ?? value.blendMode ?? (representationKind === URRF_2D_PPD_KIND ? 'screen' : 'normal'));
  fail(URRF_2D_BLEND_MODES.includes(blendMode), 'URRF_2D_BLEND_MODE_INVALID');
  return {
    layer_id: String(value.layer_id ?? value.id ?? `layer:${representationKind}`),
    representation_kind: representationKind,
    representation_id: value.representation_id ? String(value.representation_id) : null,
    role: String(value.role ?? (representationKind === URRF_2D_DVG_KIND ? 'structure' : 'atmosphere')),
    blend_mode: blendMode,
    opacity_ppm: value.opacity_ppm !== undefined ? intPpm(value.opacity_ppm) : ppm(value.opacity ?? 1),
    priority: Math.max(0, Math.round(Number(value.priority ?? 1))),
    resource_weight: Math.max(0, Math.round(Number(value.resource_weight ?? 1)))
  };
}

function normalizeSceneObject(input = {}) {
  const value = record(input);
  const objectId = String(value.object_id ?? value.id ?? '');
  fail(objectId, 'URRF_2D_SCENE_OBJECT_ID_REQUIRED');
  const layers = (Array.isArray(value.layers) ? value.layers : []).map(normalizeLayer);
  fail(layers.length > 0, 'URRF_2D_SCENE_OBJECT_LAYER_REQUIRED');
  return {
    object_id: objectId,
    bounds: normalizeBounds(value.bounds),
    z_index: Number(value.z_index ?? value.zIndex ?? 0),
    semantic_priority: Math.max(0, Number(value.semantic_priority ?? value.semanticPriority ?? 1)),
    layers
  };
}

export function createUrrf2DScene(input = {}) {
  const value = record(input);
  const sceneId = String(value.scene_id ?? value.id ?? '');
  fail(sceneId, 'URRF_2D_SCENE_ID_REQUIRED');
  const canvas = normalizeBounds(value.canvas ?? [0, 0, 1, 1]);
  const objects = (Array.isArray(value.objects) ? value.objects : []).map(normalizeSceneObject)
    .sort((a, b) => a.z_index - b.z_index || Buffer.compare(Buffer.from(a.object_id), Buffer.from(b.object_id)));
  fail(objects.length > 0, 'URRF_2D_SCENE_OBJECTS_REQUIRED');
  const objectIds = new Set();
  for (const object of objects) {
    fail(!objectIds.has(object.object_id), 'URRF_2D_SCENE_DUPLICATE_OBJECT_ID');
    objectIds.add(object.object_id);
  }
  const base = {
    format: URRF_2D_SCENE_FORMAT,
    version: URRF_2D_RUNTIME_VERSION,
    scene_id: sceneId,
    branch: String(value.branch ?? 'main'),
    canvas,
    objects,
    authority: {
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true
    },
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, scene_root: rootHash(base)};
}

export function verifyUrrf2DScene(scene) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!scene || typeof scene !== 'object') return {valid: false, errors: ['URRF_2D_SCENE_NOT_OBJECT']};
  try {
    check(scene.format === URRF_2D_SCENE_FORMAT, 'URRF_2D_SCENE_FORMAT_INVALID');
    check(scene.version === URRF_2D_RUNTIME_VERSION, 'URRF_2D_SCENE_VERSION_INVALID');
    check(typeof scene.scene_id === 'string' && scene.scene_id.length > 0, 'URRF_2D_SCENE_ID_REQUIRED');
    check(Array.isArray(scene.objects) && scene.objects.length > 0, 'URRF_2D_SCENE_OBJECTS_REQUIRED');
    check(scene.authority?.provider_can_write_authoritative_world_state === false, 'URRF_2D_PROVIDER_AUTHORITY_ESCALATION');
    check(scene.authority?.rncs_authority_required === true, 'URRF_2D_RNCS_AUTHORITY_REQUIRED');
    check(scene.candidate_only === true && scene.authoritative === false && scene.commit_status === 'NOT_COMMITTED', 'URRF_2D_SCENE_STATUS_INVALID');
    check(hex64(scene.scene_root), 'URRF_2D_SCENE_ROOT_INVALID');
    check(rootHash(without(scene, 'scene_root')) === scene.scene_root, 'URRF_2D_SCENE_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`URRF_2D_SCENE_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, scene_root: scene.scene_root};
}

function intersects(a, b) {
  return a[0] <= b[2] && a[2] >= b[0] && a[1] <= b[3] && a[3] >= b[1];
}

export function planUrrf2DWorkingSet(scene, input = {}) {
  const verification = verifyUrrf2DScene(scene);
  fail(verification.valid, `URRF_2D_SCENE_INVALID:${verification.errors.join(',')}`);
  const value = record(input);
  const viewport = normalizeBounds(value.viewport ?? scene.canvas);
  const zoomPpm = value.zoom_ppm !== undefined ? Math.round(Number(value.zoom_ppm)) : Math.round(Number(value.zoom ?? 1) * 1000000);
  fail(int(zoomPpm) && zoomPpm > 0, 'URRF_2D_ZOOM_INVALID');
  const budget = record(value.resource_budget ?? value.budget);
  const vectorNodes = Math.max(0, Math.floor(Number(budget.vector_nodes ?? budget.vectorNodes ?? 0)));
  const points = Math.max(0, Math.floor(Number(budget.points ?? 0)));
  const visible = scene.objects.filter(object => intersects(object.bounds, viewport));
  const deferred = scene.objects.filter(object => !intersects(object.bounds, viewport));
  const dvgLayers = visible.flatMap(object => object.layers.filter(layer => layer.representation_kind === URRF_2D_DVG_KIND).map(layer => ({object, layer})));
  const ppdLayers = visible.flatMap(object => object.layers.filter(layer => layer.representation_kind === URRF_2D_PPD_KIND).map(layer => ({object, layer})));
  const weightSum = entries => entries.reduce((sum, item) => sum + item.layer.resource_weight * item.object.semantic_priority, 0) || 1;
  const vectorWeight = weightSum(dvgLayers);
  const pointWeight = weightSum(ppdLayers);
  const layerPlans = [];
  for (const {object, layer} of [...dvgLayers, ...ppdLayers]) {
    const isDvg = layer.representation_kind === URRF_2D_DVG_KIND;
    const total = isDvg ? vectorNodes : points;
    const denom = isDvg ? vectorWeight : pointWeight;
    const allocation = Math.floor(total * (layer.resource_weight * object.semantic_priority / denom));
    layerPlans.push({
      object_id: object.object_id,
      layer_id: layer.layer_id,
      representation_kind: layer.representation_kind,
      representation_id: layer.representation_id,
      z_index: object.z_index,
      blend_mode: layer.blend_mode,
      opacity_ppm: layer.opacity_ppm,
      semantic_priority: object.semantic_priority,
      resource_budget: isDvg ? {vector_nodes: allocation, zoom_ppm: zoomPpm} : {points: allocation, zoom_ppm: zoomPpm}
    });
  }
  layerPlans.sort((a, b) => a.z_index - b.z_index || Buffer.compare(Buffer.from(a.layer_id), Buffer.from(b.layer_id)));
  const base = {
    format: 'urrf.2d-working-set-plan.v0.1',
    version: URRF_2D_RUNTIME_VERSION,
    scene_id: scene.scene_id,
    scene_root: scene.scene_root,
    viewport,
    zoom_ppm: zoomPpm,
    resource_budget: {vector_nodes: vectorNodes, points},
    active_object_ids: visible.map(item => item.object_id),
    deferred_object_ids: deferred.map(item => item.object_id),
    layers: layerPlans,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, plan_root: rootHash(base)};
}

export async function materializeUrrf2DScene(fabric, scene, input = {}) {
  fail(fabric && typeof fabric.materialize === 'function' && typeof fabric.getRealityObject === 'function', 'URRF_2D_FABRIC_RUNTIME_REQUIRED');
  const plan = planUrrf2DWorkingSet(scene, input);
  const receipts = [];
  for (const layer of plan.layers) {
    const registered = fabric.getRealityObject(layer.object_id);
    fail(registered, `URRF_2D_OBJECT_NOT_REGISTERED:${layer.object_id}`);
    const request = {
      object_id: layer.object_id,
      representation_kind: layer.representation_kind,
      resource_budget: clone(layer.resource_budget)
    };
    if (layer.representation_id) request.representation_id = layer.representation_id;
    const receipt = await fabric.materialize(request, {context: {
      urrf2d: {
        scene_id: scene.scene_id,
        scene_root: scene.scene_root,
        layer_id: layer.layer_id,
        z_index: layer.z_index,
        blend_mode: layer.blend_mode,
        opacity_ppm: layer.opacity_ppm,
        viewport: plan.viewport,
        zoom_ppm: plan.zoom_ppm
      }
    }});
    receipts.push({
      object_id: layer.object_id,
      layer_id: layer.layer_id,
      representation_kind: layer.representation_kind,
      z_index: layer.z_index,
      blend_mode: layer.blend_mode,
      opacity_ppm: layer.opacity_ppm,
      status: receipt.status,
      receipt_root: receipt.receipt_root,
      output_root: receipt.output_root,
      failure: clone(receipt.failure)
    });
  }
  const failed = receipts.filter(item => item.status === 'FAILED');
  const executed = receipts.filter(item => item.status === 'EXECUTED');
  const outputRoot = executed.length > 0 ? rootHash({scene_root: scene.scene_root, layers: executed.map(item => ({layer_id: item.layer_id, output_root: item.output_root, blend_mode: item.blend_mode, opacity_ppm: item.opacity_ppm}))}) : null;
  const base = {
    format: URRF_2D_COMPOSITION_RECEIPT_FORMAT,
    version: URRF_2D_RUNTIME_VERSION,
    scene_id: scene.scene_id,
    scene_root: scene.scene_root,
    working_set_plan_root: plan.plan_root,
    active_object_ids: [...plan.active_object_ids],
    deferred_object_ids: [...plan.deferred_object_ids],
    layers: receipts,
    status: failed.length > 0 ? 'FAILED' : (executed.length === receipts.length ? 'EXECUTED' : 'PARTIAL'),
    output_root: outputRoot,
    authority: {
      provider_can_write_authoritative_world_state: false,
      rncs_authority_required: true,
      canonical_state_mutation_allowed: false
    },
    canonical_state_mutated: false,
    candidate_only: true,
    authoritative: false,
    commit_status: 'NOT_COMMITTED'
  };
  return {...base, receipt_root: rootHash(base)};
}

export function verifyUrrf2DCompositionReceipt(receipt) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!receipt || typeof receipt !== 'object') return {valid: false, errors: ['URRF_2D_COMPOSITION_RECEIPT_NOT_OBJECT']};
  try {
    check(receipt.format === URRF_2D_COMPOSITION_RECEIPT_FORMAT, 'URRF_2D_COMPOSITION_RECEIPT_FORMAT_INVALID');
    check(receipt.version === URRF_2D_RUNTIME_VERSION, 'URRF_2D_COMPOSITION_RECEIPT_VERSION_INVALID');
    check(typeof receipt.scene_id === 'string' && receipt.scene_id.length > 0, 'URRF_2D_COMPOSITION_RECEIPT_SCENE_ID_REQUIRED');
    check(hex64(receipt.scene_root), 'URRF_2D_COMPOSITION_RECEIPT_SCENE_ROOT_INVALID');
    check(hex64(receipt.working_set_plan_root), 'URRF_2D_COMPOSITION_RECEIPT_PLAN_ROOT_INVALID');
    check(Array.isArray(receipt.layers), 'URRF_2D_COMPOSITION_RECEIPT_LAYERS_REQUIRED');
    check(['EXECUTED', 'PARTIAL', 'FAILED'].includes(receipt.status), 'URRF_2D_COMPOSITION_RECEIPT_STATUS_INVALID');
    check(receipt.authority?.provider_can_write_authoritative_world_state === false, 'URRF_2D_COMPOSITION_PROVIDER_AUTHORITY_ESCALATION');
    check(receipt.authority?.canonical_state_mutation_allowed === false, 'URRF_2D_COMPOSITION_CANONICAL_MUTATION_ALLOWED');
    check(receipt.canonical_state_mutated === false, 'URRF_2D_COMPOSITION_CANONICAL_STATE_MUTATED');
    check(receipt.candidate_only === true && receipt.authoritative === false && receipt.commit_status === 'NOT_COMMITTED', 'URRF_2D_COMPOSITION_STATUS_INVALID');
    check(hex64(receipt.receipt_root), 'URRF_2D_COMPOSITION_RECEIPT_ROOT_INVALID');
    check(rootHash(without(receipt, 'receipt_root')) === receipt.receipt_root, 'URRF_2D_COMPOSITION_RECEIPT_ROOT_MISMATCH');
  } catch (error) {
    errors.push(`URRF_2D_COMPOSITION_RECEIPT_VERIFY_EXCEPTION:${error.name}:${error.message}`);
  }
  return {valid: errors.length === 0, errors, receipt_root: receipt.receipt_root};
}
