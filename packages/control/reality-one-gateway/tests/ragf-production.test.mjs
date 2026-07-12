import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {RealityOneGateway} from '../src/index.mjs';

const root=path.resolve(import.meta.dirname,'..');
const assetIntent={description:'创建冰属性三维女剑士霜璃',subject_id:'subject:gateway-ragf-test',asset_kind:'character-3d',target_platforms:['desktop','mobile','web'],constraints:{palette:['#1c4fa3','#f2f6ff','#9ddcff','#17305a'],style:'stylized-readable-pbr',max_texture_size:512,max_triangles:2400,pbr_texture_size:256,max_bones:64,animation_fps:30}};
const societyIntent={description:'无LLM 2.5D社会生态技术创生沙盒',world_name:'网关实验城',seed:'gateway-society-v05',population:160,years:30,map_size:8,constraints:{max_agents:28,max_concepts:10}};

async function gateway(prefix){
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),prefix));
  const g=new RealityOneGateway({manifestDirs:[path.join(root,'runtimes')],dataDir:path.join(dir,'gateway')});
  await g.discover();
  return {g,dir};
}

test('Gateway preserves RAGF v0.4 asset production lifecycle under v0.5 runtime',async()=>{
  const {g,dir}=await gateway('gateway-ragf-production-');
  const health=await g.invoke('rncs.ragf','health',{});
  assert.equal(health.version,'0.5.0-alpha.1');
  assert.ok(health.protocols.includes('reality-asset-genesis.v0.4'));
  const created=await g.invoke('rncs.ragf','production-create',{intent:assetIntent,outDir:path.join(dir,'production')});
  const generated=await g.invoke('rncs.ragf','production-generate',{session_id:created.session_id});
  assert.equal(generated.candidates.length,3);
  const accepted=await g.invoke('rncs.ragf','production-accept',{session_id:created.session_id});
  assert.ok(accepted.production_manifest.manifest_root);
  assert.equal(accepted.acceptance_receipt.status,'accepted');
});

test('Gateway exposes deterministic society genesis and live player branch lifecycle',async()=>{
  const {g,dir}=await gateway('gateway-ragf-society-');
  const health=await g.invoke('rncs.ragf','health',{});
  assert.equal(health.society_genesis,true);
  assert.equal(health.llm_required,false);
  const workspace=await g.invoke('rncs.ragf','society-generate',{intent:societyIntent,outDir:path.join(dir,'society')});
  assert.equal(workspace.genome.simulation.llm_calls,0);
  assert.equal((await g.invoke('rncs.ragf','society-verify',{workspace,baseDir:path.join(dir,'society'),verifyFiles:true})).valid,true);
  const created=await g.invoke('rncs.ragf','society-session-create',{intent:societyIntent,sessionId:'society:test'});
  assert.equal(created.year,0);
  await g.invoke('rncs.ragf','society-session-act',{session_id:created.session_id,action:{type:'open-knowledge-commons',year:1,value:800}});
  const stepped=await g.invoke('rncs.ragf','society-session-step',{session_id:created.session_id,years:5});
  assert.equal(stepped.year,5);
  assert.ok(stepped.history_root);
  const concept=await g.invoke('rncs.ragf','society-session-propose',{session_id:created.session_id,proposal:{player_id:'player:test',name:'潮差机械计算站',function:'compute-rules',principle:'mechanical-logic',substrate:'steel',energy:'water',control:'mechanical-governor',manufacturing:'precision-assembly',domains:['mechanics','computation','organization']}});
  assert.equal(concept.origin,'player-structured-proposal');
});
