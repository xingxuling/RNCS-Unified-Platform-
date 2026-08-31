import assert from 'node:assert/strict';
import test from 'node:test';
import {createRepresentationRef} from '@taowind/rncs-core-contract';
import {RealityRepresentationFabric, URRF_CAUSAL_PHYSICAL_PROFILE_FORMAT, verifyFabricSnapshot} from '../src/index.mjs';

const root = letter => letter.repeat(64);

test('registers an RNCS CausalPhysicalProfile and preserves it as a URRF candidate', () => {
  const provider = {
    manifest: {
      id: 'provider:causal-physical:test',
      version: 'test',
      manifest_root: root('a'),
      runtimeStatus: 'AVAILABLE',
      capabilities: ['representation.visual.render'],
      authority: {owns_authoritative_world_state: false, scope: ['representation_candidate', 'visual_projection']},
      representation: {kinds: ['mesh'], profiles: [{profile_id: 'mesh.causal-physical.test', formats: ['model/gltf+json']}]}
    }
  };
  const reference = createRepresentationRef({
    representation_id: 'representation:causal-physical:test',
    provider_id: provider.manifest.id,
    provider_root: provider.manifest.manifest_root,
    representation_kind: 'mesh',
    representation_formats: ['model/gltf+json'],
    content_root: root('b'),
    representation_profile: {profile_id: 'mesh.causal-physical.test', formats: ['model/gltf+json']},
    authority_scope: ['representation_candidate', 'visual_projection'],
    availability: 'AVAILABLE'
  });
  const fabric = new RealityRepresentationFabric({providers: [provider]});
  const object = fabric.registerRealityObject({object_id: 'object:causal-physical:test', state_root: root('c'), representations: [reference]});
  const profile = fabric.createCausalPhysicalProfile({
    profile_id: 'profile:causal-physical:test',
    object_id: object.object_id,
    demand: {task: 'combat collision', interaction_probability: 90, risk: 80, observation: 75, authority: 80, event_intensity: 75}
  });
  assert.equal(profile.format, URRF_CAUSAL_PHYSICAL_PROFILE_FORMAT);
  assert.equal(profile.execution_status, 'READY');
  assert.equal(profile.execution.collision_mode, 'field');
  assert.equal(fabric.getCausalPhysicalProfile(profile.profile_id).profile_root, profile.profile_root);
  const snapshot = fabric.snapshot();
  assert.equal(verifyFabricSnapshot(snapshot), true);
  assert.equal(snapshot.causal_physical_profiles[0].profile_root, profile.profile_root);
  assert.equal(fabric.getRealityObject(object.object_id).state_root, root('c'));
});
