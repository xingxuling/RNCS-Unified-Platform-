import assert from 'node:assert/strict';
import test from 'node:test';
import {createCharacterGenome} from '../../character-genome-runtime/src/index.mjs';
import {compileMorphology} from '../src/canonical-morphology.mjs';
import {performanceStateForFrame,solveKinematics,validateKinematics,boneMap} from '../src/kinematics.mjs';
import {solveDeformation,validateDeformedGeometry} from '../src/deformation.mjs';
import {projectFrameGeometry,validateProjection} from '../src/projection.mjs';
import {validateCanonicalSurfaceMesh} from '../src/canonical-surface-mesh.mjs';

const views=['front','three-quarter-left','three-quarter-right','head-turn'];
const poses=['neutral','alert','action'];
const cameras=[{yaw:0,pitch:0},{yaw:.42,pitch:.08},{yaw:-.64,pitch:-.06}];
const random=seed=>{let state=seed>>>0;return()=>{state=(state*1664525+1013904223)>>>0;return state/0x100000000;};};

function fuzzGenome(index){
  const next=random(index+17),value=(min,max)=>Number((min+(max-min)*next()).toFixed(5));
  return createCharacterGenome({seed:`phase6-2-fuzz-${index}`,body_parameters:{'body.head_body_ratio':value(.36,.70),'body.shoulder_width':value(.32,.73),'body.neck_length':value(.3,.70),'body.limb_ratio':value(.34,.70),'body.torso_length':value(.32,.68)},identity_parameters:{'face.jaw_width':value(.4,.76),'face.jaw_definition':value(.4,.78),'face.eye_spacing':value(.34,.66),'face.mouth_width':value(.3,.60)}});
}

function assertGeometry(asset,posed,geometry,projected){
  const bones=boneMap(posed),upper=bones.get('upper-arm-left'),fore=bones.get('forearm-left'),wrist=bones.get('wrist-left'),elbow=bones.get('elbow-left'),hand=bones.get('hand-left'),neck=bones.get('neck'),rib=bones.get('ribcage');
  assert.ok(Math.abs(Math.hypot(upper.world_end[0]-upper.world_start[0],upper.world_end[1]-upper.world_start[1],upper.world_end[2]-upper.world_start[2])-upper.length)<1e-5);
  assert.ok(Math.abs(Math.hypot(fore.world_end[0]-fore.world_start[0],fore.world_end[1]-fore.world_start[1],fore.world_end[2]-fore.world_start[2])-fore.length)<1e-5);
  assert.deepEqual(elbow.world_start,upper.world_end);assert.deepEqual(wrist.world_start,fore.world_end);assert.deepEqual(hand.world_start,wrist.world_start);assert.deepEqual(neck.world_start,rib.world_end);
  for(const anchor of asset.surface_templates.scalp_surface.anchors)assert.ok(anchor.local_position.every(Number.isFinite));
  assert.equal(validateKinematics(posed).valid,true);assert.equal(validateDeformedGeometry(geometry).valid,true);assert.equal(validateProjection(projected).valid,true);
  assert.equal(asset.field_validation.valid,true);assert.equal(asset.mesh_validation.valid,true);assert.equal(validateCanonicalSurfaceMesh(asset.canonical_surface_mesh).valid,true);
  assert.equal(asset.canonical_surface_mesh.connected_components.length,1);assert.equal(asset.canonical_surface_mesh.vertices.length,asset.canonical_surface_mesh.normals.length);
  assert.deepEqual(asset.proportions.constraint_solution.violations,[]);
  assert.ok(geometry.surfaces.primitives.some(item=>item.id==='garment-coat'));assert.ok(geometry.surfaces.primitives.some(item=>item.id==='hair-crown'));
}

test('1000 genomes x poses x camera yaw/pitch never silently emit malformed geometry',()=>{
  let checked=0;
  for(let index=0;index<1000;index+=1){
    const asset=compileMorphology(fuzzGenome(index));
    assert.equal(Object.values(asset.certificate.gates).every(Boolean),true,`certificate ${index}`);
    for(let poseIndex=0;poseIndex<poses.length;poseIndex+=1){
      const performance=performanceStateForFrame(asset,{view:views[(index+poseIndex)%views.length],pose:poses[poseIndex],frame:37,totalFrames:120}),posed=solveKinematics(asset,performance),geometry=solveDeformation(asset,posed,performance);
      for(const camera of cameras){const projected=projectFrameGeometry(geometry,{...camera,width:320,height:180});assertGeometry(asset,posed,geometry,projected);checked+=1;}
    }
  }
  assert.equal(checked,9000);
});

test('illegal source parameters fail closed before morphology compilation',()=>{
  assert.throws(()=>fuzzGenome(1)&&createCharacterGenome({seed:'illegal',body_parameters:{'body.shoulder_width':.01}}),error=>error.code==='CHARACTER_CONSTRAINTS_INVALID');
});
