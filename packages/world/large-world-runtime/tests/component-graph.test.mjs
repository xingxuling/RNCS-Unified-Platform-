import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import {
  UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_FORMAT,
  UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT,
  UNIVERSAL_ART_ASSET_COMPONENT_LOWERING_FORMAT,
  UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT,
  UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_IMPORT_REGISTRY_FORMAT,
  UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_IMPORT_FORMAT,
  createUniversalArtAssetComponentGraph,
  createUniversalArtAssetComponentAssembly,
  createUniversalArtAssetGenome,
  executeUniversalArtAssetComponentGraph,
  executeUniversalArtAssetComponentRepresentationImport,
  createUniversalArtAssetComponentRepresentationImportRegistry,
  lowerUniversalArtAssetComponentGraph,
  lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory,
  verifyUniversalArtAssetComponentGraph,
  verifyUniversalArtAssetComponentAssembly,
  verifyUniversalArtAssetComponentLowering,
  verifyUniversalArtAssetComponentExecution,
  verifyUniversalArtAssetComponentRepresentationDirectory,
  verifyUniversalArtAssetComponentRepresentationImport,
  verifyUniversalArtAssetComponentRepresentationImportRegistry
} from '../src/index.mjs';
import {AssetProviderAdapter, createAssetProviderManifest} from '@taowind/reality-asset-genesis-fabric';

const root = letter => letter.repeat(64);

const rootGenome = createUniversalArtAssetGenome({
  asset_profile: 'character',
  asset_kind: 'character-3d',
  quality_tier: 'AAA',
  description: '一名可以挂载装备与特效的冰原守卫。',
  seed: 'component-graph-root-seed',
  target_platforms: ['desktop', 'web']
});

function componentGraphInput(order = 'forward') {
  const components = [
    {
      component_id: 'body',
      role: 'primary-body',
      asset_profile: 'character',
      asset_kind: 'character-3d',
      description: '冰原守卫身体网格。',
      seed: 'component-graph-body-seed',
      representation_kind: 'mesh',
      representation_profile: 'skinned-pbr',
      transform_mm: [0, 0, 0]
    },
    {
      component_id: 'armor',
      role: 'ice-plate-armor',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      description: '冰纹重甲组件。',
      seed: 'component-graph-armor-seed',
      representation_kind: 'mesh',
      representation_profile: 'rigid-pbr',
      depends_on: ['body'],
      attach_to: 'body',
      source_root: root('b'),
      transform_mm: [0, 840, 0],
      scale_milli: [980, 980, 980],
      variant: 2
    },
    {
      component_id: 'weapon',
      role: 'right-hand-frost-blade',
      asset_profile: 'prop',
      asset_kind: 'prop-3d',
      description: '可挂载到右手的冰刃。',
      seed: 'component-graph-weapon-seed',
      representation_kind: 'mesh',
      representation_profile: 'rigid-pbr',
      depends_on: ['body'],
      attach_to: 'body',
      transform_mm: [420, 940, 40],
      rotation_deg: [0, 15, 0]
    },
    {
      component_id: 'sparks',
      role: 'weapon-impact-vfx',
      asset_profile: 'vfx',
      asset_kind: 'vfx-3d',
      description: '冰刃命中时的粒子特效。',
      seed: 'component-graph-sparks-seed',
      representation_kind: 'particle',
      representation_profile: 'impact-burst',
      depends_on: ['weapon'],
      transform_mm: [0, 1280, 0]
    }
  ];
  return {
    genome: rootGenome,
    composition_id: 'component-graph:guardian-loadout',
    name: '冰原守卫可组合资产',
    description: '角色、装备与命中特效的跨资产族候选组合。',
    source_reality_root: root('a'),
    components: order === 'reverse' ? components.reverse() : components
  };
}

