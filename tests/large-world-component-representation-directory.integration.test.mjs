import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT,
  executeUniversalArtAssetComponentRepresentationImport,
  createUniversalArtAssetComponentAssembly,
  createUniversalArtAssetComponentGraph,
  createUniversalArtAssetGenome,
  createLargeWorldRuntime,
  createLargeWorldSpatialGlbBundle,
  executeUniversalArtAssetComponentGraph,
  lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory,
  verifyUniversalArtAssetComponentRepresentationDirectory,
  verifyUniversalArtAssetComponentRepresentationImport
} from '@taowind/large-world-runtime';
import {AssetProviderAdapter, createAssetProviderManifest} from '@taowind/reality-asset-genesis-fabric';
import {
  VSRSpatialAssetStreamer,
  compileSpatialFrame,
  composeSpatialSceneFragments,
  resolveSpatialAssetStreaming,
  verifySpatialAssetStreamingReceipt,
  verifySpatialSceneCompositionReceipt
} from '@taowind/visual-state-runtime/spatial-reality-3d';
import {decodeGltfImageToSpatialTexture, importGlbToSpatialScene, importGlbToSpatialSceneAsync, verifyGltfImportReceipt} from '@taowind/visual-state-runtime/gltf-asset';

const root = letter => letter.repeat(64);

function createFixture({validMesh = false, includeBlade = false, pbrMesh = false} = {}) {
  const rootGenome = createUniversalArtAssetGenome({
    asset_profile: 'character',
    asset_kind: 'character-3d',
    quality_tier: 'AAA',
    description: '可挂载粒子特效的空间角色。',
    seed: 'component-representation-directory-root',
    target_platforms: ['desktop', 'web']
  });
  const specs = [
    {
      component_id: 'body',
      role: 'body',
      asset_profile: 'character',
      asset_kind: 'character-3d',
      description: '空间角色身体。',
      seed: 'component-representation-directory-body',
      representation_kind: 'mesh',
      representation_profile: 'skinned-pbr'
    },
    ...(includeBlade ? [{
      component_id: 'blade',
      role: 'equipment-blade',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      description: '空间角色装备网格。',
      seed: 'component-representation-directory-blade',
      representation_kind: 'mesh',
      representation_profile: 'rigid-pbr',
      depends_on: ['body'],
      transform_mm: [1400, 0, 0]
    }] : []),
    {
      component_id: 'sparks',
      role: 'impact-particles',
      asset_profile: 'vfx',
      asset_kind: 'vfx-3d',
      description: '空间命中粒子。',
      seed: 'component-representation-directory-sparks',
      representation_kind: 'particle',
      representation_profile: 'impact-burst',
      depends_on: ['body'],
      transform_mm: [0, 1200, 0]
    }
  ];
  const genomes = Object.fromEntries(specs.map(spec => [spec.component_id, createUniversalArtAssetGenome({
    asset_profile: spec.asset_profile,
    asset_kind: spec.asset_kind,
    quality_tier: 'AAA',
    description: spec.description,
    seed: spec.seed
  })]));
  const graph = createUniversalArtAssetComponentGraph({
    genome: rootGenome,
    composition_id: 'component-graph:representation-directory-integration',
    scene_id: 'scene:representation-directory-integration',
    components: specs.map(spec => ({...spec, genome: genomes[spec.component_id]}))
  });
  const outputRoles = ['mesh-glb', 'pbr-texture-pack', 'rig-candidate', 'animation-clips'];
  const manifest = createAssetProviderManifest({
    id: 'provider:test:component-representation-directory',
    name: 'Component Representation Directory Fixture',
    version: '0.1.0',
    providerType: 'multi-family-test',
    capabilities: [
      'asset.generate.3d.production',
      'asset.generate.mesh',
      'asset.generate.pbr',
      'asset.generate.vfx',
      'asset.rig.predict',
      'asset.pose.initial',
      'asset.generate.skeleton-rig',
      'asset.generate.animation-clips'
    ],
    capability_descriptors: [
      {capability_id: 'asset.generate.3d.production', outputs: outputRoles, quality_tier: 'PRODUCTION'},
      {capability_id: 'asset.generate.mesh', outputs: ['mesh-glb'], quality_tier: 'PRODUCTION'},
      {capability_id: 'asset.generate.pbr', outputs: ['pbr-texture-pack'], quality_tier: 'PRODUCTION'},
      {capability_id: 'asset.generate.vfx', outputs: ['mesh-glb', 'pbr-texture-pack'], quality_tier: 'PRODUCTION'},
      {capability_id: 'asset.rig.predict', outputs: ['rig-candidate'], quality_tier: 'PRODUCTION'},
      {capability_id: 'asset.pose.initial', outputs: ['animation-clips'], quality_tier: 'PRODUCTION'}
    ],
    inputFormats: ['ragf.asset-genome.v0.3'],
    outputFormats: ['model/gltf-binary', 'application/json'],
    executionMode: 'local',
    hardwareRequirements: {cpu: 'any', ram: 'any', gpu: 'none', vram: 'none', accelerator: 'none'},
    license: {status: 'VERIFIED', identifier: 'Apache-2.0'},
    runtimeStatus: 'READY',
    upstream: {url: 'https://taowind.company', revision: 'component-representation-directory-integration'},
    metadata: {quality_tier: 'PRODUCTION', component_graph_fixture: true}
  });
  const validMeshPayload = validMesh ? (() => {
    const runtime = createLargeWorldRuntime({worldId: 'world:component-representation-directory-glb', seed: 'seed:component-representation-directory-glb', width: 5, depth: 5, chunkSize: 64, sampleResolution: 8, loadRadius: 1, maxActiveChunks: 9});
    runtime.observe({x: 0, z: 0});
    const active = runtime.listActiveChunks();
    const selection = runtime.selectActiveRepresentationPortfolios({quality_by_chunk: Object.fromEntries(active.map(chunk => [chunk.chunk_id, 'STANDARD']))});
    const scene = runtime.createSpatialScene({selection, scene_id: 'component-representation-directory-glb-scene'});
    const bundle = createLargeWorldSpatialGlbBundle(scene, pbrMesh ? {texture_profile: 'ragf.ktx2-pbr-mipped.v0.1', texture_size: 8} : {});
    return bundle.assets.find(asset => asset.record.metadata.lod === 0).payload;
  })() : null;
  const provider = new AssetProviderAdapter(manifest, {
    runner: ({operation, input}) => ({
      asset_id: input.asset_id,
      format: 'component-representation-directory-provider-output',
      outputs: outputRoles,
      files: outputRoles.map(role => {
        const mesh = role === 'mesh-glb' && validMeshPayload !== null;
        const payload = mesh ? validMeshPayload : Buffer.from(`${input.asset_id}:${input.component_context?.component_id}:${role}`);
        return {
          name: `${operation}/${role}.${mesh ? 'glb' : 'json'}`,
          path: `${operation}/${role}.${mesh ? 'glb' : 'json'}`,
          role,
          format: mesh ? 'model/gltf-binary' : 'application/json',
          mime: mesh ? 'model/gltf-binary' : 'application/json',
          base64: Buffer.from(payload).toString('base64')
        };
      }),
      generator_version: 'component-representation-directory-provider-fixture',
      seed: input.seed,
      evidence: {provider_success: true}
    })
  });
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-component-representation-directory-'));
  const run = executeUniversalArtAssetComponentGraph({
    graph,
    componentGenomes: genomes,
    providersByComponent: Object.fromEntries(graph.components.map(component => [component.component_id, provider])),
    outDir
  });
  const assembly = createUniversalArtAssetComponentAssembly({
    graph,
    execution: run.execution,
    componentExecutions: run.componentExecutions,
    scene_id: 'scene:representation-directory-integration',
    world_id: 'world:representation-directory-integration'
  });
  return {graph, run, assembly};
}

