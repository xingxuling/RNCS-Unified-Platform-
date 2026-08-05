import test from 'node:test';
import assert from 'node:assert/strict';
import {BehaviorRuntime,RealityScheduler,normalizeProgram} from '../src/index.mjs';
import {rootHash} from '../src/canonical.mjs';
import {loadProgram} from './helpers.mjs';

test('scheduler compiles deterministic prerequisite order and graph root',()=>{
  const make=()=>{
    const scheduler=new RealityScheduler({authorityLevel:'simulation'});
    scheduler.registerTask({task_id:'physics.integrate',reads:['physics.input'],writes:['physics.state'],priority:10},()=>({operations:1}));
    scheduler.registerTask({task_id:'presentation.prepare',reads:['physics.state'],writes:['presentation.frame'],prerequisites:['physics.integrate'],priority:1},()=>({operations:1}));
    return scheduler.compile();
  };
  const first=make(),second=make();
  assert.deepEqual(first.order,['physics.integrate','presentation.prepare']);
  assert.equal(first.graph_root,second.graph_root);
});

test('scheduler rejects un-ordered write hazards',()=>{
  const scheduler=new RealityScheduler();
  scheduler.registerTask({task_id:'a',writes:['world.state']},()=>({}));
  scheduler.registerTask({task_id:'b',writes:['world.state']},()=>({}));
  assert.throws(()=>scheduler.compile(),/TASK_RESOURCE_ORDER_REQUIRED/);
});

test('scheduler blocks tasks above the current authority level',()=>{
  const scheduler=new RealityScheduler({authorityLevel:'simulation'});
  scheduler.registerTask({task_id:'commit',authority:'authority'},()=>({operations:1}));
  const receipt=scheduler.run({tick:1});
  assert.equal(receipt.status,'blocked');
  assert.equal(receipt.receipts[0].reason,'AUTHORITY_INSUFFICIENT');
});

test('scheduler rolls back state when required evidence is missing',()=>{
  const state={value:0};
  const scheduler=new RealityScheduler({snapshot:()=>structuredClone(state),restore:snapshot=>Object.assign(state,snapshot),stateRoot:()=>rootHash(state)});
  scheduler.registerTask({task_id:'state.write',writes:['world.value'],rollback:'snapshot',evidence:{policy:'required',required:['state-root']}},()=>{state.value=7;return{operations:1,evidence:[]};});
  const receipt=scheduler.run({tick:1});
  assert.equal(receipt.status,'failed');
  assert.equal(receipt.receipts[0].rolled_back,true);
  assert.equal(state.value,0);
});

test('BehaviorRuntime can execute one tick through the evidence-aware scheduler',()=>{
  const runtime=new BehaviorRuntime(loadProgram());
  const receipt=runtime.tickScheduled({move_right:true});
  assert.equal(receipt.status,'completed');
  assert.equal(receipt.receipts[0].status,'executed');
  assert.equal(receipt.receipts[0].evidence_root.length,64);
  assert.equal(runtime.state.tick,1);
});

test('scheduler rejects a handler write outside its declared write set',()=>{
  const scheduler=new RealityScheduler();
  scheduler.registerTask({task_id:'bad',writes:['declared']},()=>({writes:['undeclared']}));
  const receipt=scheduler.run({tick:1});
  assert.equal(receipt.status,'failed');
  assert.match(receipt.receipts[0].error.message,/TASK_WRITE_SET_VIOLATION/);
});

test('BehaviorRuntime scheduled path retains deterministic roots',()=>{
  const program=normalizeProgram({identity:{program_id:'scheduled',title:'Scheduled'},tick_rate:30,seed:'scheduled',globals:{count:0},entities:[],prefabs:[],state_machines:[],behavior_trees:[],capabilities:[],rules:[{rule_id:'tick',event:'tick',actions:[{type:'add',target:'globals.count',value:1}]}]});
  const first=new BehaviorRuntime(program),second=new BehaviorRuntime(program);
  first.tickScheduled({});second.tickScheduled({});
  assert.equal(first.stateRoot(),second.stateRoot());
});
