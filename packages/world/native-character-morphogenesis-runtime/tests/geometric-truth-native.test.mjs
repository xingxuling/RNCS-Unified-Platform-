import assert from 'node:assert/strict';
import test from 'node:test';
import {createAnatomySystem} from '../src/anatomy.mjs';
import {compileMorphology} from '../src/canonical-morphology.mjs';
import {buildMorphologyCertificateV2} from '../src/morphology-certificate-v2.mjs';
import {buildNativeSurfaceFrame} from '../src/native-surface-runtime.mjs';
import {measureNativeGeometricTruth,validateGeometricTruthMeasurements,GEOMETRIC_TRUTH_METRICS} from '../src/geometric-truth.mjs';

test('native geometric truth report measures every Phase 6.3 metric and preserves RED evidence',()=>{
  const base=createAnatomySystem({seed:'phase6-3-native-measurement'}),asset=compileMorphology(base.genome,{surface_resolution:'validation',certificate_mode:'property'}),frames=['front','three-quarter-right','side'].map(view=>buildNativeSurfaceFrame({canonical_morphology_asset:asset},{view,pose:'neutral',frame:0,totalFrames:1,width:320,height:180})),certificate=buildMorphologyCertificateV2(asset,{views:['front','three-quarter-right','side'],strict_static_views:true,raster_width:320,raster_height:180}),report=measureNativeGeometricTruth({asset,frames,certificate}),validation=validateGeometricTruthMeasurements(report);
  assert.equal(validation.valid,true,validation.errors.join(','));
  assert.deepEqual(report.metrics.map(item=>item.metric),GEOMETRIC_TRUTH_METRICS);
  assert.ok(report.metrics.every(item=>item.evidence_root&&Object.prototype.hasOwnProperty.call(item,'measurement')));
  assert.ok(['green','red'].includes(report.status));
  assert.ok(report.status==='green'||report.red_metrics.length>0);
});
