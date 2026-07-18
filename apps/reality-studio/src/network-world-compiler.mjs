import fs from 'node:fs';
import path from 'node:path';
import { rootHash as rfeRootHash } from '@taowind/rfe-core-sdk';
import { gltfAsset, spatial3d } from '@taowind/visual-state-runtime';
import { StudioError } from './canonical.mjs';
import {
  projectSpatialSnapshotToVSRScene,
  validateSpatialWorkspace,
} from './spatial-studio.mjs';

export const NETWORK_AUTHORING_FORMAT = 'reality-studio.network-authoring.v1.6';
export const NETWORK_WORLD_COMPILATION_FORMAT = 'reality-studio.network-world-compilation.v1.6';
export const NETWORK_ASSET_VIEWPORT_FORMAT = 'reality-studio.network-asset-viewport.v1.6';
export const NETWORK_WORLD_COMPILER_VERSION = '1.6.0-alpha.1';

const ACTIONS = new Set(['move', 'jump', 'impulse']);
const deep = value => structuredClone(value);
const clean = value => {
  if (Array.isArray(value)) return value.map(item => item === undefined ? null : clean(item));
  if (value && typeof value === 'object') {
    return Object.fromEntries(Object.entries(value)
      .filter(([, item]) => item !== undefined)
      .map(([key, item]) => [key, clean(item)]));
  }
  return value;
};
const seal = (value, field = 'root') => {
  const output = clean(deep(value));
  delete output[field];
  output[field] = rfeRootHash(output);
  return output;
};
const verifySeal = (value, field = 'root') => {
  if (!value || typeof value !== 'object' || typeof value[field] !== 'string') return false;
  const payload = clean(deep(value));
  const actual = payload[field];
  delete payload[field];
  return actual === rfeRootHash(payload);
};
const integer = (value, fallback = 0) => Number.isSafeInteger(Number(value)) ? Number(value) : fallback;
const bounded = (value, min, max, fallback = min) => Math.min(max, Math.max(min, integer(value, fallback)));
const text = (value, fallback = '') => String(value ?? fallback).trim();
const unique = values => [...new Set(values)];

export function createNetworkAuthoring(project, options = {}) {
  const worldId = options.worldId ?? options.world_id ?? project?.spatial3d?.active_world_id;
  const playerSlots = (options.playerSlots ?? options.player_slots ?? []).map(normalizePlayerSlot)
    .sort((left, right) => left.slot_id.localeCompare(right.slot_id));
  const transport = options.transport ?? options.transport_profile ?? {};
  const authority = options.authority ?? {};
  const authoring = seal({
    format: NETWORK_AUTHORING_FORMAT,
    version: NETWORK_WORLD_COMPILER_VERSION,
    world_id: text(worldId),
    multiplayer_required: options.multiplayerRequired ?? options.multiplayer_required ?? true,
    require_asset_bindings: options.requireAssetBindings ?? options.require_asset_bindings ?? true,
    player_slots: playerSlots,
    transport_profile: {
      seed: integer(transport.seed, 1),
      fixed_latency_ticks: bounded(transport.fixedLatencyTicks ?? transport.fixed_latency_ticks, 0, 120, 0),
      jitter_ticks: bounded(transport.jitterTicks ?? transport.jitter_ticks, 0, 120, 0),
      loss_rate_ppm: bounded(transport.lossRatePpm ?? transport.loss_rate_ppm, 0, 1_000_000, 0),
      duplicate_rate_ppm: bounded(transport.duplicateRatePpm ?? transport.duplicate_rate_ppm, 0, 1_000_000, 0),
      reorder_rate_ppm: bounded(transport.reorderRatePpm ?? transport.reorder_rate_ppm, 0, 1_000_000, 0),
    },
    authority: {
      mode: text(authority.mode, 'server-authoritative'),
      client_prediction: authority.clientPrediction ?? authority.client_prediction ?? true,
      rollback: authority.rollback ?? true,
      deterministic_replay: authority.deterministicReplay ?? authority.deterministic_replay ?? true,
      default_effect: text(authority.defaultEffect ?? authority.default_effect, 'deny'),
    },
  }, 'authoring_root');
  const validation = validateNetworkAuthoring(project, authoring);
  if (!validation.valid) throw new StudioError('NETWORK_AUTHORING_INVALID', '', validation);
  return authoring;
}

