import assert from 'node:assert/strict';
import test from 'node:test';
import {buildNativeDrawingReviewModel,createHumanVisualReview,SPATIAL_EVIDENCE_SPECS} from '../web/native-drawing-review-model.js';

function fixture({temporalPass=true,rootMismatch=false,withMp4=true}={}){
  const files={};
  for(const [index,spec] of SPATIAL_EVIDENCE_SPECS.entries())files[spec.file]={status:'passed',human_visual_acceptance:'pending',evidence_root:`spatial-${index+1}`,entries:spec.key==='mesh'?[{view:'front',visible_groups:['torso','arm-left'],occluded_groups:['arm-right'],missing_canonical_groups:[]}]:[]};
  files['direct-visual-bridge.json']={format:'rncs.phase6-6-direct-visual-bridge.v0.4',bridge_root:'visual-bridge'};
  for(const [index,spec] of SPATIAL_EVIDENCE_SPECS.entries())files['direct-visual-bridge.json'][spec.root]=rootMismatch&&spec.key==='face'?'wrong-root':`spatial-${index+1}`;
  files['temporal-drawing-stability-evidence.json']={status:temporalPass?'passed':'failed',human_visual_acceptance:'pending',evidence_root:'temporal-evidence',validation:{valid:temporalPass,errors:temporalPass?[]:['TEMPORAL_DRAWING_CORE_TELEPORT']},report:{passed:temporalPass,temporal_root:'temporal-report',failures:temporalPass?[]:['TEMPORAL_DRAWING_CORE_TELEPORT'],summary:{frame_count:120,adjacent_same_cut_pair_count:117,core_missing_count:0,core_topology_change_count:0,non_finite_geometry_count:0,max_core_normalized_displacement:temporalPass?.02:.4,p95_core_normalized_displacement:.018,mean_operation_churn_ratio:.04,p95_operation_churn_ratio:.05,cel_path_churn_count:2,body_visibility_state_transition_count:1,thresholds:{max_core_normalized_displacement:.1,max_mean_operation_churn_ratio:.45}}}};
  files['temporal-evidence-bridge.json']={bridge_root:'temporal-bridge',temporal_drawing_stability_evidence_root:'temporal-evidence',temporal_report_root:'temporal-report'};
  files['evidence-ledger.json']={ledger_root:'ledger',direct_visual_bridge_root:'visual-bridge',temporal_drawing_stability_evidence_root:'temporal-evidence',temporal_evidence_bridge_root:'temporal-bridge'};
  for(const [index,spec] of SPATIAL_EVIDENCE_SPECS.entries())files['evidence-ledger.json'][spec.root]=`spatial-${index+1}`;
  files['evidence-summary.json']={ledger_root:'ledger',direct_visual_bridge_root:'visual-bridge',temporal_drawing_stability_evidence_root:'temporal-evidence',frame_count:120,fps:24,resolution:{width:1280,height:720},provider:'rncs.native-fullbody-svg-librsvg.cpu',human_visual_acceptance:'pending'};
  files['phase-status.json']={human_visual_acceptance:'pending',creative_production_review:'pending-human-review',commercial_anime_quality:'not-proven'};
  files['frame-manifest.json']={frame_count:120,fps:24,width:1280,height:720,provider_id:'rncs.native-fullbody-svg-librsvg.cpu'};
  return{jsonFiles:files,assetNames:withMp4?['episode.mp4','static-gates/front.png']:[]};
}

test('complete spatial + temporal evidence authorizes human review but never auto-accepts',()=>{const model=buildNativeDrawingReviewModel(fixture());assert.equal(model.overall_status,'ready-for-human-review');assert.equal(model.ready_for_human_review,true);assert.equal(model.spatial.status,'pass');assert.equal(model.temporal.status,'pass');assert.equal(model.automatic_visual_acceptance,false);assert.equal(model.human.status,'pending');const review=createHumanVisualReview({model,status:'accepted',reviewId:'human-1',reviewer:'reviewer'});assert.equal(review.status,'accepted');assert.equal(review.automatic_commit,false);assert.equal(review.episode_authority_unchanged,true);});

test('temporal failure blocks acceptance even when all six spatial roots pass',()=>{const model=buildNativeDrawingReviewModel(fixture({temporalPass:false}));assert.equal(model.spatial.status,'pass');assert.equal(model.temporal.status,'blocked');assert.equal(model.overall_status,'blocked-temporal');assert.throws(()=>createHumanVisualReview({model,status:'accepted'}),/HUMAN_REVIEW_ACCEPT_BLOCKED/);const revision=createHumanVisualReview({model,status:'revision-requested',observations:['line jitter']});assert.equal(revision.status,'revision-requested');});

test('root mismatch becomes integrity failure and blocks acceptance',()=>{const model=buildNativeDrawingReviewModel(fixture({rootMismatch:true}));assert.equal(model.integrity.valid,false);assert.equal(model.overall_status,'integrity-failed');assert.ok(model.integrity.failures.some(item=>item==='DIRECT_BRIDGE_ROOT_MISMATCH:face'));assert.throws(()=>createHumanVisualReview({model,status:'accepted'}),/HUMAN_REVIEW_ACCEPT_BLOCKED/);});

test('missing media keeps engineering evidence visible but does not authorize accepted',()=>{const model=buildNativeDrawingReviewModel(fixture({withMp4:false}));assert.equal(model.spatial.status,'pass');assert.equal(model.temporal.status,'pass');assert.equal(model.overall_status,'engineering-pass-media-missing');assert.equal(model.media.mp4_present,false);assert.throws(()=>createHumanVisualReview({model,status:'accepted'}),/HUMAN_REVIEW_ACCEPT_BLOCKED/);});

test('mesh visibility preserves visible, occluded and canonical-missing semantics',()=>{const model=buildNativeDrawingReviewModel(fixture());assert.equal(model.visibility.length,1);assert.deepEqual(model.visibility[0].visible_groups,['torso','arm-left']);assert.deepEqual(model.visibility[0].occluded_groups,['arm-right']);assert.deepEqual(model.visibility[0].missing_canonical_groups,[]);});
