import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {createDirectorMotionOverride} from '../../reality-simulation-runtime/src/anime-motion.mjs';
import {generateAnimeCharacterFamily} from '../../reality-asset-genesis-fabric/src/index.mjs';
import {bindRagfMotionTrackToXSheet,buildExposureSheet,buildProductionExposureSheets,createAnimeProduction,replayRagfMotionBinding,renderCutFrame,validateExposureSheet,validateRagfMotionBinding,validateRagfMotionTrack} from '../src/index.mjs';

const pngSignature=Buffer.from([137,80,78,71,13,10,26,10]);

test('RAGF motion binding schema keeps roots, timebase and authority explicit',()=>{
  const schema=JSON.parse(fs.readFileSync(path.join(import.meta.dirname,'../schemas/ragf-motion-xsheet-binding.v0.1.schema.json'),'utf8'));
  assert.equal(schema.properties.format.const,'rncs.ragf-motion-xsheet-binding.v0.1');
  assert.ok(schema.required.includes('original_xsheet_root'));
  assert.ok(schema.required.includes('motion_root'));
  assert.ok(schema.required.includes('motion_quality_root'));
  assert.ok(schema.required.includes('frame_map'));
  assert.equal(schema.properties.authority.const,'episode-derived-runtime');
  assert.equal(schema.properties.creative_authority.const,false);
});

function source(){return generateAnimeCharacterFamily({assetId:'character:ragf-binding',seed:'ragf-binding-seed',motion:{fps:12,frame_count:8,blink_frames:[3,6]}})}
function cut({duration=2/3,fps=24,cutId='S01'}={}){return{episode_id:'EP01',scene_id:'court',cut_id:cutId,duration,fps,resolution:{width:320,height:180},mode:'native-2d',background_layers:[{layer_id:'background:court'}],character_layers:[{layer_id:'character:ragf-binding',actor_id:'binding',asset_id:'character:ragf-binding'}],key_pose_track:[{frame:0,pose_id:'hold'}],animation:{exposure:'on_ones'}}}
function production(value=cut()){return createAnimeProduction({series:'RAGF Binding',episode:'EP01',scene:'court',cut:value})}

test('RAGF motion track validation preserves sealed continuity and motion state roots',()=>{
  const track=source().family.motion_track,result=validateRagfMotionTrack(track);
  assert.equal(result.valid,true);
  assert.equal(result.frame_count,8);
  assert.equal(result.fps,12);
  assert.equal(track.loop_period_frames,8);
  assert.equal(result.seam.valid,true);
  assert.equal(result.motion_quality_root,track.quality_contract.quality_root);
  assert.equal(track.continuity.stable_identity,true);
  assert.equal(track.frames[3].eye_state,'blink');
});

test('RAGF motion is timebase-bound into X-Sheet frames with blink and RSR roots',()=>{
  const track=source().family.motion_track,sheet=buildExposureSheet(cut(),{ragfMotionTrack:track}),validation=validateExposureSheet(sheet);
  assert.equal(validation.valid,true);
  assert.equal(sheet.frame_count,16);
  assert.equal(sheet.ragf_motion_track_root,track.motion_root);
  assert.equal(sheet.frames[6].ragf_motion_state.source_frame_number,3);
  assert.equal(sheet.frames[6].eye_state,'closed');
  assert.equal(sheet.frames[7].eye_state,'closed');
  assert.equal(sheet.frames[8].ragf_motion_state.source_frame_number,4);
  assert.equal(sheet.frames[6].secondary_motion_state.frame,6);
  assert.equal(sheet.frames[6].secondary_motion_state.profile_root,track.motion_root);
  assert.equal(sheet.frames[6].secondary_motion_state.motion_source,'ragf.anime-motion-track.v0.1');
});

test('Director override is bounded, visible in the bound X-Sheet, and replayable',()=>{
  const track=source().family.motion_track,value=production(),base=buildExposureSheet(value.cut),override=createDirectorMotionOverride({layer:'hair',startFrame:4,endFrame:7,amplitude:5,frequency:.2,phase:0,reason:'director timing'}),bound=bindRagfMotionTrackToXSheet(base,track,{director_overrides:[override]}),validation=validateRagfMotionBinding(bound.binding),replay=replayRagfMotionBinding(base,track,bound.binding);
  assert.equal(validation.valid,true);
  assert.equal(bound.xsheet.frames[5].secondary_motion_state.hair_override,override.override_id);
  assert.notEqual(bound.xsheet.frames[5].secondary_motion_state.hair,bound.xsheet.frames[5].ragf_motion_state.secondary_motion.hair);
  assert.equal(bound.binding.continuity.identity_root,track.identity_root);
  assert.equal(bound.binding.continuity.palette_root,track.palette_root);
  assert.equal(replay.valid,true);
  assert.equal(replay.binding_root,bound.binding.binding_root);
  assert.equal(replay.xsheet_root,bound.xsheet.xsheet_root);
});

