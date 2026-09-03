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
import {
  createVsrNonMeshRepresentationComponentImportHandlerSet,
  createVsrPbrMaterialComponentImportHandler,
  hasVsrPbrMaterialAssets
} from '@taowind/visual-state-runtime/representation-provider';
import {
  lowerVsrCurveCandidateToSpatialScene,
  lowerVsrGaussianSplatCandidateToSpatialScene,
  lowerVsrNeuralFieldCandidateToSpatialScene,
  lowerVsrParticleEmitterToSpatialScene,
  lowerVsrPointCloudCandidateToSpatialScene,
  lowerVsrSdfCandidateToSpatialScene,
  lowerVsrVoxelCandidateToSpatialScene,
  verifyVsrCurveSpatialScene,
  verifyVsrGaussianSplatSpatialScene,
  verifyVsrNeuralFieldSpatialScene,
  verifyVsrSpatialParticleScene,
  verifyVsrPointCloudSpatialScene,
  verifyVsrSdfSpatialScene,
  verifyVsrVoxelSpatialScene
} from '@taowind/visual-state-runtime/spatial-reality-3d';

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

const SPATIAL_LOWERERS = Object.freeze({
  sdf: {lower: lowerVsrSdfCandidateToSpatialScene, verify: verifyVsrSdfSpatialScene},
  voxel: {lower: lowerVsrVoxelCandidateToSpatialScene, verify: verifyVsrVoxelSpatialScene},
  'point-cloud': {lower: lowerVsrPointCloudCandidateToSpatialScene, verify: verifyVsrPointCloudSpatialScene},
  'gaussian-splat': {lower: lowerVsrGaussianSplatCandidateToSpatialScene, verify: verifyVsrGaussianSplatSpatialScene},
  'neural-field': {lower: lowerVsrNeuralFieldCandidateToSpatialScene, verify: verifyVsrNeuralFieldSpatialScene},
  curve: {lower: lowerVsrCurveCandidateToSpatialScene, verify: verifyVsrCurveSpatialScene}
});

const SPATIAL_OPTION_ALIASES = Object.freeze({
  'point-cloud': 'pointCloud',
  'gaussian-splat': 'gaussianSplat',
  'neural-field': 'neuralField'
});

function spatialOptionsFor(config, representationKind) {
  return record(config[representationKind] ?? config[SPATIAL_OPTION_ALIASES[representationKind]]);
}

function sourceOutputRoot(result) {
  return result?.receipt?.candidateRoot ?? result?.receipt?.emitterRoot ?? null;
}

function spatialRenderableCount(spatial) {
  return Number(spatial?.renderableCount ?? spatial?.occupiedCount ?? spatial?.pointCount ?? spatial?.voxelCount ?? spatial?.splatCount ?? spatial?.triangleCount ?? 0);
}

/**
 * Keep the legacy opaque material descriptor available, but route an explicit
 * four-channel PBR pack through the stronger material candidate contract.
 */
