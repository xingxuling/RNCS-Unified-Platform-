import assert from 'node:assert/strict';
import test from 'node:test';
import {createCharacterGenome} from '../../character-genome-runtime/src/index.mjs';
import {createAnatomySystem,validateAnatomySystem} from '../src/anatomy.mjs';
import {compileMorphology,validateMorphologyCertificate} from '../src/canonical-morphology.mjs';

test('Canonical Morphology Compiler is the only source of static body dimensions',()=>{
  const system=createAnatomySystem(),asset=system.canonical_morphology_asset;
  assert.equal(validateAnatomySystem(system).valid,true);
  assert.equal(asset.skeleton.bone_length_source,'Canonical Proportion Solver');
  assert.equal(asset.mesh_validation.valid,true);
  assert.ok(asset.canonical_surface_mesh.mesh_root);
  assert.equal(asset.attachment_validation.valid,true);
  assert.ok(asset.surface_attachments.attachment_root);
  assert.equal(asset.surface_templates.landmark_policy.source,'proportion-solver');
  assert.deepEqual(system.authority_flow,['Character Genome','Canonical Morphology Compiler','Kinematic Solver','Deformation Solver','Camera Projection','Style Projection','Raster Renderer']);
  assert.deepEqual(validateMorphologyCertificate(asset.certificate).failures,[]);
});

test('Genome changes produce different legal canonical geometry',()=>{
  const base=createAnatomySystem({seed:'canonical-base'}),variant=createAnatomySystem({seed:'canonical-variant',body_parameters:{'body.shoulder_width':.72,'body.head_body_ratio':.39,'body.neck_length':.68,'body.limb_ratio':.38,'body.torso_length':.66}});
  assert.notEqual(base.canonical_morphology_asset.morphology_root,variant.canonical_morphology_asset.morphology_root);
  assert.notEqual(base.canonical_morphology_asset.proportions.proportion_root,variant.canonical_morphology_asset.proportions.proportion_root);
  assert.equal(Object.values(variant.canonical_morphology_asset.certificate.gates).every(Boolean),true);
});

test('Certificate rejects a candidate when one core gate is false',()=>{
  const asset=compileMorphology(createCharacterGenome({seed:'certificate-negative'})),tampered={...asset.certificate,gates:{...asset.certificate.gates,self_intersection_valid:false}};
  const result=validateMorphologyCertificate(tampered);
  assert.equal(result.valid,false);assert.ok(result.failures.includes('self_intersection_valid'));
});
