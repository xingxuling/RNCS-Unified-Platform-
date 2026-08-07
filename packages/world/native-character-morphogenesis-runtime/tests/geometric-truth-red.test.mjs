import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import test from 'node:test';
import {createAnatomySystem,poseForFrame} from '../src/anatomy.mjs';
import {projectFrameGeometry} from '../src/projection.mjs';
import {GEOMETRIC_TRUTH_METRICS,measureGeometricTruth,validateGeometricTruthMeasurements} from '../src/geometric-truth.mjs';

const packageRoot=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const repoRoot=path.resolve(packageRoot,'../../..');
const fixtureRoot=path.join(repoRoot,'evidence/anime-forge-phase6-2-canonical-morphology-v0.1/morphology-regression-fixture');
const fixture=JSON.parse(fs.readFileSync(path.join(fixtureRoot,'fixture.json'),'utf8'));

function oldKernelReport(){
  const system=createAnatomySystem(),pose=poseForFrame(system,{view:'three-quarter-right',pose:'neutral',frame:0,totalFrames:120});
  const projected=projectFrameGeometry(pose.geometry,{width:640,height:360,yaw:pose.view_yaw,pitch:0,scale:1});
  return measureGeometricTruth({asset:system.canonical_morphology_asset,pose,geometry:pose.geometry,projected,source_image:fixture.source_asset});
}

test('Phase 6.2 old contour output is measured RED before Phase 6.3 implementation',()=>{
  const report=oldKernelReport(),validation=validateGeometricTruthMeasurements(report);
  assert.equal(validation.valid,true,validation.errors.join(','));
  assert.equal(report.status,'red');
  assert.ok(report.red_metrics.length>=8,`expected a material RED baseline, got ${report.red_metrics.length}`);
  for(const name of GEOMETRIC_TRUTH_METRICS)assert.ok(report.metrics.some(item=>item.metric===name),name);
  for(const name of ['projected_head_to_shoulder_ratio','head_to_torso_ratio','face_feature_surface_containment','eye_depth_order_under_yaw','whole_body_connected_components','visible_feature_occlusion_correctness','projected_anatomical_ratio_validity']){
    assert.equal(report.metrics.find(item=>item.metric===name).pass,false,name);
  }
  assert.equal(report.source.image,fixture.source_asset);
});

test('geometric truth metrics cannot be represented by boolean-only certificate entries',()=>{
  const report=oldKernelReport();
  for(const item of report.metrics){
    assert.notEqual(typeof item.measurement,'boolean',item.metric);
    assert.notEqual(typeof item.allowed,'boolean',item.metric);
    assert.equal(typeof item.method,'string',item.metric);
    assert.equal(typeof item.evidence_root,'string',item.metric);
    assert.equal(typeof item.pass,'boolean',item.metric);
  }
});

export {oldKernelReport};