test('component representation directory is consumed by real VSR streaming and keeps RSR deferred', async () => {
  const {assembly} = createFixture();
  const directory = lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory({assembly});
  assert.equal(directory.format, UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT);
  assert.equal(directory.status, 'CANDIDATE_REPRESENTATION_DIRECTORY_READY');
  assert.equal(verifyUniversalArtAssetComponentRepresentationDirectory(directory, {assembly}).valid, true);

  const catalog = directory.vsr_catalog.assets;
  assert.deepEqual([...new Set(catalog.map(asset => asset.kind))].sort(), ['animation', 'material', 'mesh', 'other']);
  const totalBytes = catalog.reduce((sum, asset) => sum + asset.byteLength, 0);
  const resolved = resolveSpatialAssetStreaming(catalog, {
    activeCellIds: directory.representations.map(entry => entry.component_id),
    requestedAssetIds: catalog.map(asset => asset.id),
    maxAssets: catalog.length,
    maxBytes: totalBytes,
    lease: false
  });
  assert.equal(resolved.catalogRoot, directory.vsr_catalog.catalog_root);
  assert.deepEqual(resolved.missingAssetIds, []);
  assert.deepEqual(resolved.deferredAssetIds, []);

  const streamer = new VSRSpatialAssetStreamer(catalog, asset => fs.readFileSync(path.resolve(asset.metadata.output_directory, asset.metadata.relative_path)));
  const receipt = await streamer.acquire({
    activeCellIds: directory.representations.map(entry => entry.component_id),
    requestedAssetIds: catalog.map(asset => asset.id),
    maxAssets: catalog.length,
    maxBytes: totalBytes,
    lease: false
  });
  assert.equal(verifySpatialAssetStreamingReceipt(receipt), true);
  assert.deepEqual(receipt.failedAssetIds, []);
  assert.deepEqual(receipt.blockedAssetIds, []);
  assert.deepEqual([...receipt.readyAssetIds].sort(), catalog.map(asset => asset.id).sort());
  assert.equal(directory.representations.every(entry => entry.consumer_mapping.vsr.direct_import_status === 'NOT_EXECUTED'), true);
  assert.equal(directory.rsr_observation_inputs.every(input => input.execution_status === 'NOT_EXECUTED' && input.candidate_creation === 'DEFERRED_TO_RSR'), true);

  const rsr = await import('@taowind/reality-simulation-runtime/representation-observation');
  const reference = directory.representation_refs.find(candidate => candidate.representation_kind === 'mesh');
  assert.ok(reference);
  const observation = rsr.createRepresentationObservationCandidate({
    reference,
    observation: {kind: 'bounds', data: {directory_root: directory.directory_root}}
  });
  assert.equal(rsr.verifyRepresentationObservationCandidate(observation), true);
  assert.equal(observation.reconstruction_candidate, null);
  assert.equal(observation.canonical_state_proposal, null);
});

