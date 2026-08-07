import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {buildSurfaceAttachmentSet,validateSurfaceAttachmentSet} from '../src/surface-attachments.mjs';

test('face, scalp, hair, and garment attachments are surface contracts',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,attachments=buildSurfaceAttachmentSet(asset),report=validateSurfaceAttachmentSet(attachments,{asset});
  assert.ok(attachments.attachment_root);
  assert.equal(attachments.face.length,10);
  assert.ok(attachments.face.every(item=>item.surface_id==='skull-surface'));
  assert.ok(attachments.face.every(item=>item.triangle_or_patch.type==='parametric_patch'));
  assert.equal(attachments.scalp.length,7);
  assert.equal(attachments.hair_guides.length,3);
  assert.equal(attachments.garment.length,3);
  assert.equal(report.valid,true,report.errors.join(','));
});

test('face features stay inside the skull surface before normal offset',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,attachments=buildSurfaceAttachmentSet(asset);
  assert.ok(attachments.face.every(item=>item.containment_measurement.normalized_ellipsoid_value<=1.001));
  assert.ok(attachments.face.every(item=>item.normal_offset>=0));
});

test('attachment validation rejects penetration or disconnected hair guides',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,attachments=buildSurfaceAttachmentSet(asset),invalid={...attachments,garment:attachments.garment.map(item=>({...item,clearance_measurement:{...item.clearance_measurement,penetration_depth:.01}})),hair_guides:attachments.hair_guides.map(mass=>({...mass,guide_curves:mass.guide_curves.map(curve=>({...curve,connected:false}))}))};
  const report=validateSurfaceAttachmentSet(invalid,{asset});
  assert.equal(report.valid,false);
  assert.ok(report.errors.includes('GARMENT_ATTACHMENT_INVALID'));
  assert.ok(report.errors.includes('HAIR_GUIDE_DISCONNECTED'));
});