test('Bound motion reaches the native raster renderer as the actual frame state',()=>{
  const track=source().family.motion_track,value=production(),sheet=buildExposureSheet(value.cut,{ragfMotionTrack:track}),rendered=renderCutFrame(value,6,{xsheet:sheet,width:160,height:90});
  assert.equal(rendered.state.blink,true);
  assert.equal(rendered.state.rsr_motion_root,sheet.frames[6].secondary_motion_state.motion_root);
  assert.equal(rendered.xsheet_frame.ragf_motion_state.source_frame_number,3);
  assert.equal(rendered.evidence.provider_receipts.find(item=>item.provider_id==='rsr.anime-secondary-motion-reference').input_root,track.motion_root);
  assert.equal(rendered.evidence.provider_receipts.find(item=>item.provider_id==='rsr.anime-secondary-motion-reference').capability,'ragf-track-bound-secondary-motion');
  assert.equal(rendered.bytes.subarray(0,8).equals(pngSignature),true);
});

test('Production X-Sheet builder accepts per-Cut RAGF tracks without changing Episode authority',()=>{
  const track=source().family.motion_track,value=createAnimeProduction({series:'RAGF Binding',episode:'EP01',cuts:[cut({cutId:'S01'}),cut({cutId:'S02'})]}),tracks={'EP01/court/S01':track,'EP01/court/S02':track},sheets=buildProductionExposureSheets(value,{ragfMotionTracks:tracks});
  assert.equal(sheets.sheets.every(item=>item.xsheet.ragf_motion_track_root===track.motion_root),true);
  assert.equal(sheets.sheets.every(item=>validateExposureSheet(item.xsheet).valid),true);
  assert.equal(value.authority_contract.episode_authoritative,true);
});

test('Strict frame mapping fails closed and hold-last is explicit',()=>{
  const track=source().family.motion_track;
  assert.throws(()=>buildExposureSheet(cut({duration:1,fps:12}),{ragfMotionTrack:track}),/RAGF_MOTION_FRAME_UNMAPPED/);
  const held=buildExposureSheet(cut({duration:1,fps:12}),{ragfMotionTrack:track,ragfMotionBindingOptions:{missing_frame_policy:'hold-last'}});
  assert.equal(held.frames.at(-1).ragf_motion_state.source_frame_number,7);
});

test('Loop mapping keeps a long Cut moving and records cycle iterations',()=>{
  const track=source().family.motion_track,sheet=buildExposureSheet(cut({duration:2,fps:24}),{ragfMotionTrack:track,ragfMotionBindingOptions:{missing_frame_policy:'loop'}}),validation=validateExposureSheet(sheet);
  assert.equal(validation.valid,true);
  assert.equal(sheet.ragf_motion_binding.missing_frame_policy,'loop');
  assert.equal(sheet.ragf_motion_binding.loop_mode,'cycle');
  assert.equal(sheet.ragf_motion_binding.loop_period_frames,8);
  assert.equal(sheet.ragf_motion_binding.motion_quality_root,track.quality_contract.quality_root);
  assert.equal(sheet.frames[0].ragf_motion_state.source_frame_number,0);
  assert.equal(sheet.frames[15].ragf_motion_state.source_frame_number,7);
  assert.equal(sheet.frames[16].ragf_motion_state.source_frame_number,0);
  assert.equal(sheet.frames[16].ragf_motion_state.binding_state_root.length,64);
  assert.equal(sheet.frames[16].ragf_motion_state.target_frame_number,16);
  assert.equal(sheet.frames[16].ragf_motion_state.source_track_root,track.motion_root);
  assert.equal(sheet.frames[16].secondary_motion_state.hair,sheet.frames[0].secondary_motion_state.hair);
  assert.equal(sheet.frames[16].secondary_motion_state.frame,16);
  assert.equal(sheet.frames[16].secondary_motion_state.motion_source,'ragf.anime-motion-track.v0.1');
});

test('Loop policy rejects a non-loopable track instead of silently holding',()=>{
  const generated=source(),track={...generated.family.motion_track,loop_mode:'hold'},tampered={...track,motion_root:generated.family.motion_track.motion_root};
  assert.throws(()=>buildExposureSheet(cut({duration:1,fps:24}),{ragfMotionTrack:tampered,ragfMotionBindingOptions:{missing_frame_policy:'loop'}}),/RAGF_MOTION_TRACK_INVALID/);
});

test('Tampered RAGF track and unsupported override layer are rejected',()=>{
  const generated=source(),tampered=structuredClone(generated.family.motion_track);tampered.frames[0].secondary_motion.hair+=1;
  assert.equal(validateRagfMotionTrack(tampered).valid,false);
  assert.throws(()=>buildExposureSheet(cut(),{ragfMotionTrack:tampered}),/RAGF_MOTION_TRACK_INVALID/);
  const track=generated.family.motion_track,base=buildExposureSheet(cut());
  assert.throws(()=>bindRagfMotionTrackToXSheet(base,track,{director_overrides:[{layer:'face',start_frame:0,end_frame:1,amplitude:1,reason:'invalid'}]}),/RAGF_MOTION_OVERRIDE_LAYER_UNSUPPORTED/);
});

test('RAGF runtime rejects a re-sealed cycle with a broken terminal seam',()=>{
  const generated=source(),tampered=structuredClone(generated.family.motion_track);
  tampered.frames[7].secondary_motion.hair+=.5;
  const result=validateRagfMotionTrack(tampered);
  assert.equal(result.valid,false);
  assert.ok(result.errors.includes('RAGF_MOTION_SEAM_INVALID'));
  assert.throws(()=>buildExposureSheet(cut({duration:2,fps:24}),{ragfMotionTrack:tampered,ragfMotionBindingOptions:{missing_frame_policy:'loop'}}),/RAGF_MOTION_TRACK_INVALID/);
});
