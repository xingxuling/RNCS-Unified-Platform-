import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT,
  createUniversalArtAssetComponentAssembly,
  createUniversalArtAssetComponentGraph,
  createUniversalArtAssetGenome,
  executeUniversalArtAssetComponentGraph,
  lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory,
  verifyUniversalArtAssetComponentRepresentationDirectory
} from '@taowind/large-world-runtime';
import {AssetProviderAdapter, createAssetProviderManifest} from '@taowind/reality-asset-genesis-fabric';
import {
  VSRSpatialAssetStreamer,
  resolveSpatialAssetStreaming,
  verifySpatialAssetStreamingReceipt
} from '@taowind/visual-state-runtime/spatial-reality-3d';

const root = letter => letter.repeat(64);

function createFixture() {
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
  const provider = new AssetProviderAdapter(manifest, {
    runner: ({operation, input}) => ({
      asset_id: input.asset_id,
      format: 'component-representation-directory-provider-output',
      outputs: outputRoles,
      files: outputRoles.map(role => ({
        name: `${operation}/${role}.json`,
        path: `${operation}/${role}.json`,
        role,
        format: 'application/json',
        mime: 'application/json',
        base64: Buffer.from(`${input.asset_id}:${input.component_context?.component_id}:${role}`).toString('base64')
      })),
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