export function validateNetworkAuthoring(project, authoring = project?.network) {
  if (!authoring) return { valid: true, configured: false, errors: [], warnings: [], player_slot_count: 0, asset_binding_count: 0 };
  const errors = [];
  const warnings = [];
  const need = (condition, code, location, details = {}) => {
    if (!condition) errors.push({ code, path: location, ...details });
  };
  need(authoring.format === NETWORK_AUTHORING_FORMAT, 'NETWORK_AUTHORING_FORMAT_INVALID', 'network.format');
  need(authoring.version === NETWORK_WORLD_COMPILER_VERSION, 'NETWORK_AUTHORING_VERSION_INVALID', 'network.version');
  need(verifySeal(authoring, 'authoring_root'), 'NETWORK_AUTHORING_ROOT_MISMATCH', 'network.authoring_root');
  const spatialValidation = validateSpatialWorkspace(project?.spatial3d);
  if (!spatialValidation.valid) errors.push({ code: 'NETWORK_SOURCE_SPATIAL_INVALID', path: 'spatial3d', details: spatialValidation.errors });
  const world = project?.spatial3d?.worlds?.[authoring.world_id];
  need(Boolean(world), 'NETWORK_WORLD_MISSING', 'network.world_id', { world_id: authoring.world_id });
  need(authoring.world_id === project?.spatial3d?.active_world_id, 'NETWORK_WORLD_NOT_ACTIVE', 'network.world_id');
  const scene = project?.scenes?.find(item => item.scene_id === project.active_scene_id);
  const bodies = new Map((world?.bodies ?? []).map(body => [body.id, body]));
  const characters = new Map((world?.characters ?? []).map(character => [character.id, character]));
  const slots = authoring.player_slots ?? [];
  if (authoring.multiplayer_required) need(slots.length >= 2, 'NETWORK_MULTIPLAYER_SLOTS_REQUIRED', 'network.player_slots');
  for (const field of ['slot_id', 'player_id', 'character_id', 'body_id']) {
    const values = slots.map(slot => slot[field]);
    need(unique(values).length === values.length, `NETWORK_${field.toUpperCase()}_DUPLICATE`, `network.player_slots.${field}`);
  }
  const bindingByNode = new Map(deriveAssetBindings(project, world, { includeInvalid: true }).map(binding => [binding.scene_node_id, binding]));
  for (const slot of slots) {
    const prefix = `network.player_slots.${slot.slot_id}`;
    need(Boolean(slot.slot_id), 'NETWORK_SLOT_ID_REQUIRED', `${prefix}.slot_id`);
    need(Boolean(slot.subject_id), 'NETWORK_SUBJECT_ID_REQUIRED', `${prefix}.subject_id`);
    need(Boolean(slot.player_id), 'NETWORK_PLAYER_ID_REQUIRED', `${prefix}.player_id`);
    const body = bodies.get(slot.body_id);
    const character = characters.get(slot.character_id);
    need(Boolean(body), 'NETWORK_SLOT_BODY_MISSING', `${prefix}.body_id`, { body_id: slot.body_id });
    need(Boolean(character), 'NETWORK_SLOT_CHARACTER_MISSING', `${prefix}.character_id`, { character_id: slot.character_id });
    need(character?.bodyId === slot.body_id, 'NETWORK_SLOT_CHARACTER_BODY_MISMATCH', prefix);
    need(body?.tags?.includes('player'), 'NETWORK_SLOT_BODY_NOT_PLAYER', `${prefix}.body_id`);
    need(slot.actions.length > 0 && slot.actions.every(action => ACTIONS.has(action)), 'NETWORK_SLOT_ACTION_INVALID', `${prefix}.actions`);
    const node = scene?.nodes?.find(item => item.node_id === slot.scene_node_id);
    need(Boolean(node), 'NETWORK_SLOT_SCENE_NODE_MISSING', `${prefix}.scene_node_id`);
    need(node?.components?.spatial_body_id === slot.body_id, 'NETWORK_SLOT_NODE_BODY_MISMATCH', prefix);
    need(node?.components?.spatial_character_id === slot.character_id, 'NETWORK_SLOT_NODE_CHARACTER_MISMATCH', prefix);
    if (authoring.require_asset_bindings) {
      const binding = bindingByNode.get(slot.scene_node_id);
      need(Boolean(binding?.valid), 'NETWORK_SLOT_ASSET_BINDING_REQUIRED', prefix);
      need(binding?.asset_kind === 'model-3d', 'NETWORK_SLOT_MODEL_3D_REQUIRED', prefix);
      need(binding?.asset_mime === 'model/gltf-binary', 'NETWORK_SLOT_GLB_REQUIRED', prefix);
    }
  }
  const validBindings = [...bindingByNode.values()].filter(binding => binding.valid);
  for (const binding of bindingByNode.values()) {
    if (!binding.valid) warnings.push({ code: 'NETWORK_ASSET_BINDING_INCOMPLETE', path: binding.scene_node_id, diagnostics: binding.diagnostics });
  }
  return {
    valid: errors.length === 0,
    configured: true,
    errors,
    warnings,
    player_slot_count: slots.length,
    asset_binding_count: validBindings.length,
    spatial_workspace_root: project?.spatial3d?.workspace_root ?? null,
    authoring_root: authoring.authoring_root ?? null,
  };
}