test('component representation directory schema is strict about consumer mappings', () => {
  const {assembly} = createFixture();
  const directory = lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory({assembly});
  const schema = JSON.parse(fs.readFileSync(new URL('../packages/world/large-world-runtime/schemas/universal-art-asset-component-representation-directory.v0.1.schema.json', import.meta.url), 'utf8'));
  const validate = new Ajv2020({strict: false, allErrors: true}).compile(schema);
  assert.equal(validate(directory), true, JSON.stringify(validate.errors));
  const escalated = structuredClone(directory);
  escalated.authoritative = true;
  assert.equal(validate(escalated), false);
  const coerced = structuredClone(directory);
  coerced.representations.find(entry => entry.representation_kind === 'particle').consumer_mapping.vsr.catalog_kind = 'mesh';
  assert.equal(verifyUniversalArtAssetComponentRepresentationDirectory(coerced, {assembly}).valid, false);
});

test('component representation import executes a verified VSR mesh handler and fails on stale bytes', async () => {
  const {assembly} = createFixture({validMesh: true});
  const directory = lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory({assembly});
  const loadAsset = asset => fs.readFileSync(path.resolve(asset.metadata.output_directory, asset.metadata.relative_path));
  const importers = {
      mesh: {
        handler_id: 'vsr.gltf-import',
        compile: ({entry, assets, payloads}) => {
        const meshAsset = assets.find(asset => asset.kind === 'mesh' && asset.format === 'model/gltf-binary');
        assert.ok(meshAsset);
        const imported = importGlbToSpatialScene(payloads.get(meshAsset.id), {
          sceneId: `component-vsr-import-${entry.component_id}`,
          sourceRoot: entry.representation_root
        });
        return {
          status: 'EXECUTED',
          receipt: imported.receipt,
          output_root: imported.receipt.sceneRoot,
          metrics: {
            mesh_count: imported.receipt.meshCount,
            material_count: imported.receipt.materialCount,
            animation_count: imported.receipt.animationCount
          }
        };
      },
      verify: ({result}) => verifyGltfImportReceipt(result.receipt)
    }
  };
  const executed = await executeUniversalArtAssetComponentRepresentationImport({
    directory,
    assembly,
    requestedComponentIds: ['body'],
    loadAsset,
    importers
  });
  assert.equal(executed.status, 'CANDIDATE_COMPONENT_REPRESENTATION_IMPORT_EXECUTED');
  assert.equal(executed.summary.executed_count, 1);
  assert.equal(executed.entries[0].status, 'EXECUTED');
  assert.equal(executed.entries[0].verification_status, 'HANDLER_VERIFIED');
  assert.equal(verifyUniversalArtAssetComponentRepresentationImport(executed, {directory}).valid, true);
  const schema = JSON.parse(fs.readFileSync(new URL('../packages/world/large-world-runtime/schemas/universal-art-asset-component-representation-import-execution.v0.1.schema.json', import.meta.url), 'utf8'));
  const validate = new Ajv2020({strict: false, allErrors: true}).compile(schema);
  assert.equal(validate(executed), true, JSON.stringify(validate.errors));

  const tamperedAssetId = directory.vsr_catalog.assets.find(asset => asset.metadata.component_id === 'body').id;
  const failed = await executeUniversalArtAssetComponentRepresentationImport({
    directory,
    assembly,
    requestedComponentIds: ['body'],
    loadAsset: asset => {
      const bytes = Buffer.from(loadAsset(asset));
      if (asset.id === tamperedAssetId) bytes[0] ^= 1;
      return bytes;
    },
    importers
  });
  assert.equal(failed.status, 'CANDIDATE_COMPONENT_REPRESENTATION_IMPORT_FAILED');
  assert.equal(failed.entries[0].status, 'FAILED');
  assert.match(failed.entries[0].reason, /BYTES_MISMATCH/);
  assert.equal(verifyUniversalArtAssetComponentRepresentationImport(failed, {directory}).valid, true);
});

