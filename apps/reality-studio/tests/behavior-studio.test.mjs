import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {
  BehaviorEditorSession,
  compileBehaviorStudio,
  createBehaviorBinding,
  createRuleGraph,
  createStateMachineGraph,
  createBehaviorTreeGraph
} from '../src/behavior-studio.mjs';

const sample=()=>JSON.parse(fs.readFileSync(new URL('../examples/冰境试炼.behavior.json',import.meta.url),'utf8'));
function autopilot(session){
  const p=session.runtime.state.entities.player.variables;
  const e=session.runtime.state.entities.enemy.variables;
  const input={};
  if(!p.has_key)input.move_right=true;
  else if(e.health>0){const dx=e.x-p.x;if(Math.abs(dx)>50)input[dx>0?'move_right':'move_left']=true;else if(p.attack_cooldown<=0)input.attack=true;}
  else input.move_right=true;
  return input;
}

test('behavior compilation emits visual graphs',()=>{
  const c=compileBehaviorStudio(sample());
  assert.equal(c.validation.valid,true);
  assert.ok(c.graphs.rules.nodes.length>0);
  assert.ok(c.graphs.state_machine.edges.length>0);
  assert.ok(c.graphs.behavior_tree.nodes.length>0);
  assert.ok(c.compilation_root);
});

test('behavior binding keeps stable program identity',()=>{
  const b=createBehaviorBinding(sample(),{sceneId:'scene:test'});
  assert.equal(b.program_id,'behavior:frost-trial');
  assert.equal(b.scene_id,'scene:test');
  assert.equal(b.status,'ready');
});

test('graph builders expose rules states and tree nodes',()=>{
  const p=sample();
  assert.ok(createRuleGraph(p).edges.length>=p.rules.length);
  assert.ok(createStateMachineGraph(p).nodes.some(x=>x.initial));
  assert.ok(createBehaviorTreeGraph(p).nodes.some(x=>x.type==='selector'||x.type==='sequence'));
});

test('session can step pause and inspect runtime',()=>{
  const s=new BehaviorEditorSession(sample());
  const a=s.step({move_right:true});
  assert.equal(a.runtime.tick,1);
  assert.equal(a.status,'paused');
  assert.ok(a.runtime.state_root);
});

test('snapshot restore returns to exact state root',()=>{
  const s=new BehaviorEditorSession(sample());
  for(let i=0;i<20;i++)s.step({move_right:true});
  const snap=s.createSnapshot('checkpoint');
  const root=s.runtime.stateRoot();
  for(let i=0;i<10;i++)s.step({move_right:true});
  s.restoreSnapshot(snap.id);
  assert.equal(s.runtime.stateRoot(),root);
});

test('hot reload preserves tick and entity variables',()=>{
  const s=new BehaviorEditorSession(sample());
  for(let i=0;i<15;i++)s.step({move_right:true});
  const tick=s.runtime.state.tick,x=s.runtime.state.entities.player.variables.x;
  const raw=structuredClone(sample());delete raw.program_root;raw.identity.version='0.1.1';raw.globals.message='热更新完成';
  s.replaceProgram(raw,{preserveState:true});
  assert.equal(s.runtime.state.tick,tick);
  assert.equal(s.runtime.state.entities.player.variables.x,x);
  assert.equal(s.runtime.state.hot_reload_count,1);
});

test('patch undo and redo maintain authoring history',()=>{
  const s=new BehaviorEditorSession(sample());
  const old=s.program.identity.title;
  s.patch([{op:'set',path:'identity.title',value:'行为编辑测试'}]);
  assert.equal(s.program.identity.title,'行为编辑测试');
  s.undo();assert.equal(s.program.identity.title,old);
  s.redo();assert.equal(s.program.identity.title,'行为编辑测试');
});

test('breakpoint pauses on matching trace event',()=>{
  const s=new BehaviorEditorSession(sample());
  s.addBreakpoint('machine.transition');
  s.step({move_right:true});
  assert.equal(s.runtime.paused,true);
  assert.ok(s.runtime.traceEntries.some(x=>x.breakpoint));
});

test('complete sample can win through behavior session',()=>{
  const s=new BehaviorEditorSession(sample());
  while(s.runtime.state.tick<500&&!s.runtime.state.globals.victory){s.runtime.resume();s.step(autopilot(s));}
  assert.equal(s.runtime.state.globals.victory,true);
  assert.ok(s.runtime.state.globals.score>0);
});

test('export emits RSR VSR Studio Gateway and RFE artifacts',()=>{
  const s=new BehaviorEditorSession(sample());
  for(let i=0;i<5;i++)s.step({move_right:true});
  const x=s.exportArtifacts();
  assert.equal(x.rsr_command_batch.format,'rsr.behavior-command-batch.v0.1');
  assert.equal(x.vsr_player.runtimeTarget,'vsr-v0.2');
  assert.equal(x.studio_import.format,'reality-studio.behavior-import.v0.1');
  assert.equal(x.gateway_manifest.runtime_id,'rncs.behavior');
  assert.equal(x.causal_delta.format,'rfe.behavior-causal-delta.v0.1');
});
