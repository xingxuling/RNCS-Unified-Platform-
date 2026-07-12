import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {startServer} from '../src/server.mjs';
const post=async(url,route,value)=>{const response=await fetch(url+route,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(value)}),data=await response.json();assert.equal(response.status,200,JSON.stringify(data));return data};
const intent={description:'创建冰属性三维女剑士霜璃',subject_id:'subject:ragf-server-test',asset_kind:'character-3d',functional_role:'player-character',target_platforms:['desktop','mobile','web','xr'],constraints:{palette:['#1c4fa3','#f2f6ff','#9ddcff','#17305a'],style:'stylized-readable-pbr',max_texture_size:512,max_sprite_frames:6,audio_seconds:.8,max_particles:96,max_triangles:2400,pbr_texture_size:256,max_bones:64,animation_fps:30,lod_ratios:[1,.55,.25],license_policy:'generated-or-cleared'}};
test('RAGF v0.4 production server closes candidate regeneration and acceptance',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'ragf-production-server-')),server=startServer({port:0,dataDir:dir});await new Promise(resolve=>server.once('listening',resolve));const url=`http://127.0.0.1:${server.address().port}`;
  try{
    const health=await fetch(url+'/api/health').then(r=>r.json());assert.equal(health.version,'0.4.0-alpha.1');assert.equal(health.production_sessions,true);
    const created=await post(url,'/api/production/new',{intent,out_dir:path.join(dir,'production')});assert.equal(created.status,'new');
    const generated=await post(url,'/api/production/generate',{session_id:created.session_id});assert.equal(generated.candidates.length,3);assert.ok(generated.candidates.every(item=>item.pass));
    const mobile=generated.candidates.find(item=>item.variant==='mobile');const selected=await post(url,'/api/production/select',{session_id:created.session_id,candidate_id:mobile.candidate_id});assert.equal(selected.selected_candidate_id,mobile.candidate_id);
    const regenerated=await post(url,'/api/production/regenerate',{session_id:created.session_id,patch:{constraints:{palette:['#2150bd','#ffffff','#7bdfff','#101934']}}});assert.equal(regenerated.generation,2);
    const accepted=await post(url,'/api/production/accept',{session_id:created.session_id});assert.equal(accepted.acceptance_receipt.status,'accepted');assert.ok(accepted.production_manifest.manifest_root);assert.ok(accepted.continuity_bundle.bundle_root);
  }finally{await new Promise(resolve=>server.close(resolve));}
});