test('URRF component graph composes mixed asset families and lowers in dependency order', () => {
  const graph = createUniversalArtAssetComponentGraph(componentGraphInput());
  assert.equal(graph.format, UNIVERSAL_ART_ASSET_COMPONENT_GRAPH_FORMAT);
  assert.deepEqual(graph.components.map(component => component.component_id), ['armor', 'body', 'sparks', 'weapon']);
  assert.deepEqual(graph.topological_order, ['body', 'armor', 'weapon', 'sparks']);
  assert.equal(graph.component_count, 4);
  assert.equal(graph.dependency_edge_count, 3);
  assert.deepEqual(graph.axes.component_profiles, ['character', 'prop', 'vfx']);
  assert.deepEqual(graph.axes.representation_kinds, ['mesh', 'particle']);
  assert.equal(graph.candidate_only, true);
  assert.equal(graph.authoritative, false);
  assert.equal(verifyUniversalArtAssetComponentGraph(graph, {genome: rootGenome}).valid, true);

  const lowering = lowerUniversalArtAssetComponentGraph(graph);
  assert.equal(lowering.format, UNIVERSAL_ART_ASSET_COMPONENT_LOWERING_FORMAT);
  assert.equal(lowering.execution_status, 'NOT_EXECUTED');
  assert.deepEqual(lowering.nodes.map(node => node.component_id), graph.topological_order);
  assert.equal(lowering.nodes[1].transform.translation[1], 0.84);
  assert.equal(lowering.nodes[3].provider_input.representation_kind, 'particle');
  const bodyRoot = graph.components.find(component => component.component_id === 'body').genome_root;
  assert.equal(lowering.component_root_index[bodyRoot].includes('body'), true);
  assert.equal(verifyUniversalArtAssetComponentLowering(lowering, {graph}).valid, true);
});

test('URRF component graph roots are invariant to input order and the schema validates the candidate envelope', () => {
  const first = createUniversalArtAssetComponentGraph(componentGraphInput('forward'));
  const second = createUniversalArtAssetComponentGraph(componentGraphInput('reverse'));
  assert.deepEqual(second, first);

  const schema = JSON.parse(fs.readFileSync(new URL('../schemas/universal-art-asset-component-graph.v0.1.schema.json', import.meta.url), 'utf8'));
  const ajv = new Ajv2020({strict: false, allErrors: true});
  const validate = ajv.compile(schema);
  assert.equal(validate(first), true, JSON.stringify(validate.errors));
  const escalated = structuredClone(first);
  escalated.candidate_only = false;
  assert.equal(validate(escalated), false);
});

test('URRF component graph rejects unknown dependencies, cycles, and authority escalation', () => {
  assert.throws(() => createUniversalArtAssetComponentGraph({
    genome: rootGenome,
    composition_id: 'component-graph:unknown-dependency',
    components: [{component_id: 'body', role: 'body', depends_on: ['missing'], asset_profile: 'character', asset_kind: 'character-3d', seed: 'unknown-dependency'}]
  }), /UNIVERSAL_ART_ASSET_COMPONENT_DEPENDENCY_UNKNOWN/);

  assert.throws(() => createUniversalArtAssetComponentGraph({
    genome: rootGenome,
    composition_id: 'component-graph:cycle',
    components: [
      {component_id: 'a', role: 'a', depends_on: ['b'], asset_profile: 'prop', asset_kind: 'prop-3d', seed: 'cycle-a'},
      {component_id: 'b', role: 'b', depends_on: ['a'], asset_profile: 'prop', asset_kind: 'prop-3d', seed: 'cycle-b'}
    ]
  }), /UNIVERSAL_ART_ASSET_COMPONENT_DEPENDENCY_CYCLE/);

  assert.throws(() => createUniversalArtAssetComponentGraph({
    genome: rootGenome,
    composition_id: 'component-graph:authority',
    components: [{component_id: 'body', role: 'body', asset_profile: 'character', asset_kind: 'character-3d', seed: 'authority', authoritative: true}]
  }), /UNIVERSAL_ART_ASSET_COMPONENT_AUTHORITY_ESCALATION/);

  const graph = createUniversalArtAssetComponentGraph(componentGraphInput());
  const tampered = structuredClone(graph);
  tampered.components[0].depends_on = ['body', 'weapon'];
  assert.equal(verifyUniversalArtAssetComponentGraph(tampered).valid, false);
  const lowering = lowerUniversalArtAssetComponentGraph(graph);
  const tamperedLowering = structuredClone(lowering);
  tamperedLowering.nodes[0].provider_input.execution_status = 'COMPLETED';
  assert.equal(verifyUniversalArtAssetComponentLowering(tamperedLowering).valid, false);
});