export function compileNetworkWorld(project, options = {}) {
  const authoring = options.authoring ?? project?.network;
  if (!authoring) throw new StudioError('NETWORK_AUTHORING_REQUIRED');
  const validation = validateNetworkAuthoring(project, authoring);
  if (!validation.valid) throw new StudioError('NETWORK_AUTHORING_INVALID', '', validation);
  if (typeof project?.project_root !== 'string' || project.project_root.length < 32) throw new StudioError('NETWORK_PROJECT_ROOT_REQUIRED');
  const workspace = project.spatial3d;
  const sourceWorld = workspace.worlds[authoring.world_id];
  const scene = project.scenes.find(item => item.scene_id === project.active_scene_id);
  const assetBindings = deriveAssetBindings(project, sourceWorld).sort((left, right) => left.binding_id.localeCompare(right.binding_id));
  const sourceWorldPayload = clean(deep(sourceWorld));
  delete sourceWorldPayload.world_root;
  const sourceWorldRoot = sourceWorld.world_root ?? rfeRootHash(sourceWorldPayload);
  const evidence = seal({
    format: 'reality-studio.network-world-source-evidence.v1.6',
    version: NETWORK_WORLD_COMPILER_VERSION,
    project_root: project.project_root,
    spatial_workspace_root: workspace.workspace_root,
    source_world_root: sourceWorldRoot,
    active_scene_root: scene.scene_root,
    authoring_root: authoring.authoring_root,
    asset_binding_roots: assetBindings.map(binding => binding.binding_root),
  }, 'evidence_root');
  const worldConfig = normalizeWorldConfig(sourceWorldPayload, {
    projectRoot: project.project_root,
    evidenceRoot: evidence.evidence_root,
  });
  const worldConfigRoot = rfeRootHash(worldConfig);
  const compilation = seal({
    format: NETWORK_WORLD_COMPILATION_FORMAT,
    version: NETWORK_WORLD_COMPILER_VERSION,
    project_id: project.identity.project_id,
    project_root: project.project_root,
    world_id: authoring.world_id,
    spatial_workspace_root: workspace.workspace_root,
    source_world_root: sourceWorldRoot,
    active_scene_id: scene.scene_id,
    active_scene_root: scene.scene_root,
    authoring_root: authoring.authoring_root,
    world_config: worldConfig,
    world_config_root: worldConfigRoot,
    player_slots: deep(authoring.player_slots),
    asset_bindings: assetBindings,
    network_profile: deep(authoring.transport_profile),
    authority: deep(authoring.authority),
    evidence,
    counts: {
      bodies: worldConfig.bodies.length,
      characters: worldConfig.characters.length,
      joints: worldConfig.joints.length,
      player_slots: authoring.player_slots.length,
      asset_bindings: assetBindings.length,
    },
  }, 'compilation_root');
  const verification = verifyNetworkWorldCompilation(compilation);
  if (!verification.valid) throw new StudioError('NETWORK_WORLD_COMPILATION_INVALID', '', verification);
  return compilation;
}