function createMaterialHandler({pbr, descriptor}) {
  if (!pbr || !descriptor) throw new Error('URRF VSR material bridge requires both PBR and descriptor handlers.');
  return Object.freeze({
    representation_kind: 'material',
    handler_id: pbr.handler_id,
    compile: async context => hasVsrPbrMaterialAssets(context?.assets ?? [])
      ? pbr.compile(context)
      : descriptor.compile(context),
    verify: async input => input?.result?.candidate?.format === 'vsr.pbr-material-candidate.v0.1'
      ? pbr.verify(input)
      : descriptor.verify(input)
  });
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
 * Upgrade a validated non-mesh/particle handler to an explicit spatial
 * candidate handler. The generic VSR receipt is retained as the source proof;
 * the spatial receipt becomes the execution output root and is independently
 * verified before the callback is released.
 */
function bindSpatialHandler(representationKind, handler, spatialLowerer, spatialVerifier, options, onVerifiedResult) {
  if (!handler || !nonEmptyText(handler.handler_id) || typeof handler.compile !== 'function' || typeof handler.verify !== 'function' || typeof spatialLowerer !== 'function' || typeof spatialVerifier !== 'function') {
    throw new Error(`URRF VSR spatial bridge handler ${representationKind} is invalid.`);
  }
  return Object.freeze({
    representation_kind: representationKind,
    handler_id: handler.handler_id,
    compile: async context => {
      const sourceResult = await handler.compile(context);
      const spatial = representationKind === 'particle'
        ? spatialLowerer(sourceResult.emitter, options)
        : spatialLowerer(sourceResult.candidate, {assets: context.assets, payloads: context.payloads}, options);
      return {
        ...sourceResult,
        spatial,
        output_root: spatial.root,
        metrics: {
          ...sourceResult.metrics,
          rendered: 1,
          spatial_scene: 1,
          spatial_renderable_count: spatialRenderableCount(spatial),
          spatial_scene_root_bound: 1
        }
      };
    },
    verify: async input => {
      const result = input?.result;
      const sourceRoot = sourceOutputRoot(result);
      const sourceResult = result && sourceRoot
        ? {...result, output_root: sourceRoot, metrics: {...record(result.metrics), ...(result.candidate ? {rendered: 0} : {})}}
        : null;
      const sourceVerified = sourceResult ? await handler.verify({...input, result: sourceResult}) : false;
      const spatialVerified = result?.spatial ? spatialVerifier(result.spatial) : false;
      const verified = sourceVerified === true
        && spatialVerified === true
        && result.output_root === result.spatial.root
        && result.metrics?.rendered === 1
        && result.metrics?.spatial_scene === 1
        && result.metrics?.spatial_renderable_count === spatialRenderableCount(result.spatial);
      if (verified && typeof onVerifiedResult === 'function') {
        await onVerifiedResult({
          bridge_format: URRF_VSR_ART_ASSET_BRIDGE_FORMAT,
          bridge_version: URRF_VSR_ART_ASSET_BRIDGE_VERSION,
          representation_kind: representationKind,
          component_id: componentIdOf(input?.entry, result),
          result
        });
      }
      return verified;
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
  const materialOptions = record(options.material);
  const nonMeshOptions = record(options.nonMesh);
  const spatialOptions = record(options.spatial);
  const spatialEnabled = options.spatial === true || spatialOptions.enabled === true;
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
  const pbrMaterial = createVsrPbrMaterialComponentImportHandler({
    ...materialOptions,
    handlerId: materialOptions.handlerId ?? `${prefix}.material.v0.1`
  });
  const material = createMaterialHandler({pbr: pbrMaterial, descriptor: nonMesh.material});

  const bindNonMesh = (representationKind, handler) => spatialEnabled && SPATIAL_LOWERERS[representationKind]
    ? bindSpatialHandler(representationKind, handler, SPATIAL_LOWERERS[representationKind].lower, SPATIAL_LOWERERS[representationKind].verify, spatialOptionsFor(spatialOptions, representationKind), onVerifiedResult)
    : bindHandler(representationKind, handler, onVerifiedResult);
  const bindParticle = spatialEnabled
    ? bindSpatialHandler('particle', particle, lowerVsrParticleEmitterToSpatialScene, verifyVsrSpatialParticleScene, spatialOptionsFor(spatialOptions, 'particle'), onVerifiedResult)
    : bindHandler('particle', particle, onVerifiedResult);

  return Object.freeze({
    mesh: bindHandler('mesh', mesh, onVerifiedResult),
    sdf: bindNonMesh('sdf', nonMesh.sdf),
    voxel: bindNonMesh('voxel', nonMesh.voxel),
    'point-cloud': bindNonMesh('point-cloud', nonMesh['point-cloud']),
    'gaussian-splat': bindNonMesh('gaussian-splat', nonMesh['gaussian-splat']),
    'neural-field': bindNonMesh('neural-field', nonMesh['neural-field']),
    curve: bindNonMesh('curve', nonMesh.curve),
    particle: bindParticle,
    material: bindHandler('material', material, onVerifiedResult),
    rig: bindHandler('rig', rig, onVerifiedResult),
    animation: bindHandler('animation', animation, onVerifiedResult)
  });
}

/**
 * Explicit spatial mode for callers that need a VSR scene as the handler
 * output. Default import mode stays descriptor-only, so importing a candidate
 * never silently implies rendering or a target-device result.
 */
export function createUrrfVsrArtAssetSpatialImporters(options = {}) {
  const currentSpatial = record(options.spatial);
  return createUrrfVsrArtAssetImporters({...options, spatial: {...currentSpatial, enabled: true}});
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

export function createUrrfVsrArtAssetSpatialImportBinding(options = {}) {
  return createUrrfVsrArtAssetImportBinding({...options, spatial: {...record(options.spatial), enabled: true}});
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