test('URRF component graph executor reuses the Provider Pipeline and chains dependency roots', async () => {
  const specs = componentGraphInput().components;
  const componentGenomes = Object.fromEntries(specs.map(spec => [spec.component_id, createUniversalArtAssetGenome({
    asset_profile: spec.asset_profile,
    asset_kind: spec.asset_kind,
    quality_tier: 'AAA',
    description: spec.description,
    seed: spec.seed
  })]));
  const graph = createUniversalArtAssetComponentGraph({
    ...componentGraphInput(),
    components: specs.map(spec => ({...spec, genome: componentGenomes[spec.component_id]}))
  });
  const outputRoles = ['mesh-glb', 'pbr-texture-pack', 'rig-candidate', 'animation-clips'];
  const manifest = createAssetProviderManifest({
    id: 'provider:test:component-graph-executor',
    name: 'Component Graph Executor Fixture',
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
    upstream: {url: 'https://taowind.company', revision: 'component-graph-executor-test'},
    metadata: {quality_tier: 'PRODUCTION', component_graph_fixture: true}
  });
  const observedContexts = [];
  const provider = new AssetProviderAdapter(manifest, {
    runner: ({operation, input}) => {
      observedContexts.push({operation, context: input.component_context});
      return {
        asset_id: input.asset_id,
        format: 'component-graph-provider-output',
        outputs: outputRoles,
        files: outputRoles.map(role => ({
          name: `${operation}/${role}.json`,
          path: `${operation}/${role}.json`,
          role,
          format: 'application/json',
          mime: 'application/json',
          base64: Buffer.from(`${input.asset_id}:${input.component_context?.component_id}:${role}`).toString('base64')
        })),
        generator_version: 'component-graph-provider-fixture',
        seed: input.seed,
        evidence: {provider_success: true}
      };
    }
  });
  const providerByComponent = Object.fromEntries(graph.components.map(component => [component.component_id, provider]));
  const outDir = fs.mkdtempSync(path.join(os.tmpdir(), 'urrf-component-graph-execution-'));
  const run = executeUniversalArtAssetComponentGraph({
    graph,
    componentGenomes,
    providersByComponent: providerByComponent,
    outDir
  });
  assert.equal(run.status, 'CANDIDATE_COMPONENT_GRAPH_EXECUTED');
  assert.equal(run.execution.status, 'CANDIDATE_COMPONENT_GRAPH_EXECUTED');
  assert.deepEqual(run.components.map(component => component.status), ['COMPLETED', 'COMPLETED', 'COMPLETED', 'COMPLETED']);
  assert.equal(run.execution.summary.completed_count, 4);
  assert.equal(verifyUniversalArtAssetComponentExecution(run.execution, {
    graph,
    componentExecutions: run.componentExecutions
  }).valid, true);
  const executionSchema = JSON.parse(fs.readFileSync(new URL('../schemas/universal-art-asset-component-execution.v0.1.schema.json', import.meta.url), 'utf8'));
  const executionValidate = new Ajv2020({strict: false, allErrors: true}).compile(executionSchema);
  assert.equal(executionValidate(run.execution), true, JSON.stringify(executionValidate.errors));
  const pipelineSchema = JSON.parse(fs.readFileSync(new URL('../schemas/universal-art-asset-provider-pipeline-execution.v0.1.schema.json', import.meta.url), 'utf8'));
  const pipelineValidate = new Ajv2020({strict: false, allErrors: true}).compile(pipelineSchema);
  for (const detail of run.componentExecutions) {
    if (detail.execution) assert.equal(pipelineValidate(detail.execution), true, JSON.stringify(pipelineValidate.errors));
  }
  assert.equal(observedContexts.length, 5, 'character has two pipeline stages; the other three components have one each');
  const armorContext = observedContexts.find(entry => entry.context?.component_id === 'armor').context;
  assert.equal(armorContext.component_graph_root, graph.component_graph_root);
  assert.equal(armorContext.dependency_bindings[0].component_id, 'body');
  assert.equal(armorContext.dependency_bindings[0].status, 'COMPLETED');
  assert.match(armorContext.dependency_bindings[0].result_root, /^[a-f0-9]{64}$/);
  assert.equal(fs.existsSync(path.join(outDir, 'universal-art-asset-component-graph-execution.json')), true);
  assert.equal(fs.existsSync(path.join(outDir, '001-body', 'universal-art-asset-provider-pipeline-artifact.json')), true);

  const assembly = createUniversalArtAssetComponentAssembly({
    graph,
    execution: run.execution,
    componentExecutions: run.componentExecutions,
    scene_id: 'scene:component-graph-guardian',
    world_id: 'world:component-graph-guardian'
  });
  assert.equal(assembly.format, UNIVERSAL_ART_ASSET_COMPONENT_ASSEMBLY_FORMAT);
  assert.equal(assembly.status, 'CANDIDATE_COMPONENT_ASSEMBLY_READY');
  assert.equal(assembly.component_count, 4);
  assert.equal(assembly.resource_count, 20);
  assert.equal(assembly.summary.bound_component_count, 4);
  assert.equal(assembly.checks.resource_file_integrity, true);
  assert.equal(assembly.components.find(component => component.component_id === 'armor').transform.translation_mm[1], 840);
  assert.equal(assembly.components.find(component => component.component_id === 'armor').parent_component_id, 'body');
  const assemblyVerification = verifyUniversalArtAssetComponentAssembly(assembly, {
    graph,
    execution: run.execution,
    componentExecutions: run.componentExecutions
  });
  assert.equal(assemblyVerification.valid, true);
  const assemblySchema = JSON.parse(fs.readFileSync(new URL('../schemas/universal-art-asset-component-assembly.v0.1.schema.json', import.meta.url), 'utf8'));
  const assemblyValidate = new Ajv2020({strict: false, allErrors: true}).compile(assemblySchema);
  assert.equal(assemblyValidate(assembly), true, JSON.stringify(assemblyValidate.errors));
  const directory = lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory({assembly});
  assert.equal(directory.format, UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_DIRECTORY_FORMAT);
  assert.equal(directory.status, 'CANDIDATE_REPRESENTATION_DIRECTORY_READY');
  assert.equal(directory.representation_count, 4);
  assert.equal(directory.representation_refs.length, 4);
  assert.equal(directory.resource_count, 20);
  assert.deepEqual(directory.representations.map(entry => entry.representation_kind), ['mesh', 'mesh', 'mesh', 'particle']);
  assert.equal(directory.representations.find(entry => entry.component_id === 'sparks').consumer_mapping.vsr.catalog_kind, 'other');
  assert.deepEqual(directory.representations.find(entry => entry.component_id === 'body').consumer_mapping.vsr.catalog_kinds, ['animation', 'material', 'mesh', 'other']);
  assert.equal(directory.vsr_catalog.assets.find(asset => asset.metadata.role === 'pbr-texture-pack').kind, 'material');
  assert.equal(directory.vsr_catalog.assets.find(asset => asset.metadata.role === 'animation-clips').kind, 'animation');
  assert.equal(directory.vsr_catalog.assets.find(asset => asset.metadata.role === 'mesh-glb').kind, 'mesh');
  assert.equal(directory.representations.find(entry => entry.component_id === 'sparks').consumer_mapping.rsr.observation_input_status, 'INPUT_READY');
  assert.equal(directory.vsr_catalog.assets.every(asset => asset.metadata.representation_kind === (asset.metadata.component_id === 'sparks' ? 'particle' : 'mesh')), true);
  assert.equal(directory.vsr_catalog.assets.every(asset => asset.metadata.import_status === 'NOT_EXECUTED'), true);
  assert.equal(directory.rsr_observation_inputs.every(input => input.execution_status === 'NOT_EXECUTED' && input.reconstruction_candidate === null), true);
  const directoryVerification = verifyUniversalArtAssetComponentRepresentationDirectory(directory, {assembly});
  assert.equal(directoryVerification.valid, true, JSON.stringify(directoryVerification.errors));
  const directorySchema = JSON.parse(fs.readFileSync(new URL('../schemas/universal-art-asset-component-representation-directory.v0.1.schema.json', import.meta.url), 'utf8'));
  const directoryValidate = new Ajv2020({strict: false, allErrors: true}).compile(directorySchema);
  assert.equal(directoryValidate(directory), true, JSON.stringify(directoryValidate.errors));
  const meshImporter = {
    handler_id: 'test.deferred-gltf-import',
    compile: async () => ({status: 'NOT_RUN', reason: 'fixture intentionally emits JSON markers instead of GLB bytes'}),
    verify: async () => true
  };
  const importerRegistry = createUniversalArtAssetComponentRepresentationImportRegistry({importers: {mesh: meshImporter}});
  assert.equal(importerRegistry.format, UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_IMPORT_REGISTRY_FORMAT);
  assert.equal(verifyUniversalArtAssetComponentRepresentationImportRegistry(importerRegistry).valid, true);
  const importExecution = await executeUniversalArtAssetComponentRepresentationImport({
    directory,
    assembly,
    loadAsset: asset => fs.readFileSync(path.resolve(asset.metadata.output_directory, asset.metadata.relative_path)),
    importerRegistry
  });
  assert.equal(importExecution.format, UNIVERSAL_ART_ASSET_COMPONENT_REPRESENTATION_IMPORT_FORMAT);
  assert.equal(importExecution.importer_registry_root, importerRegistry.registry_root);
  assert.equal(importExecution.status, 'CANDIDATE_COMPONENT_REPRESENTATION_IMPORT_NOT_RUN');
  assert.equal(importExecution.summary.not_run_count, 4);
  assert.equal(verifyUniversalArtAssetComponentRepresentationImport(importExecution, {directory, importerRegistry}).valid, true);
  const importSchema = JSON.parse(fs.readFileSync(new URL('../schemas/universal-art-asset-component-representation-import-execution.v0.1.schema.json', import.meta.url), 'utf8'));
  const importValidate = new Ajv2020({strict: false, allErrors: true}).compile(importSchema);
  assert.equal(importValidate(importExecution), true, JSON.stringify(importValidate.errors));
  const registrySchema = JSON.parse(fs.readFileSync(new URL('../schemas/universal-art-asset-component-representation-import-registry.v0.1.schema.json', import.meta.url), 'utf8'));
  const registryValidate = new Ajv2020({strict: false, allErrors: true}).compile(registrySchema);
  assert.equal(registryValidate(structuredClone(importerRegistry)), true, JSON.stringify(registryValidate.errors));
  const tamperedRegistry = structuredClone(importerRegistry);
  tamperedRegistry.entries[0].handler_id = 'test.tampered-handler';
  assert.equal(verifyUniversalArtAssetComponentRepresentationImportRegistry(tamperedRegistry).valid, false);
  assert.throws(() => createUniversalArtAssetComponentRepresentationImportRegistry({importers: {
    mesh: meshImporter,
    rig: {...meshImporter, representation_kind: 'rig'}
  }}), /HANDLER_ID_DUPLICATE/);
  const tamperedDirectory = structuredClone(directory);
  tamperedDirectory.vsr_catalog.assets[0].metadata.representation_kind = 'mesh';
  tamperedDirectory.vsr_catalog.assets[0].metadata.representation_root = root('f');
  assert.equal(verifyUniversalArtAssetComponentRepresentationDirectory(tamperedDirectory, {assembly}).valid, false);
  const tamperedAssembly = structuredClone(assembly);
  tamperedAssembly.resources[0].sha256 = root('f');
  assert.equal(verifyUniversalArtAssetComponentAssembly(tamperedAssembly, {graph, execution: run.execution}).valid, false);
  const firstResource = assembly.resources[0];
  fs.writeFileSync(path.join(firstResource.output_directory, firstResource.path), 'tampered-component-resource', 'utf8');
  assert.equal(verifyUniversalArtAssetComponentAssembly(assembly, {graph, execution: run.execution}).valid, false);
});