export function verifyNetworkWorldCompilation(compilation) {
  const errors = [];
  const check = (condition, code) => { if (!condition) errors.push(code); };
  if (!compilation || typeof compilation !== 'object') return { valid: false, errors: ['NETWORK_COMPILATION_NOT_OBJECT'] };
  check(compilation.format === NETWORK_WORLD_COMPILATION_FORMAT, 'NETWORK_COMPILATION_FORMAT_INVALID');
  check(compilation.version === NETWORK_WORLD_COMPILER_VERSION, 'NETWORK_COMPILATION_VERSION_INVALID');
  check(verifySeal(compilation, 'compilation_root'), 'NETWORK_COMPILATION_ROOT_MISMATCH');
  check(rfeRootHash(clean(compilation.world_config)) === compilation.world_config_root, 'NETWORK_WORLD_CONFIG_ROOT_MISMATCH');
  check(verifySeal(compilation.evidence, 'evidence_root'), 'NETWORK_EVIDENCE_ROOT_MISMATCH');
  check(compilation.world_config?.worldId === compilation.world_id, 'NETWORK_WORLD_ID_MISMATCH');
  check(compilation.world_config?.reality?.realityRoot === compilation.project_root, 'NETWORK_PROJECT_AUTHORITY_ROOT_MISMATCH');
  check(compilation.world_config?.reality?.evidenceRoot === compilation.evidence?.evidence_root, 'NETWORK_WORLD_EVIDENCE_ROOT_MISMATCH');
  const bodies = new Map((compilation.world_config?.bodies ?? []).map(body => [body.id, body]));
  const characters = new Map((compilation.world_config?.characters ?? []).map(character => [character.id, character]));
  for (const slot of compilation.player_slots ?? []) {
    check(bodies.has(slot.body_id), `NETWORK_SLOT_BODY_MISSING:${slot.slot_id}`);
    check(characters.get(slot.character_id)?.bodyId === slot.body_id, `NETWORK_SLOT_CHARACTER_BODY_MISMATCH:${slot.slot_id}`);
  }
  for (const binding of compilation.asset_bindings ?? []) {
    check(verifySeal(binding, 'binding_root'), `NETWORK_ASSET_BINDING_ROOT_MISMATCH:${binding.binding_id}`);
    check(bodies.has(binding.body_id), `NETWORK_ASSET_BODY_MISSING:${binding.binding_id}`);
  }
  return {
    valid: errors.length === 0,
    errors,
    compilation_root: compilation.compilation_root ?? null,
    world_config_root: compilation.world_config_root ?? null,
    project_root: compilation.project_root ?? null,
  };
}

export async function renderNetworkAssetViewport({ project, compilation, snapshot, projectFile = null, width = 480, height = 270, qualityTier = 'balanced' } = {}) {
  const verification = verifyNetworkWorldCompilation(compilation);
  if (!verification.valid) throw new StudioError('NETWORK_WORLD_COMPILATION_INVALID', '', verification);
  if (!snapshot || snapshot.worldId !== compilation.world_id) throw new StudioError('NETWORK_VIEWPORT_SNAPSHOT_INVALID');
  const editor = project?.spatial3d?.editor ?? {};
  const camera = editor.camera ?? {};
  const position = camera.position_milli ?? { x: 7000, y: 5000, z: 9000 };
  const rotation = camera.rotation_mdeg ?? { x: -18000, y: 38000, z: 0 };
  const scene = projectSpatialSnapshotToVSRScene(snapshot, {
    cameraPosition: [position.x / 1000, position.y / 1000, position.z / 1000],
    cameraRotationDeg: [rotation.x / 1000, rotation.y / 1000, rotation.z / 1000],
    includeContacts: editor.show_contacts ?? true,
    includeSensoryEvents: editor.show_sensory ?? true,
  });
  const { importGltfToSpatialScene } = await gltfAsset();
  const imported = [];
  for (const [index, binding] of compilation.asset_bindings.entries()) {
    if (binding.asset_mime !== 'model/gltf-binary') continue;
    const record = project.assets.registry[binding.asset_id];
    const file = record.files.find(item => item.sha256 === binding.asset_sha256) ?? record.files.find(item => item.mime === 'model/gltf-binary');
    const bytes = resolveAssetBytes(file, projectFile);
    const glb = parseGlb(bytes);
    const result = importGltfToSpatialScene(glb.json, {
      sceneId: `studio-network-asset:${index}`,
      title: record.name,
      buffers: glb.buffers,
    });
    mergeAssetScene(scene, result.scene, binding, index);
    imported.push({ binding, receipt: result.receipt });
  }
  scene.reality = {
    worldId: snapshot.worldId,
    generation: snapshot.reality?.generation ?? snapshot.tick,
    realityRoot: compilation.project_root,
    evidenceRoot: compilation.compilation_root,
  };
  const { renderSpatialReference, verifySpatialFrame } = await spatial3d();
  const rendered = renderSpatialReference(scene, { width, height, qualityTier, enableShadows: true });
  const frameVerification = verifySpatialFrame(rendered.framePlan);
  const assetMeshIds = new Set(scene.meshes.filter(mesh => mesh.id.startsWith('network-asset:')).map(mesh => mesh.id));
  const assetDraws = rendered.framePlan.drawPackets.filter(packet => assetMeshIds.has(packet.meshId));
  const receipt = seal({
    format: NETWORK_ASSET_VIEWPORT_FORMAT,
    version: NETWORK_WORLD_COMPILER_VERSION,
    project_root: compilation.project_root,
    compilation_root: compilation.compilation_root,
    source_state_root: snapshot.stateRoot,
    frame_root: rendered.framePlan.frameRoot,
    pixel_root: rendered.pixelRoot,
    imported_asset_roots: imported.map(item => item.binding.asset_root),
    gltf_receipt_roots: imported.map(item => item.receipt.receiptRoot),
    imported_asset_count: imported.length,
    asset_draw_count: assetDraws.length,
    frame_verified: frameVerification.ok,
    viewport: { width, height, quality_tier: qualityTier },
  }, 'viewport_root');
  return { ...receipt, png: rendered.png, scene, frame_plan: rendered.framePlan };
}

