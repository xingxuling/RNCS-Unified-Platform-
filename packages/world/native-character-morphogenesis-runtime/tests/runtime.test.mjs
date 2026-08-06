import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import {applyLocalRepair,createAnatomySystem,poseForFrame,projectPoint,validateAnatomySystem} from '../src/anatomy.mjs';
import {rootHash} from '../src/canonical.mjs';
import {renderAnatomyFrame} from '../src/renderer.mjs';
import {muxMp4} from '../src/media.mjs';

const rootCheck=(value,key)=>{const copy=JSON.parse(JSON.stringify(value));const actual=copy[key];copy[key]='';return actual===rootHash(copy)};

test('one genome compiles a sealed anatomy system with all structural contracts',()=>{
  const system=createAnatomySystem(),validation=validateAnatomySystem(system);
  assert.equal(validation.valid,true,validation.errors.join(','));
  for(const [name,key] of [['visual_genome','visual_genome_root'],['body_surface','body_surface_root'],['face_rig','face_rig_root'],['hair_topology','hair_topology_root'],['joint_deformation','joint_deformation_root'],['hand_abstraction','hand_abstraction_root']])assert.equal(rootCheck(system[name],key),true,name);
  assert.equal(system.character_identity_root,system.genome.identity_root);
  assert.equal(system.body_surface.body_landmarks.shoulder_left.length,3);
  assert.equal(system.body_surface.body_landmarks.elbow_left.length,3);
});

test('shared landmarks and face anchors remain projectable across validation views',()=>{
  const system=createAnatomySystem(),views=['front','three-quarter-left','three-quarter-right','side','head-turn','shoulder-turn','elbow-bend'];
  for(const view of views){const pose=poseForFrame(system,{view,pose:view==='elbow-bend'?'action':'neutral',frame:48,totalFrames:120});const left=projectPoint(pose.face.anchors.left_eye,{width:640,height:360,cameraYaw:pose.view_yaw}),right=projectPoint(pose.face.anchors.right_eye,{width:640,height:360,cameraYaw:pose.view_yaw});assert.ok(Number.isFinite(left[0])&&Number.isFinite(right[0]),view);assert.notDeepEqual(left,right);assert.ok(pose.pose_root);}
  assert.equal(system.face_rig.face_projection_rules.eye_visibility??'cosine-with-near-eye-priority','cosine-with-near-eye-priority');
});

test('hair topology is scalp-attached and joint graph keeps volume rules',()=>{
  const system=createAnatomySystem(),hair=system.hair_topology,joints=system.joint_deformation;
  assert.equal(hair.collision_or_face_avoidance.scalp_attachment_required,true);
  assert.ok(hair.scalp_anchors.length>=7);
  assert.equal(new Set(hair.overlap_order).size,hair.overlap_order.length);
  assert.ok(joints.joints.every(joint=>joint.volume_preservation_rule.minimum>=.88));
  assert.ok(joints.joints.some(joint=>joint.joint_id==='elbow-left'));
});

test('hands expose explicit states and the local repair preserves identity roots',()=>{
  const system=createAnatomySystem(),repaired=applyLocalRepair(system,{region:'elbow-left'});
  assert.deepEqual(Object.keys(system.hand_abstraction.states),['open','relaxed','mild-tense']);
  for(const key of ['genome_root','character_identity_root','visual_genome_root','face_rig_root','hair_topology_root','shoulder_torso_pelvis_root','hand_abstraction_root'])assert.equal(repaired[key],system[key],key);
  assert.notEqual(repaired.anatomy_system_root,system.anatomy_system_root);
  assert.notEqual(repaired.body_surface_root,system.body_surface_root);
  assert.equal(repaired.body_surface.elbow_envelopes.left.bulge,system.body_surface.elbow_envelopes.left.bulge+.016);
  assert.equal(repaired.joint_deformation.joints.find(item=>item.joint_id==='elbow-left').repair_rule.applied,true);
});

test('renderer is deterministic and emits a non-empty raster with optional overlays',()=>{
  const system=createAnatomySystem(),a=renderAnatomyFrame(system,{width:320,height:180,view:'three-quarter-right',pose:'action',frame:68,totalFrames:120,skeleton:true,faceAnchors:true,jointEnvelope:true}),b=renderAnatomyFrame(system,{width:320,height:180,view:'three-quarter-right',pose:'action',frame:68,totalFrames:120,skeleton:true,faceAnchors:true,jointEnvelope:true});
  assert.deepEqual(a.png,b.png);assert.ok(a.png.length>1000);assert.ok(a.diagnostics.continuous_torso);assert.ok(a.frame_root);
});

test('missing FFmpeg is a hard media failure, never a fake MP4',()=>{
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-phase6-1-media-')),frames=path.join(temp,'frames');fs.mkdirSync(frames);fs.writeFileSync(path.join(frames,'frame-000001.png'),Buffer.from('not-a-png'));const wav=path.join(temp,'audio.wav');fs.writeFileSync(wav,Buffer.alloc(4));assert.throws(()=>muxMp4({framesDir:frames,wavFile:wav,outFile:path.join(temp,'episode.mp4'),ffmpegPath:path.join(temp,'missing-ffmpeg.exe'),ffprobePath:path.join(temp,'missing-ffprobe.exe')}),error=>error.code==='MEDIA_TOOL_NOT_FOUND');assert.equal(fs.existsSync(path.join(temp,'episode.mp4')),false);
});