test('URRF component graph executor blocks missing Provider/runtime inputs and propagates the dependency boundary', () => {
  const baseGenome = createUniversalArtAssetGenome({
    asset_profile: 'prop',
    asset_kind: 'prop-3d',
    quality_tier: 'AAA',
    description: '缺少 Provider 的基础资产。',
    seed: 'component-graph-blocked-base'
  });
  const addonGenome = createUniversalArtAssetGenome({
    asset_profile: 'prop',
    asset_kind: 'prop-3d',
    quality_tier: 'AAA',
    description: '依赖基础资产的附加组件。',
    seed: 'component-graph-blocked-addon'
  });
  const graph = createUniversalArtAssetComponentGraph({
    genome: rootGenome,
    composition_id: 'component-graph:blocked-runtime',
    components: [
      {component_id: 'base', role: 'base', genome: baseGenome},
      {component_id: 'addon', role: 'addon', genome: addonGenome, depends_on: ['base']}
    ]
  });
  const run = executeUniversalArtAssetComponentGraph({
    graph,
    componentGenomes: {base: baseGenome, addon: addonGenome}
  });
  assert.equal(run.status, 'CANDIDATE_COMPONENT_GRAPH_BLOCKED');
  assert.deepEqual(run.components.map(component => component.status), ['NOT_RUN', 'BLOCKED']);
  assert.equal(run.components[0].execution_attempted, false);
  assert.equal(run.components[1].failure_code, 'COMPONENT_DEPENDENCY_NOT_COMPLETED');
  assert.equal(run.execution.execution_attempted, false);
  assert.equal(verifyUniversalArtAssetComponentExecution(run.execution, {
    graph,
    componentExecutions: run.componentExecutions
  }).valid, true);
  const assembly = createUniversalArtAssetComponentAssembly({
    graph,
    execution: run.execution,
    componentExecutions: run.componentExecutions,
    verifyFiles: true
  });
  assert.equal(assembly.status, 'CANDIDATE_COMPONENT_ASSEMBLY_BLOCKED');
  assert.equal(assembly.resource_count, 0);
  assert.equal(assembly.summary.not_run_count, 1);
  assert.equal(verifyUniversalArtAssetComponentAssembly(assembly, {
    graph,
    execution: run.execution,
    componentExecutions: run.componentExecutions
  }).valid, true);
  const directory = lowerUniversalArtAssetComponentAssemblyToRepresentationDirectory({assembly});
  assert.equal(directory.status, 'CANDIDATE_REPRESENTATION_DIRECTORY_BLOCKED');
  assert.equal(directory.representation_refs.length, 0);
  assert.equal(directory.rsr_observation_inputs.every(input => input.status === 'BLOCKED' && input.execution_status === 'NOT_EXECUTED'), true);
  assert.equal(verifyUniversalArtAssetComponentRepresentationDirectory(directory, {assembly}).valid, true);
});
