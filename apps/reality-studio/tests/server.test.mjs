import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import {startStudioServer} from '../src/server.mjs';

const post=(url,path,body)=>fetch(url+path,{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)}).then(r=>r.json());

test('server exposes project and behavior native endpoints',async()=>{
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'studio-server-'));
  const {server,url}=await startStudioServer({port:0,dataDir:dir});
  try{
    const h=await fetch(url+'/api/health').then(r=>r.json());
    assert.equal(h.status,'healthy');assert.equal(h.behavior_native,true);assert.equal(h.webgpu_viewport,true);assert.equal(h.studio_version,'1.5.0-alpha.1');assert.equal(h.ui_native,true);assert.equal(h.input_native,true);assert.equal(h.asset_continuity_native,true);assert.equal(h.asset_reimport,true);assert.equal(h.dependency_graph,true);
    assert.equal(h.runtime_timeline,true);assert.equal(h.runtime_replay,true);assert.equal(h.runtime_time_travel,true);assert.equal(h.live_update_native,true);assert.equal(h.live_update_version,'0.1.0-alpha.1');assert.equal(h.asset_database,true);assert.equal(h.asset_incremental_cache,true);assert.equal(h.asset_watch,true);
    const p=await fetch(url+'/api/project/new').then(r=>r.json());
    assert.equal(p.format,'reality-studio.project.v0.8');
    const v=await post(url,'/api/project/validate',{project:p});assert.equal(v.valid,true);
    const sample=await fetch(url+'/api/behavior/sample').then(r=>r.json());
    const bv=await post(url,'/api/behavior/validate',{program:sample});assert.equal(bv.valid,true);
    let session=await post(url,'/api/behavior/session/new',{program:sample});assert.equal(session.runtime.tick,0);
    session=await post(url,'/api/behavior/session/step',{session_id:session.session_id,input:{move_right:true}});assert.equal(session.runtime.tick,1);
    const snap=await post(url,'/api/behavior/session/command',{session_id:session.session_id,command:'snapshot',label:'test'});assert.ok(snap.id);
    const exported=await post(url,'/api/behavior/session/export',{session_id:session.session_id});assert.ok(exported.causal_delta.delta_root);
    const unified=await fetch(url+'/api/unified/sample').then(r=>r.json());assert.equal(unified.format,'reality-studio.unified-project.v0.9');
    const uv=await post(url,'/api/unified/validate',{project:unified});assert.equal(uv.valid,true);
    let us=await post(url,'/api/unified/session/new',{project:unified});assert.equal(us.assets.count,4);
     us=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'step',input:{move_right:true}});assert.equal(us.timeline.entries.length,1);
     const replay=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'runtime-replay'});assert.equal(replay.deterministic,true);assert.ok(replay.replay_root);
     const checkpoint=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'runtime-checkpoint',label:'server-test'});assert.ok(checkpoint.runtime_checkpoint.checkpoint_id);
     us=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'step',input:{move_left:true}});
     const restored=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'runtime-restore',checkpoint_id:checkpoint.runtime_checkpoint.checkpoint_id});assert.equal(restored.behavior.runtime.tick,checkpoint.runtime_checkpoint.tick);assert.equal(restored.behavior.runtime.state_root,checkpoint.runtime_checkpoint.state_root);
     const seek=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'runtime-seek',tick:0});assert.equal(seek.behavior.runtime.tick,0);assert.equal(seek.runtime_replay.deterministic,true);
    us=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'move-node',node_id:'node:player',x:128,y:256});assert.equal(us.editor.selected_node_id,'node:player');
    const svg=Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><rect width="8" height="8"/></svg>').toString('base64');us=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'import-embedded-asset',file:{name:'server-import.svg',mime:'image/svg+xml',dataBase64:svg,dataUrl:`data:image/svg+xml;base64,${svg}`}});assert.equal(us.assets.count,5);
    const audit=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'audit-assets'});assert.equal(audit.valid,true);assert.ok(audit.audit_root);
    const graph=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'asset-dependency-graph'});assert.equal(graph.nodes.length,5);assert.ok(graph.graph_root);
    const ledger=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'asset-ledger'});assert.equal(ledger.assets.length,5);assert.ok(ledger.ledger_root);
    const sourceRoot=path.join(dir,'asset-source');fs.mkdirSync(sourceRoot,{recursive:true});fs.writeFileSync(path.join(sourceRoot,'server-db.png'),'server-db');
    const plan=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'asset-database-plan',source_roots:[sourceRoot],cache_dir:path.join(dir,'asset-cache')});assert.equal(plan.items.length,1);assert.equal(plan.items[0].status,'added');
    us=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'asset-database-sync',source_roots:[sourceRoot],cache_dir:path.join(dir,'asset-cache'),profiles:['runtime']});assert.equal(us.asset_database_summary.added,1);assert.equal(us.assets.count,6);assert.ok(us.assets.database.last_sync_root);
    let live=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'live-update',phase:'propose',patches:[{op:'set',path:'identity.title',value:'服务端受控热更新'}]});assert.equal(live.phase,'simulated');assert.equal(live.deterministic,true);assert.equal(live.simulation.valid,true);
    live=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'live-update',phase:'authorize',candidate_id:live.candidate_id,resolver:'subject:server-test',reason:'server integration'});assert.equal(live.phase,'authorized');
    us=await post(url,'/api/unified/session/command',{session_id:us.session_id,command:'live-update',phase:'commit',candidate_id:live.candidate_id,confirmed:true});assert.equal(us.live_update.phase,'committed');assert.equal(us.behavior.program.identity.title,'服务端受控热更新');assert.equal(us.behavior.runtime.tick,0);assert.equal(us.live_update.verification.valid,true);assert.equal(us.live_update_manifest.manifest_root.length,64);
    const gf=await post(url,'/api/unified/session/gpu-frame',{session_id:us.session_id,quality:'quality'});assert.equal(gf.frame.transport_format,'reality-studio.serialized-gpu-frame.v1.0');assert.ok(gf.summary.frame_plan_root);
     const ue=await post(url,'/api/unified/session/export',{session_id:us.session_id});assert.ok(ue.build_plan.build_root);assert.ok(ue.runtime_timeline.timeline_root);assert.ok(ue.runtime_replay.replay_root);assert.equal(ue.runtime_replay.deterministic,true);assert.equal(ue.asset_manifest.assets.length,6);assert.ok(ue.asset_database.database_root);assert.ok(ue.asset_continuity_ledger.ledger_root);assert.ok(ue.gpu_viewport_manifest.manifest_root);assert.ok(ue.ui_input_manifest.manifest_root);
  }finally{await new Promise(r=>server.close(r));}
});
