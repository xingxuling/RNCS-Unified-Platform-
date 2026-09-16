import assert from 'node:assert/strict';
import test from 'node:test';
import {rootHash, verifyRepresentationRef} from '@taowind/rncs-core-contract';
import {RealityRepresentationFabric} from '../src/index.mjs';
import {
  URRF_2D_DVG_KIND,
  URRF_2D_PPD_KIND,
  createDvg2DProvider,
  createPpd2DProvider,
  createDvg2DRepresentationRef,
  createPpd2DRepresentationRef,
  createUrrf2DScene,
  materializeUrrf2DScene,
  planUrrf2DWorkingSet,
  verifyUrrf2DCompositionReceipt,
  verifyUrrf2DScene
} from '../src/two-dimensional-runtime.mjs';

const dvg = createDvg2DProvider({materialize: async ({plan, context}) => ({
  status: 'EXECUTED',
  output_root: rootHash({provider: 'dvg', plan: plan.plan_root, context: context.urrf2d}),
  evidence_root: rootHash({provider: 'dvg', evidence: true}),
  runtime: 'dvg-reference-2d'
})});
const ppd = createPpd2DProvider({materialize: async ({plan, context}) => ({
  status: 'EXECUTED',
  output_root: rootHash({provider: 'ppd', plan: plan.plan_root, context: context.urrf2d}),
  evidence_root: rootHash({provider: 'ppd', evidence: true}),
  runtime: 'ppd-reference-2d'
})});

function objectRefs(contentRoot) {
  return [
    createDvg2DRepresentationRef({content_root: contentRoot}, dvg),
    createPpd2DRepresentationRef({content_root: contentRoot}, ppd)
  ];
}

test('creates first-class DVG and PPD representation references under URRF authority', () => {
  const refs = objectRefs('a'.repeat(64));
  assert.equal(refs[0].representation_kind, URRF_2D_DVG_KIND);
  assert.equal(refs[1].representation_kind, URRF_2D_PPD_KIND);
  assert.equal(verifyRepresentationRef(refs[0]).valid, true);
  assert.equal(verifyRepresentationRef(refs[1]).valid, true);
  assert.equal(refs[0].authority.provider_may_write_authoritative_world_state, false);
  assert.equal(refs[1].authority.provider_may_write_authoritative_world_state, false);
});

test('plans viewport working set and defers offscreen reality objects', () => {
  const scene = createUrrf2DScene({
    scene_id: 'scene:test:working-set',
    canvas: [0, 0, 1000, 1000],
    objects: [
      {object_id: 'object:visible', bounds: [0, 0, 200, 200], z_index: 1, layers: [
        {id: 'structure', kind: URRF_2D_DVG_KIND},
        {id: 'atmosphere', kind: URRF_2D_PPD_KIND}
      ]},
      {object_id: 'object:deferred', bounds: [700, 700, 900, 900], z_index: 2, layers: [
        {id: 'structure', kind: URRF_2D_DVG_KIND}
      ]}
    ]
  });
  assert.equal(verifyUrrf2DScene(scene).valid, true);
  const plan = planUrrf2DWorkingSet(scene, {viewport: [0, 0, 300, 300], zoom: 2, resource_budget: {vector_nodes: 1000, points: 5000}});
  assert.deepEqual(plan.active_object_ids, ['object:visible']);
  assert.deepEqual(plan.deferred_object_ids, ['object:deferred']);
  assert.equal(plan.layers.length, 2);
  assert.equal(plan.layers.find(layer => layer.representation_kind === URRF_2D_DVG_KIND).resource_budget.vector_nodes, 1000);
  assert.equal(plan.layers.find(layer => layer.representation_kind === URRF_2D_PPD_KIND).resource_budget.points, 5000);
});

test('materializes DVG structure and PPD atmosphere as one candidate-only 2D composition', async () => {
  const fabric = new RealityRepresentationFabric({providers: [dvg, ppd]});
  const contentRoot = 'b'.repeat(64);
  fabric.registerRealityObject({object_id: 'object:hybrid-city', state_root: 'c'.repeat(64), representations: objectRefs(contentRoot)});
  const scene = createUrrf2DScene({
    scene_id: 'scene:test:hybrid', canvas: [0, 0, 1024, 1024], objects: [{
      object_id: 'object:hybrid-city', bounds: [100, 100, 900, 900], z_index: 10, semantic_priority: 2,
      layers: [
        {id: 'city-structure', kind: URRF_2D_DVG_KIND, blend_mode: 'normal', opacity: 1},
        {id: 'city-atmosphere', kind: URRF_2D_PPD_KIND, blend_mode: 'screen', opacity_ppm: 700000}
      ]
    }]
  });
  const receipt = await materializeUrrf2DScene(fabric, scene, {viewport: [0, 0, 1024, 1024], zoom_ppm: 1500000, resource_budget: {vector_nodes: 2400, points: 42000}});
  assert.equal(receipt.status, 'EXECUTED');
  assert.equal(receipt.layers.length, 2);
  assert.equal(receipt.layers.every(layer => layer.status === 'EXECUTED'), true);
  assert.equal(receipt.layers.some(layer => layer.representation_kind === URRF_2D_DVG_KIND), true);
  assert.equal(receipt.layers.some(layer => layer.representation_kind === URRF_2D_PPD_KIND), true);
  assert.equal(receipt.canonical_state_mutated, false);
  assert.equal(receipt.authority.provider_can_write_authoritative_world_state, false);
  assert.equal(receipt.authoritative, false);
  assert.equal(verifyUrrf2DCompositionReceipt(receipt).valid, true);
});

test('keeps partial materialization explicit when a 2D provider has no runtime adapter', async () => {
  const dvgContract = createDvg2DProvider({runtime_status: 'CONTRACT_ONLY'});
  const fabric = new RealityRepresentationFabric({providers: [dvgContract, ppd]});
  const contentRoot = 'd'.repeat(64);
  const dvgRef = createDvg2DRepresentationRef({content_root: contentRoot}, dvgContract);
  const ppdRef = createPpd2DRepresentationRef({content_root: contentRoot}, ppd);
  fabric.registerRealityObject({object_id: 'object:partial', state_root: 'e'.repeat(64), representations: [dvgRef, ppdRef]});
  const scene = createUrrf2DScene({scene_id: 'scene:test:partial', canvas: [0,0,10,10], objects: [{object_id:'object:partial', bounds:[0,0,10,10], layers:[{id:'structure', kind:URRF_2D_DVG_KIND},{id:'fog',kind:URRF_2D_PPD_KIND}]}]});
  const receipt = await materializeUrrf2DScene(fabric, scene, {resource_budget: {vector_nodes: 10, points: 100}});
  assert.equal(receipt.status, 'PARTIAL');
  assert.equal(receipt.layers.find(layer => layer.representation_kind === URRF_2D_DVG_KIND).status, 'NOT_EXECUTED');
  assert.equal(receipt.layers.find(layer => layer.representation_kind === URRF_2D_PPD_KIND).status, 'EXECUTED');
  assert.equal(verifyUrrf2DCompositionReceipt(receipt).valid, true);
});