function normalizePlayerSlot(slot, index) {
  const actions = unique((slot.actions ?? ['move', 'jump', 'impulse']).map(String)).sort();
  return {
    slot_id: text(slot.slotId ?? slot.slot_id, `slot:${index + 1}`),
    subject_id: text(slot.subjectId ?? slot.subject_id),
    player_id: text(slot.playerId ?? slot.player_id),
    character_id: text(slot.characterId ?? slot.character_id),
    body_id: text(slot.bodyId ?? slot.body_id),
    scene_node_id: text(slot.sceneNodeId ?? slot.scene_node_id),
    actions,
  };
}

function deriveAssetBindings(project, world, { includeInvalid = false } = {}) {
  const scene = project?.scenes?.find(item => item.scene_id === project.active_scene_id);
  const bodyIds = new Set((world?.bodies ?? []).map(body => body.id));
  const characterIds = new Set((world?.characters ?? []).map(character => character.id));
  const bindings = [];
  for (const node of scene?.nodes ?? []) {
    const bodyId = node.components?.spatial_body_id;
    if (!bodyId) continue;
    const asset = project.assets?.registry?.[node.asset_id];
    const modelFile = asset?.files?.find(file => file.mime === 'model/gltf-binary') ?? asset?.files?.find(file => file.path?.toLowerCase().endsWith('.glb'));
    const diagnostics = [];
    if (!bodyIds.has(bodyId)) diagnostics.push('body-missing');
    if (!asset) diagnostics.push('asset-missing');
    if (!asset?.asset_root) diagnostics.push('asset-root-missing');
    if (!modelFile) diagnostics.push('glb-file-missing');
    const characterId = node.components?.spatial_character_id ?? null;
    if (characterId && !characterIds.has(characterId)) diagnostics.push('character-missing');
    const base = {
      format: 'reality-studio.network-asset-binding.v1.6',
      version: NETWORK_WORLD_COMPILER_VERSION,
      binding_id: `binding:${node.node_id}`,
      scene_node_id: node.node_id,
      asset_id: node.asset_id ?? null,
      asset_root: asset?.asset_root ?? null,
      asset_kind: asset?.kind ?? null,
      asset_mime: modelFile?.mime ?? null,
      asset_sha256: modelFile?.sha256 ?? null,
      body_id: bodyId,
      character_id: characterId,
      visible: node.visible !== false,
      scale_milli: integer(node.components?.spatial_scale_milli, 1000),
    };
    const binding = seal({
      ...base,
      valid: diagnostics.length === 0,
      diagnostics,
    }, 'binding_root');
    if (binding.valid || includeInvalid) bindings.push(binding);
  }
  return bindings;
}

function normalizeWorldConfig(world, { projectRoot, evidenceRoot }) {
  const output = clean(deep(world));
  delete output.world_root;
  output.bodies = (output.bodies ?? []).map(body => ({
    ...body,
    fixtures: (body.fixtures ?? []).slice().sort((left, right) => left.id.localeCompare(right.id)),
  })).sort((left, right) => left.id.localeCompare(right.id));
  output.characters = (output.characters ?? []).slice().sort((left, right) => left.id.localeCompare(right.id));
  output.joints = (output.joints ?? []).slice().sort((left, right) => left.id.localeCompare(right.id));
  output.listeners = (output.listeners ?? []).slice().sort((left, right) => left.id.localeCompare(right.id));
  output.materials = (output.materials ?? []).slice().sort((left, right) => left.id.localeCompare(right.id));
  output.reality = {
    generation: integer(world.reality?.generation, 0),
    realityRoot: projectRoot,
    evidenceRoot,
  };
  return output;
}