test('component representation imports compose multiple VSR scenes under URRF transforms', async () => {
  const {assembly} = createFixture({validMesh: true, includeBlade: true, pbrMesh: true});
  const directory = lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory({assembly});
  const importedScenes = new Map();
  const loadAsset = asset => fs.readFileSync(path.resolve(asset.metadata.output_directory, asset.metadata.relative_path));
  const importers = {
    mesh: {
      handler_id: 'vsr.gltf-import.compose',
      compile: async ({entry, assets, payloads}) => {
        const meshAsset = assets.find(asset => asset.kind === 'mesh' && asset.format === 'model/gltf-binary');
        assert.ok(meshAsset);
        const imported = await importGlbToSpatialSceneAsync(payloads.get(meshAsset.id), {
          sceneId: `component-vsr-compose-${entry.component_id}`,
          sourceRoot: entry.representation_root,
          imageDecoder: decodeGltfImageToSpatialTexture
        });
        importedScenes.set(entry.component_id, imported.scene);
        return {
          status: 'EXECUTED',
          receipt: imported.receipt,
          output_root: imported.receipt.sceneRoot,
          metrics: {
            texture_count: imported.receipt.textureCount,
            material_texture_binding_count: imported.receipt.materialTextureBindingCount
          }
        };
      },
      verify: ({result}) => verifyGltfImportReceipt(result.receipt)
    }
  };
  const imported = await executeUniversalArtAssetComponentRepresentationImport({
    directory,
    assembly,
    requestedComponentIds: ['body', 'blade'],
    loadAsset,
    importers
  });
  assert.equal(imported.status, 'CANDIDATE_COMPONENT_REPRESENTATION_IMPORT_EXECUTED');
  assert.equal(imported.summary.executed_count, 2);
  assert.equal(importedScenes.size, 2);
  assert.deepEqual(imported.entries.map(entry => [entry.metrics.texture_count, entry.metrics.material_texture_binding_count]), [[4, 5], [4, 5]]);
  const fragments = ['body', 'blade'].map(componentId => {
    const entry = directory.representations.find(candidate => candidate.component_id === componentId);
    assert.ok(entry);
    return {
      id: componentId,
      scene: importedScenes.get(componentId),
      transform: {
        translation: entry.transform.translation_mm.map(value => value / 1000),
        rotationEulerDeg: [...entry.transform.rotation_deg],
        scale: entry.transform.scale_milli.map(value => value / 1000)
      },
      tags: [`urrf-component:${componentId}`]
    };
  });
  const composed = composeSpatialSceneFragments(fragments, {
    sceneId: 'scene:component-representation-composed',
    worldId: directory.world_id,
    realityRoot: directory.directory_root,
    camera: {
      id: 'camera:component-representation-composed',
      projection: 'perspective',
      fovYDeg: 45,
      near: 0.1,
      far: 1000,
      transform: {translation: [32, 2, 100]}
    }
  });
  assert.equal(composed.scene.meshes.length, 2);
  assert.equal(composed.scene.materials.length, 2);
  assert.equal(composed.scene.nodes.filter(node => node.tags?.includes('vsr-composition-anchor')).length, 2);
  assert.equal(composed.scene.nodes.filter(node => node.meshId).length, 2);
  assert.equal(composed.scene.nodes.find(node => node.id === 'fragment:blade:anchor').transform.translation[0], 1.4);
  assert.equal(verifySpatialSceneCompositionReceipt(composed.receipt, {scene: composed.scene, fragments}), true);
  const frame = compileSpatialFrame(composed.scene, {width: 160, height: 120, enableShadows: false});
  assert.equal(frame.stats.visibleDraws, 2);
  const tampered = {...composed.receipt, sceneRoot: 'f'.repeat(64)};
  assert.equal(verifySpatialSceneCompositionReceipt(tampered), false);
});
