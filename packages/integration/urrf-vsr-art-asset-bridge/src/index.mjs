import {
  createUniversalArtAssetComponentRepresentationImportRegistry,
  executeUniversalArtAssetComponentRepresentationImport,
  verifyUniversalArtAssetComponentRepresentationImportRegistry
} from '@taowind/large-world-runtime';
import {
  createVsrGltfPbrComponentImportHandler,
  createVsrParticleComponentImportHandler,
  createVsrRigAnimationComponentImportHandler
} from '@taowind/visual-state-runtime/gltf-asset';
import {createVsrNonMeshRepresentationComponentImportHandlerSet} from '@taowind/visual-state-runtime/representation-provider';

export const URRF_VSR_ART_ASSET_BRIDGE_FORMAT = 'urrf.vsr-art-asset-component-bridge.v0.1';
export const URRF_VSR_ART_ASSET_BRIDGE_VERSION = '0.1.0';
export const URRF_VSR_ART_ASSET_REPRESENTATION_KINDS = Object.freeze([
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

const record = value => value && typeof value === 'object' && !Array.isArray(value) ? value : {};
const nonEmptyText = value => typeof value === 'string' && value.trim().length > 0;

function prefixOf(value) {
  const prefix = String(value ?? 'vsr.urrf.art-asset').trim();
  if (!prefix) throw new Error('URRF VSR art asset bridge handler prefix is required.');
  return prefix;
}

function componentIdOf(entry, result) {
  return String(entry?.component_id ?? entry?.componentId ?? result?.receipt?.componentId ?? result?.candidate?.componentId ?? result?.emitter?.componentId ?? '').trim();
}

/**
 * Add the URRF representation-kind binding and keep the VSR implementation
 * behind an explicit adapter. The callback runs only after the VSR verifier
 * accepts the result, so callers cannot mistake an unverified candidate for a
 * usable scene.
 */
function bindHandler(representationKind, handler, onVerifiedResult) {
  if (!handler || !nonEmptyText(handler.handler_id) || typeof handler.compile !== 'function' || typeof handler.verify !== 'function') {
    throw new Error(`URRF VSR art asset bridge handler ${representationKind} is invalid.`);
  }
  return Object.freeze({
    representation_kind: representationKind,
    handler_id: handler.handler_id,
    compile: async context => handler.compile(context),
    verify: async input => {
      const verified = await handler.verify(input);
      if (verified === true && typeof onVerifiedResult === 'function') {
        await onVerifiedResult({
          bridge_format: URRF_VSR_ART_ASSET_BRIDGE_FORMAT,
          bridge_version: URRF_VSR_ART_ASSET_BRIDGE_VERSION,
          representation_kind: representationKind,
          component_id: componentIdOf(input?.entry, input?.result),
          result: input.result
        });
      }
      return verified === true;
    }
  });
}

/**
 * Create the complete candidate-only VSR handler set accepted by the URRF
 * component representation registry. VSR owns interpretation; URRF/LWR owns
 * component selection, byte rehashing, coverage, and execution receipts.
 */
export function createUrrfVsrArtAssetImporters(options = {}) {
  const prefix = prefixOf(options.handlerIdPrefix);
  const meshOptions = record(options.mesh);
  const rigOptions = record(options.rig);
  const animationOptions = record(options.animation);
  const particleOptions = record(options.particle);
  const nonMeshOptions = record(options.nonMesh);
  const onVerifiedResult = options.onVerifiedResult;

  const mesh = createVsrGltfPbrComponentImportHandler({
    ...meshOptions,
    handlerId: meshOptions.handlerId ?? `${prefix}.mesh.v0.1`,
    ...(meshOptions.imageDecoder === undefined && options.imageDecoder !== undefined ? {imageDecoder: options.imageDecoder} : {})
  });
  const rig = createVsrRigAnimationComponentImportHandler({
    ...rigOptions,
    handlerId: rigOptions.handlerId ?? `${prefix}.rig.v0.1`
  });
  const animation = createVsrRigAnimationComponentImportHandler({
    ...animationOptions,
    handlerId: animationOptions.handlerId ?? `${prefix}.animation.v0.1`,
    ...(animationOptions.imageDecoder === undefined && options.imageDecoder !== undefined ? {imageDecoder: options.imageDecoder} : {})
  });
  const particle = createVsrParticleComponentImportHandler({
    ...particleOptions,
    handlerId: particleOptions.handlerId ?? `${prefix}.particle.v0.1`
  });
  const nonMesh = createVsrNonMeshRepresentationComponentImportHandlerSet({
    handlerIdPrefix: nonMeshOptions.handlerIdPrefix ?? `${prefix}.non-mesh`,
    ...(nonMeshOptions.sceneId === undefined ? {} : {sceneId: nonMeshOptions.sceneId})
  });

  return Object.freeze({
    mesh: bindHandler('mesh', mesh, onVerifiedResult),
    sdf: bindHandler('sdf', nonMesh.sdf, onVerifiedResult),
    voxel: bindHandler('voxel', nonMesh.voxel, onVerifiedResult),
    'point-cloud': bindHandler('point-cloud', nonMesh['point-cloud'], onVerifiedResult),
    'gaussian-splat': bindHandler('gaussian-splat', nonMesh['gaussian-splat'], onVerifiedResult),
    'neural-field': bindHandler('neural-field', nonMesh['neural-field'], onVerifiedResult),
    curve: bindHandler('curve', nonMesh.curve, onVerifiedResult),
    particle: bindHandler('particle', particle, onVerifiedResult),
    material: bindHandler('material', nonMesh.material, onVerifiedResult),
    rig: bindHandler('rig', rig, onVerifiedResult),
    animation: bindHandler('animation', animation, onVerifiedResult)
  });
}

/**
 * Create both the portable registry manifest and its process-local resolver.
 * The returned registry is the only object that should be passed to LWR
 * execution; the importer map is exposed for direct tests or custom callers.
 */
export function createUrrfVsrArtAssetImportBinding(options = {}) {
  const importers = createUrrfVsrArtAssetImporters(options);
  const registry = createUniversalArtAssetComponentRepresentationImportRegistry({importers});
  const verification = verifyUniversalArtAssetComponentRepresentationImportRegistry(registry);
  if (!verification.valid) throw new Error(`URRF VSR art asset bridge registry is invalid: ${verification.errors.join(',')}`);
  return Object.freeze({
    format: URRF_VSR_ART_ASSET_BRIDGE_FORMAT,
    version: URRF_VSR_ART_ASSET_BRIDGE_VERSION,
    importers,
    registry,
    representation_kinds: [...URRF_VSR_ART_ASSET_REPRESENTATION_KINDS],
    candidate_only: true,
    authoritative: false,
    canonical_write_authorized: false
  });
}

/**
 * Convenience execution wrapper. Callers still provide the verified URRF
 * directory and byte loader; no provider output or RNCS truth is mutated.
 */
export async function executeUrrfVsrArtAssetComponentRepresentationImport({importerRegistry, ...input} = {}) {
  const binding = importerRegistry ?? createUrrfVsrArtAssetImportBinding(input.bridge_options ?? {});
  const registry = binding.registry ?? binding;
  return executeUniversalArtAssetComponentRepresentationImport({
    ...input,
    importerRegistry: registry
  });
}
