import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {buildMorphologyCertificateV2,REQUIRED_GATES,validateMorphologyCertificateV2} from '../src/morphology-certificate-v2.mjs';

test('v0.2 morphology certificate records measured evidence for every core gate',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,certificate=asset.certificate,validation=validateMorphologyCertificateV2(certificate);
  assert.equal(certificate.format,'rncs.morphology-certificate.v0.2');
  assert.equal(certificate.enforcement_scope,'canonical_asset');
  assert.equal(validation.valid,true,validation.failures.join(','));
  for(const name of REQUIRED_GATES){const item=certificate.gates[name];assert.ok(item,name);for(const key of ['measurement','allowed','method','evidence_root','pass'])assert.ok(Object.prototype.hasOwnProperty.call(item,key),`${name}:${key}`);assert.equal(typeof item.pass,'boolean',name);}
});

test('strict static certificate keeps view-island failures explicit',()=>{
  const asset=createAnatomySystem({seed:'phase6-3-strict-cert'}).canonical_morphology_asset,certificate=buildMorphologyCertificateV2(asset,{strict_static_views:true});
  assert.equal(certificate.enforcement_scope,'strict_static_views');
  const validation=validateMorphologyCertificateV2(certificate);
  assert.equal(validation.valid,true,validation.failures.join(','));
  assert.ok(certificate.gates.silhouette_connected.measurement.static_views.length>=2);
});

test('tampering a measured gate fails v0.2 validation',()=>{
  const asset=createAnatomySystem().canonical_morphology_asset,tampered={...asset.certificate,gates:{...asset.certificate.gates,self_intersection_valid:false}};
  const validation=validateMorphologyCertificateV2(tampered);
  assert.equal(validation.valid,false);
  assert.ok(validation.failures.includes('self_intersection_valid'));
});
