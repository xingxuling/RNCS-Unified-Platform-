import test from 'node:test';
import assert from 'node:assert/strict';
import {
  NETWORK_WORLD_COMPILATION_FORMAT,
  compileNetworkWorld,
  renderNetworkAssetViewport,
  validateNetworkAuthoring,
  verifyNetworkWorldCompilation,
} from '../src/network-world-compiler.mjs';
import { createStudioNetworkWorld } from '../../../examples/studio-authored-network-world-v03/project.mjs';

test('Studio compiles authored scene, physics, assets and player slots into one verified network world', () => {
  const { session, compilation } = createStudioNetworkWorld();
  const repeated = createStudioNetworkWorld();
  assert.equal(compilation.format, NETWORK_WORLD_COMPILATION_FORMAT);
  assert.equal(verifyNetworkWorldCompilation(compilation).valid, true);
  assert.equal(compilation.counts.player_slots, 2);
  assert.equal(compilation.counts.asset_bindings, 2);
  assert.equal(compilation.world_config.reality.realityRoot, session.project.project_root);
  assert.equal(session.networkCompile().compilation_root, compilation.compilation_root);
  assert.equal(repeated.session.project.project_root, session.project.project_root);
  assert.equal(repeated.compilation.compilation_root, compilation.compilation_root);
});

test('Studio export publishes the verified network compilation as a build artifact', () => {
  const { session, compilation } = createStudioNetworkWorld();
  const artifacts = session.exportArtifacts();
  assert.equal(artifacts.network_world_compilation.compilation_root, compilation.compilation_root);
  assert.ok(artifacts.build_plan.files.includes('network-world-compilation.json'));
  assert.ok(artifacts.gateway_manifest.capabilities.includes('network.world.compile'));
  assert.equal(artifacts.build_plan.network.player_slots, 2);
});

test('authoring rejects a scene node that no longer binds its compiled body', () => {
  const { session, nodeIds } = createStudioNetworkWorld();
  const project = structuredClone(session.project);
  const node = project.scenes[0].nodes.find(item => item.node_id === nodeIds.blue);
  node.components.spatial_body_id = 'body:forged';
  const validation = validateNetworkAuthoring(project, project.network);
  assert.equal(validation.valid, false);
  assert.ok(validation.errors.some(error => error.code === 'NETWORK_SLOT_NODE_BODY_MISMATCH'));
});

test('compilation verification rejects a post-compile world mutation', () => {
  const { compilation } = createStudioNetworkWorld();
  const tampered = structuredClone(compilation);
  tampered.world_config.bodies.find(body => body.id === 'studio-player-blue').position.x += 1;
  const verification = verifyNetworkWorldCompilation(tampered);
  assert.equal(verification.valid, false);
  assert.ok(verification.errors.includes('NETWORK_COMPILATION_ROOT_MISMATCH'));
  assert.ok(verification.errors.includes('NETWORK_WORLD_CONFIG_ROOT_MISMATCH'));
});

test('the network viewport renders authored GLB meshes on authoritative bodies', async () => {
  const { session, compilation } = createStudioNetworkWorld();
  const viewport = await renderNetworkAssetViewport({
    project: session.project,
    compilation,
    snapshot: session.spatial.lastSnapshot,
    width: 320,
    height: 180,
  });
  assert.equal(viewport.imported_asset_count, 2);
  assert.ok(viewport.asset_draw_count >= 2);
  assert.equal(viewport.frame_verified, true);
  assert.ok(viewport.png.length > 100);
  assert.equal(viewport.compilation_root, compilation.compilation_root);
});

test('a Studio body edit changes both project and compiled authoritative world roots', () => {
  const { session, compilation: before } = createStudioNetworkWorld();
  session.spatialPatchBody('studio-player-blue', { position: { x: -4200, y: 1100, z: -1200 } });
  const after = compileNetworkWorld(session.project);
  assert.notEqual(after.project_root, before.project_root);
  assert.notEqual(after.world_config_root, before.world_config_root);
  assert.notEqual(after.compilation_root, before.compilation_root);
  assert.equal(after.world_config.bodies.find(body => body.id === 'studio-player-blue').position.x, -4200);
  assert.equal(compileNetworkWorld(session.project).compilation_root, after.compilation_root);
});
