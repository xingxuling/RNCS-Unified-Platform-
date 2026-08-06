import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {buildCharacterContinuityReport,buildCutContinuityReport,buildProductionExposureSheets,createAnimeProduction,renderProduction,validateFrameSequenceIntegrity,validateProductionExposureSheets} from '../src/index.mjs';

const actor={layer_id:'character:lan',actor_id:'lan',asset_id:'character:lan',family_root:'family-root',asset_root:'asset-root',genome_root:'genome-root',identity_root:'identity-root',identity_signature_root:'signature-root',palette_root:'palette-root',proportion_root:'proportion-root',appearance_root:'appearance-root'};
const base={episode_id:'EP01',scene_id:'court',duration:.1,fps:10,resolution:{width:160,height:90},mode:'native-2d',background_layers:[{layer_id:'background:court'}],character_layers:[actor],key_pose_track:[{frame:0,pose_id:'hold'}],animation:{exposure:'on_twos',hair_secondary:'subtle',coat_secondary:'subtle'},transition:{type:'hard-cut',duration_frames:0}};
const production=()=>createAnimeProduction({series:'Quality',episode:'EP01',cuts:[{...base,cut_id:'S01',layout:'wide_establishing'},{...base,cut_id:'S02',layout:'medium_close_up'},{...base,cut_id:'S03',layout:'close_up'}]});

test('Character Genome roots remain continuous through three derived Cuts',()=>{
  const report=buildCharacterContinuityReport(production());
  assert.equal(report.status,'pass');
  assert.equal(report.actors[0].cut_count,3);
  assert.equal(report.stable_identity,true);
  assert.equal(report.stable_appearance,true);
  assert.equal(report.programme_continuous_actor,true);
  const drifted=production();drifted.cuts[2].character_layers[0].palette_root='drift';
  assert.equal(buildCharacterContinuityReport(drifted).status,'fail');
  const missing=production();delete missing.cuts[1].character_layers[0].identity_root;
  assert.equal(buildCharacterContinuityReport(missing).status,'fail');
});

test('X-Sheets align camera, Composition and secondary Motion Tracks frame by frame',()=>{
  const sheets=buildProductionExposureSheets(production()),validation=validateProductionExposureSheets(sheets);
  assert.equal(validation.valid,true);
  for(const {xsheet} of sheets.sheets)for(const frame of xsheet.frames){assert.equal(frame.secondary_motion_state.frame,frame.frame_number);assert.equal(frame.camera_state.frame,frame.frame_number);assert.equal(frame.composition_state.frame,frame.frame_number);assert.ok(frame.secondary_motion_state.motion_root);assert.ok(frame.composition_state.composition_state_root)}
});

test('frame integrity and Cut seam reports prove real three-Cut visual coverage',t=>{
  const outDir=fs.mkdtempSync(path.join(os.tmpdir(),'anime-phase4-quality-'));t.after(()=>fs.rmSync(outDir,{recursive:true,force:true}));const value=production(),rendered=renderProduction(value,{outDir,width:160,height:90});
  const integrity=validateFrameSequenceIntegrity(rendered.manifest,{rootDir:outDir}),seams=buildCutContinuityReport(value,rendered.manifest);
  assert.equal(integrity.status,'pass');
  assert.equal(integrity.cut_count,3);
  assert.equal(integrity.single_placeholder_repeat,false);
  assert.equal(seams.status,'pass');
  assert.equal(seams.seam_count,2);
  assert.equal(seams.seams.every(item=>item.visible_change),true);
});
