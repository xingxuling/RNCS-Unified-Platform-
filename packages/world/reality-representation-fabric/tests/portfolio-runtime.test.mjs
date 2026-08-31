import assert from 'node:assert/strict';
import test from 'node:test';
import {createRepresentationPortfolio, createRepresentationSlot, rootHash} from '@taowind/rncs-core-contract';
import {
  RealityRepresentationPortfolioRuntime,
  verifyPortfolioRuntimeSnapshot,
  verifyVisualEvidence
} from '../src/index.mjs';

const root = letter => letter.repeat(64);
const slot = (id, kind, quality, required = false, extra = {}) => createRepresentationSlot({
  slot_id: id,
  representation_id: `representation:${id}`,
  representation_root: rootHash({representation: id}),
  representation_kind: kind,
  quality_profile: quality,
  required_for_minimum: required,
  diversity_axes: {STYLE: extra.style ?? 'REALISTIC', LIGHTING: extra.lighting ?? 'DAYLIGHT', ...extra.axes},
  resource_costs: {GPU_MILLI: extra.gpu ?? 100, VRAM_MB: extra.vram ?? 100},
  render_profile: {renderer_id: 'vsr-spatial-reference', shading_model: 'pbr', lighting_profile: extra.lighting ?? 'DAYLIGHT', camera_profile: 'HERO', resolution_class: quality.toLowerCase()}
});

function portfolio() {
  return createRepresentationPortfolio({
    portfolio_id: 'portfolio:runtime',
    object_id: 'reality-object:runtime',
    canonical_state_root: root('a'),
    slots: [
      slot('slot:proxy', 'world-proxy', 'PROXY', true, {style: 'ABSTRACT', gpu: 10, vram: 10}),
      slot('slot:mesh', 'mesh', 'STANDARD', false, {style: 'REALISTIC', gpu: 200, vram: 250}),
      slot('slot:splats', 'gaussian-splats', 'CINEMATIC', false, {style: 'REALISTIC', lighting: 'GOLDEN-HOUR', gpu: 500, vram: 600})
    ],
    composition: {mode: 'DIVERSE', min_slots: 2, max_slots: 4, required_kinds: ['world-proxy', 'mesh'], quality_ladder: ['PROXY', 'STANDARD', 'CINEMATIC'], diversity_targets: {MODALITY: 2, STYLE: 2, LIGHTING: 2}}
  });
}

test('selects the highest admissible visual slot while retaining deterministic fallback', () => {
  const runtime = new RealityRepresentationPortfolioRuntime({portfolios: [portfolio()]});
  const selected = runtime.selectSlot({portfolio_id: 'portfolio:runtime', quality_profile: 'CINEMATIC', diversity: {LIGHTING: 'GOLDEN-HOUR'}, resource_budget: {GPU: 600, VRAM: 700}});
  assert.equal(selected.selected_slot_id, 'slot:splats');
  assert.equal(selected.fallback_used, false);
  const constrained = runtime.selectSlot({portfolio_id: 'portfolio:runtime', quality_profile: 'CINEMATIC', resource_budget: {GPU: 5, VRAM: 5}});
  assert.equal(constrained.selected_slot_id, 'slot:proxy');
  assert.equal(constrained.fallback_used, true);
  assert.equal(constrained.reason_codes.includes('MINIMUM_REALITY_FALLBACK'), true);
  assert.equal(runtime.verify().valid, true);
});

test('records actual render roots separately from subjective quality claims', () => {
  const runtime = new RealityRepresentationPortfolioRuntime({portfolios: [portfolio()]});
  const evidence = runtime.recordVisualEvidence({
    portfolio_id: 'portfolio:runtime',
    slot_id: 'slot:mesh',
    evidence_id: 'visual:runtime:mesh:01',
    status: 'LOCAL_RENDERED',
    quality_status: 'OBSERVED_NOT_GRADED',
    width: 640,
    height: 360,
    png_bytes: 2048,
    triangles: 12,
    draw_calls: 3,
    pixel_root: root('b'),
    frame_root: root('c'),
    environment_root: root('d'),
    animation_root: root('e')
  });
  assert.equal(verifyVisualEvidence(evidence).valid, true);
  assert.equal(evidence.environment_root, root('d'));
  assert.equal(evidence.animation_root, root('e'));
  assert.equal(runtime.listVisualEvidence('portfolio:runtime', 'slot:mesh').length, 1);
  const snapshot = runtime.snapshot();
  assert.equal(verifyPortfolioRuntimeSnapshot(snapshot), true);
  assert.equal(runtime.verify().valid, true);
  const tampered = structuredClone(snapshot);
  tampered.visual_evidence[0].width = 1;
  assert.equal(verifyPortfolioRuntimeSnapshot(tampered), false);
});

test('materializes through the existing URRF fabric without granting canonical authority', async () => {
  const calls = [];
  const runtime = new RealityRepresentationPortfolioRuntime({
    fabric: {materialize: async input => { calls.push(input); return {status: 'EXECUTED', receipt_root: root('d')}; }},
    portfolios: [portfolio()]
  });
  const result = await runtime.materializeSlot({portfolio_id: 'portfolio:runtime', quality_profile: 'STANDARD'});
  assert.equal(result.status, 'EXECUTED');
  assert.equal(result.slot_id, 'slot:mesh');
  assert.equal(calls[0].object_id, 'reality-object:runtime');
  assert.equal(calls[0].representation_id, 'representation:slot:mesh');
  assert.equal(result.canonical_write_authorized, false);
});
