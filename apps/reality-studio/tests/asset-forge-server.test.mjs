import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {startStudioServer} from '../src/server.mjs';

const post=async(url,route,value)=>{
  const response=await fetch(url+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)});
  const data=await response.json();
  assert.equal(response.status,200,JSON.stringify(data));
  return data;
};
const intent={description:'创建一名冰属性三维女剑士，名字叫霜璃，属于北境守望者。',subject_id:'subject:asset-forge-server-test',asset_kind:'character-3d',functional_role:'player-character',target_platforms:['desktop','mobile','web','xr'],constraints:{palette:['#1c4fa3','#f2f6ff','#9ddcff','#17305a'],style:'stylized-readable-pbr',max_texture_size:512,max_sprite_frames:6,audio_seconds:.8,max_particles:96,max_triangles:2400,pbr_texture_size:256,max_bones:64,animation_fps:30,lod_ratios:[1,.55,.25],license_policy:'generated-or-cleared'}};

test('Studio v1.5 server closes native Asset Forge workflow',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'studio-forge-server-'));
  const {server,url}=await startStudioServer({port:0,dataDir:dir});
  try{
    const health=await fetch(url+'/api/health').then(r=>r.json());
    assert.equal(health.studio_version,'1.5.0-alpha.1');
    assert.equal(health.asset_forge_native,true);
    assert.equal(health.ragf_version,'0.4.0-alpha.1');
    assert.equal(health.rsr_version,'0.9.0-alpha.1');
    assert.equal(health.vsr_version,'0.8.0-alpha.1');
    const project=await fetch(url+'/api/unified/sample').then(r=>r.json());
    const unified=await post(url,'/api/unified/session/new',{project});
    const created=await post(url,'/api/asset-forge/session/new',{unified_session_id:unified.session_id,intent,out_dir:path.join(dir,'generated')});
    assert.equal(created.status,'new');
    const generated=await post(url,'/api/asset-forge/session/generate',{forge_id:created.forge_id});
    assert.equal(generated.production.candidates.length,3);
    const cinematic=generated.production.candidates.find(item=>item.variant==='cinematic');
    const selected=await post(url,'/api/asset-forge/session/select',{forge_id:created.forge_id,candidate_id:cinematic.candidate_id,reason:'server-test'});
    assert.equal(selected.production.selected_candidate_id,cinematic.candidate_id);
    const regenerated=await post(url,'/api/asset-forge/session/regenerate',{forge_id:created.forge_id,patch:{constraints:{palette:['#2458c8','#ffffff','#75deff','#111b39']}}});
    assert.equal(regenerated.production.generation,2);
    const preview=await post(url,'/api/asset-forge/session/preview',{forge_id:created.forge_id,include_runtime:true});
    assert.ok(preview.runtime_payload.mesh.positions.length>0);
    assert.equal(preview.runtime_payload.physical.body.shape,'capsule-3d');
    const accepted=await post(url,'/api/asset-forge/session/accept',{forge_id:created.forge_id,x:220,y:144,z:12});
    assert.equal(accepted.status,'accepted');
    assert.equal(accepted.project.asset_count,5);
    assert.ok(accepted.accepted.spatial_body_id);
    assert.ok(accepted.accepted.spatial_character_id);
    const exported=await post(url,'/api/asset-forge/session/export',{forge_id:created.forge_id});
    assert.ok(exported.manifest.manifest_root);
    assert.ok(exported.production.production_manifest.manifest_root);
    assert.equal(exported.acceptance.asset_id,accepted.accepted.asset_id);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
