import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {boundedSubtraction,buildContinuousMorphologyField,evaluateMorphologyField,smoothIntersection,smoothUnion,validateMorphologyField} from '../src/morphology-field.mjs';

test('implicit field operators are deterministic and signed',()=>{
  assert.ok(smoothUnion(-.1,.1,.02)<0);
  assert.ok(smoothIntersection(.1,.2,.02)>0);
  assert.ok(boundedSubtraction(-.1,.1,.02)<0);
  assert.equal(smoothUnion(-.1,.2,.02),smoothUnion(-.1,.2,.02));
});

test('canonical volumes compile into a validated continuous morphology field',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,field=asset.continuous_morphology_field;
  assert.ok(field.field_root);
  assert.equal(field.fields.length,14);
  for(const descriptor of field.fields)for(const key of ['field_id','attached_bone','local_transform','shape_parameters','field_function','blend_group','material_region','semantic_region','identity_weight','deformation_policy'])assert.ok(descriptor[key]!==undefined,`${descriptor.field_id}:${key}`);
  assert.ok(field.fields.some(item=>item.field_id==='SkullField'));
  assert.ok(field.fields.some(item=>item.field_id==='NeckField'));
  assert.ok(field.fields.some(item=>item.field_id==='UpperArmField:left'));
  const report=validateMorphologyField(field);
  assert.equal(report.valid,true,report.errors.join(','));
  assert.equal(report.connected_components.length,1);
});

test('field evaluation returns semantic provenance at canonical anchors',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,field=asset.continuous_morphology_field,skull=field.fields.find(item=>item.field_id==='SkullField'),sample=evaluateMorphologyField(field,skull.rest_center);
  assert.ok(Number.isFinite(sample.distance));
  assert.ok(sample.field_id);
  assert.ok(sample.semantic_region);
});

test('field validation detects a detached or malformed field',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,field={...asset.continuous_morphology_field,fields:asset.continuous_morphology_field.fields.map((item,index)=>index===0?{...item,blend_group:null}:item)};
  const report=validateMorphologyField(field);
  assert.equal(report.valid,false);
  assert.ok(report.errors.includes('FIELD_ILLEGAL_OVERLAP_POLICY_MISSING'));
});
