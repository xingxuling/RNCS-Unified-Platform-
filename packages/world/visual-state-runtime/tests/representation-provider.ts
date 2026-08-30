import assert from 'node:assert/strict';
import {
  createSpark3DGSVisualBinding,
  inspectVisualRepresentationProvider,
  verifyVisualRepresentationBinding,
  type VSRRepresentationProviderManifest,
  type VSRRepresentationReference
} from '../packages/representation-provider/src/index.js';

const root = (char: string): string => char.repeat(64);

const sparkProvider = (): VSRRepresentationProviderManifest => ({
  id: 'provider:external:spark-2.1.0',
  version: '2.1.0',
  manifest_root: root('a'),
  runtimeStatus: 'CONTRACT_ONLY',
  capabilities: ['representation.visual.render', 'representation.visual.stream', 'representation.visual.paged-residency'],
  authority: { owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection', 'observation_candidate'] },
  representation: { kinds: ['gaussian-splats'], profiles: [{ profile_id: 'spark-rad-packed', formats: ['application/vnd.spark.rad'] }] }
});

const sparkReference = (): VSRRepresentationReference => ({
  format: 'rncs.representation-ref.v0.1',
  provider_id: 'provider:external:spark-2.1.0',
  provider_root: root('a'),
  representation_kind: 'gaussian-splats',
  representation_formats: ['application/vnd.spark.rad'],
  content_root: root('b'),
  representation_profile: { profile_id: 'spark-rad-packed', formats: ['application/vnd.spark.rad'] },
  detail_policy: { mode: 'hierarchical-lod', selectors: ['lod-tree'] },
  residency_policy: { mode: 'paged-lru', selectors: ['http-range'] },
  availability: 'CONTRACT_ONLY',
  authority_scope: ['representation_candidate', 'visual_projection', 'observation_candidate'],
  authority: { provider_may_write_authoritative_world_state: false, rncs_authority_required: true },
  candidate_only: true,
  authoritative: false,
  representation_root: root('c')
});

const tests: Array<{ name: string; fn: () => void }> = [];
const test = (name: string, fn: () => void): void => { tests.push({ name, fn }); };

test('Spark manifest is recognized as a visual-only representation provider', () => {
  const inspection = inspectVisualRepresentationProvider(sparkProvider());
  assert.equal(inspection.provider_id, 'provider:external:spark-2.1.0');
  assert.equal(inspection.runtime_status, 'CONTRACT_ONLY');
  assert.equal(inspection.authority.projection_only, true);
  assert.equal(inspection.authority.provider_can_write_authoritative_world_state, false);
  assert.ok(inspection.visual_capabilities.includes('representation.visual.render'));
});

test('Spark binding remains candidate-only and never invents runtime execution', () => {
  const binding = createSpark3DGSVisualBinding({ provider: sparkProvider(), reference: sparkReference() });
  assert.equal(binding.execution_status, 'NOT_EXECUTED');
  assert.equal(binding.reference.authoritative, false);
  assert.equal(binding.authority.rncs_authority_required, true);
  assert.equal(verifyVisualRepresentationBinding(binding), true);
});

test('VSR rejects authoritative representation references and provider authority escalation', () => {
  const authoritative = { ...sparkReference(), authoritative: true } as unknown as VSRRepresentationReference;
  assert.throws(() => createSpark3DGSVisualBinding({ provider: sparkProvider(), reference: authoritative }), /VSR_REPRESENTATION_REF_CANNOT_BE_AUTHORITATIVE/);
  const escalated = { ...sparkProvider(), authority: { ...sparkProvider().authority, owns_authoritative_world_state: true } } as unknown as VSRRepresentationProviderManifest;
  assert.throws(() => inspectVisualRepresentationProvider(escalated), /VSR_REPRESENTATION_PROVIDER_AUTHORITY_ESCALATION/);
});

test('VSR binding integrity detects a visual binding mutation', () => {
  const binding = createSpark3DGSVisualBinding({ provider: sparkProvider(), reference: sparkReference() });
  binding.projection.detail_policy = { mode: 'tampered' };
  assert.equal(verifyVisualRepresentationBinding(binding), false);
});

let passed = 0;
for (const entry of tests) {
  try { entry.fn(); passed++; console.log(`PASS ${entry.name}`); }
  catch (error) { console.error(`FAIL ${entry.name}`); throw error; }
}
console.log(`VSR representation provider tests: ${passed}/${tests.length} PASS`);