function resolveAssetBytes(file, projectFile) {
  if (file?.embedded_base64) return Buffer.from(file.embedded_base64, 'base64');
  const candidates = [file?.absolute_path];
  if (projectFile && file?.path) {
    const root = path.dirname(path.resolve(projectFile));
    candidates.push(path.resolve(root, file.path), path.resolve(root, 'assets', file.path));
  }
  const resolved = candidates.filter(Boolean).find(candidate => fs.existsSync(candidate) && fs.statSync(candidate).isFile());
  if (!resolved) throw new StudioError('NETWORK_ASSET_FILE_MISSING', file?.path ?? 'unknown');
  return fs.readFileSync(resolved);
}

function parseGlb(bytes) {
  if (!Buffer.isBuffer(bytes)) bytes = Buffer.from(bytes);
  if (bytes.length < 20 || bytes.readUInt32LE(0) !== 0x46546c67 || bytes.readUInt32LE(4) !== 2 || bytes.readUInt32LE(8) !== bytes.length) {
    throw new StudioError('NETWORK_ASSET_GLB_INVALID');
  }
  let offset = 12;
  let json = null;
  let binary = null;
  while (offset + 8 <= bytes.length) {
    const length = bytes.readUInt32LE(offset);
    const type = bytes.readUInt32LE(offset + 4);
    if (offset + 8 + length > bytes.length) throw new StudioError('NETWORK_ASSET_GLB_CHUNK_BOUNDS_INVALID');
    const chunk = bytes.subarray(offset + 8, offset + 8 + length);
    if (type === 0x4e4f534a) json = JSON.parse(chunk.toString('utf8').replace(/[\u0000\u0020]+$/g, ''));
    if (type === 0x004e4942) binary = new Uint8Array(chunk);
    offset += 8 + length;
  }
  if (offset !== bytes.length || !json || json.asset?.version !== '2.0' || !binary) throw new StudioError('NETWORK_ASSET_GLB_CHUNKS_INVALID');
  return { json, buffers: { 'buffer:0': binary } };
}

function mergeAssetScene(target, source, binding, index) {
  const prefix = `network-asset:${index}:`;
  const mapId = id => `${prefix}${id}`;
  const textureFields = ['baseColorTextureId', 'metallicRoughnessTextureId', 'normalTextureId', 'occlusionTextureId', 'emissiveTextureId'];
  const meshes = source.meshes.map(mesh => ({ ...deep(mesh), id: mapId(mesh.id) }));
  const textures = (source.textures ?? []).map(texture => ({ ...deep(texture), id: mapId(texture.id) }));
  const materials = source.materials.map(material => {
    const next = { ...deep(material), id: mapId(material.id) };
    for (const field of textureFields) if (next[field]) next[field] = mapId(next[field]);
    return next;
  });
  const sourceNodeIds = new Set(source.nodes.map(node => node.id));
  const scale = binding.scale_milli / 1000;
  const nodes = source.nodes.map(node => ({
    ...deep(node),
    id: mapId(node.id),
    parentId: node.parentId ? mapId(node.parentId) : `body:${binding.body_id}`,
    meshId: node.meshId ? mapId(node.meshId) : undefined,
    materialId: node.materialId ? mapId(node.materialId) : undefined,
    transform: {
      ...deep(node.transform ?? {}),
      scale: (node.transform?.scale ?? [1, 1, 1]).map(value => value * scale),
    },
    tags: [...(node.tags ?? []), 'studio-network-asset', binding.asset_id, binding.body_id],
  }));
  for (const node of target.nodes) {
    if (node.parentId === `body:${binding.body_id}` && !node.id.startsWith(prefix)) node.visible = false;
  }
  const animations = (source.animations ?? []).map(animation => ({
    ...deep(animation),
    id: mapId(animation.id),
    channels: animation.channels.map(channel => ({ ...deep(channel), nodeId: sourceNodeIds.has(channel.nodeId) ? mapId(channel.nodeId) : channel.nodeId })),
  }));
  target.meshes.push(...meshes);
  target.materials.push(...materials);
  target.textures = [...(target.textures ?? []), ...textures];
  target.animations = [...(target.animations ?? []), ...animations];
  target.nodes.push(...nodes);
}
