import assert from 'node:assert/strict';
import test from 'node:test';
import {
  createRepresentationPortfolio,
  createRepresentationSlot,
  rootHash,
  verifyRepresentationPortfolio,
  verifyRepresentationSlot
} from '../src/index.mjs';

const root = letter => letter.repeat(64);
const slot = (id, kind, quality, axes = {}) => createRepresentationSlot({
  slot_id: id,
  representation_id: `representation:${id}`,
  representation_root: rootHash({representation: id}),
  representation_kind: kind,
  quality_profile: quality,
  diversity_axes: axes,
  render_profile: {
    renderer_id: 'vsr-spatial-reference',
    shading_model: 'pbr',
    lighting_profile: axes.LIGHTING ?? 'DAYLIGHT',
    camera_profile: axes.VIEW ?? 'HERO',
    resolution_class: quality.toLowerCase(),
    width: quality === 'CINEMATIC' ? 1280 : 640,
    height: quality === 'CINEMATIC' ? 720 : 360
  }
});

test('seals a bounded portfolio with explicit count, quality ladder and diversity targets', () => {
  const slots = [
    slot('slot:proxy', 'world-proxy', 'PROXY', {STYLE: 'ABSTRACT', MATERIAL: 'FLAT', LIGHTING: 'DAYLIGHT'}),
    slot('slot:mesh', 'mesh', 'STANDARD', {STYLE: 'REALISTIC', MATERIAL: 'PBR', LIGHTING: 'DAYLIGHT'}),
    slot('slot:splats', 'gaussian-splats', 'CINEMATIC', {STYLE: 'REALISTIC', MATERIAL: 'VOLUMETRIC', LIGHTING: 'GOLDEN-HOUR'}),
    slot('slot:reference', 'mesh', 'REFERENCE', {STYLE: 'STYLIZED', MATERIAL: 'PBR', LIGHTING: 'NIGHT'})
  ];
  assert.equal(slots.every(value => verifyRepresentationSlot(value).valid), true);
  const portfolio = createRepresentationPortfolio({
    portfolio_id: 'portfolio:castle',
    object_id: 'reality-object:castle',
    canonical_state_root: root('a'),
    slots,
    active_slot_id: 'slot:mesh',
    composition: {
      mode: 'DIVERSE',
      min_slots: 3,
      max_slots: 6,
      required_kinds: ['world-proxy', 'mesh', 'gaussian-splats'],
      required_quality_profiles: ['PROXY', 'STANDARD', 'CINEMATIC'],
      quality_ladder: ['PROXY', 'STANDARD', 'CINEMATIC', 'REFERENCE'],
      diversity_targets: {MODALITY: 3, STYLE: 3, LIGHTING: 3, MATERIAL: 3}
    }
  });
  assert.deepEqual(portfolio.slots.map(value => value.slot_id), ['slot:mesh', 'slot:proxy', 'slot:reference', 'slot:splats']);
  assert.equal(portfolio.composition_result.composition_status, 'READY');
  assert.equal(portfolio.composition_result.count_satisfied, true);
  assert.equal(portfolio.composition_result.distinct_by_axis.STYLE, 3);
  assert.equal(verifyRepresentationPortfolio(portfolio).valid, true);
});

test('reports incomplete composition without silently inventing representations', () => {
  const portfolio = createRepresentationPortfolio({
    object_id: 'reality-object:single',
    canonical_state_root: root('b'),
    slots: [slot('slot:only', 'mesh', 'STANDARD', {STYLE: 'REALISTIC'})],
    composition: {
      mode: 'BALANCED',
      min_slots: 2,
      max_slots: 4,
      required_kinds: ['mesh', 'gaussian-splats'],
      required_quality_profiles: ['PROXY', 'STANDARD'],
      quality_ladder: ['PROXY', 'STANDARD'],
      diversity_targets: {STYLE: 2, MODALITY: 2}
    }
  });
  assert.equal(portfolio.composition_result.composition_status, 'INCOMPLETE');
  assert.deepEqual(portfolio.composition_result.missing_kinds, ['gaussian-splats']);
  assert.deepEqual(portfolio.composition_result.missing_quality_profiles, ['PROXY']);
  assert.equal(verifyRepresentationPortfolio(portfolio).valid, true);
  const tampered = structuredClone(portfolio);
  tampered.composition_result.slot_count = 99;
  assert.equal(verifyRepresentationPortfolio(tampered).valid, false);
});

test('keeps candidate and authority boundaries on every slot and portfolio root', () => {
  assert.throws(() => createRepresentationSlot({
    slot_id: 'slot:bad', representation_id: 'representation:bad', representation_root: root('c'), representation_kind: 'mesh', authoritative: true
  }), /RNCS_PORTFOLIO_SLOT_CANNOT_BE_AUTHORITATIVE/);
  const portfolio = createRepresentationPortfolio({object_id: 'reality-object:root', canonical_state_root: root('d'), slots: [slot('slot:root', 'mesh', 'PROXY')]});
  assert.equal(portfolio.authority.canonical_write_authorized, false);
  assert.equal(portfolio.authority.portfolio_may_write_authoritative_world_state, false);
  const body = structuredClone(portfolio);
  delete body.portfolio_root;
  assert.equal(rootHash(body), portfolio.portfolio_root);
});
