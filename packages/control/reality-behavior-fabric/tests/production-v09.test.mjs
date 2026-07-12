import test from 'node:test';import assert from 'node:assert/strict';
import {QuestRuntime,CooperativeTaskRuntime,runDeterministicReplay,normalizeProgram} from '../src/index.mjs';

test('quest runtime advances deterministic multi-stage objectives and restores snapshot',()=>{
 const q=new QuestRuntime([{quest_id:'quest:island',stages:[{objectives:[{objective_id:'meet',event:'npc.met',target:1}]},{objectives:[{objective_id:'switches',event:'switch.pressed',target:2}]}]}]);
 const started=q.start('quest:island',{participants:['red','blue']});q.apply('npc.met');const snap=q.snapshot();q.apply('switch.pressed');q.apply('switch.pressed');
 assert.equal(q.snapshot().instances[0].status,'completed');const restored=q.restore(snap);assert.equal(restored.instances[0].stage_index,1);assert.equal(restored.instances[0].status,'active');assert.ok(started.instance_id);
});

test('cooperative task requires distinct participants',()=>{const task=new CooperativeTaskRuntime({taskId:'gate',participants:['blue','red'],requirements:[{signal:'plate',minimum_participants:2}]});task.signal({participant_id:'blue',signal:'plate'});assert.equal(task.snapshot().status,'active');task.signal({participant_id:'red',signal:'plate'});assert.equal(task.snapshot().status,'completed');});

test('replay receipt proves identical behavior roots',()=>{const program=normalizeProgram({identity:{program_id:'replay',title:'Replay'},tick_rate:30,seed:7,globals:{count:0},entities:[],prefabs:[],state_machines:[],behavior_trees:[],capabilities:[],rules:[{rule_id:'tick',event:'tick',actions:[{type:'add',target:'globals.count',value:1}]}]});const receipt=runDeterministicReplay(program,[{},{},{}]);assert.equal(receipt.deterministic,true);assert.equal(receipt.first.final_root,receipt.second.final_root);assert.equal(receipt.first.tick,3);});
