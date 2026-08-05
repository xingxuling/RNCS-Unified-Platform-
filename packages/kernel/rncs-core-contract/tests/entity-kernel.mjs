import test from 'node:test';
import assert from 'node:assert/strict';
import {EntityKernel,verifyEntityStateBatch} from '../src/index.mjs';

const root='0'.repeat(64);

function createKernel(){
  const kernel=new EntityKernel({worldId:'world:kernel-test',generationRoot:root});
  kernel.registerFragment({fragment_id:'transform',fields:{x:{type:'decimal',default:'0.0'},y:{type:'decimal',default:'0.0'},active:{type:'boolean',default:true}}});
  kernel.registerFragment({fragment_id:'health',fields:{value:{type:'integer',default:100}}});
  kernel.registerEntity({entityId:'subject:red',tags:['player'],fragments:{transform:{x:'1.0',y:'2.0'},health:{}}});
  return kernel;
}

test('typed fragments form a deterministic composition and state batch',()=>{
  const kernel=createKernel();
  const entity=kernel.getEntity('subject:red');
  assert.equal(entity.composition.fragment_ids.join(','),'health,transform');
  const batch=kernel.readStateBatch({tags:['player']});
  assert.deepEqual(batch.entity_ids,['subject:red']);
  assert.equal(batch.rows[0].fragments.transform.x,'1.0');
  assert.equal(batch.state_root,kernel.stateRoot());
  assert.match(batch.batch_root,/^[0-9a-f]{64}$/);
});

test('deferred mutations remain pending until an authority commit',()=>{
  const kernel=createKernel();
  const before=kernel.getEntity('subject:red').entity_root;
  kernel.deferMutation({entityId:'subject:red',fragmentId:'transform',field:'x',value:'3.25',expectedEntityRoot:before});
  kernel.deferMutation({entityId:'subject:red',fragmentId:'health',field:'value',operation:'add',value:5});
  assert.equal(kernel.getEntity('subject:red').fragments.transform.x,'1.0');
  const batch=kernel.commitMutations({tick:1,authority:'simulation'});
  assert.equal(kernel.getEntity('subject:red').fragments.transform.x,'3.25');
  assert.equal(kernel.getEntity('subject:red').fragments.health.value,105);
  assert.equal(kernel.pendingMutations().length,0);
  assert.equal(batch.tick,1);
  assert.equal(batch.state_root,kernel.stateRoot());
});

test('same inputs produce the same state and mutation roots',()=>{
  const first=createKernel(),second=createKernel();
  for(const kernel of [first,second]){
    kernel.deferMutation({entityId:'subject:red',fragmentId:'transform',field:'x',value:'4.5'});
    kernel.deferMutation({entityId:'subject:red',fragmentId:'health',field:'value',operation:'add',value:2});
  }
  const a=first.commitMutations({tick:2}),b=second.commitMutations({tick:2});
  assert.equal(a.mutation_root,b.mutation_root);
  assert.equal(a.state_root,b.state_root);
  assert.equal(a.batch_root,b.batch_root);
});

test('stale expected entity roots reject the whole mutation batch',()=>{
  const kernel=createKernel();
  const expected=kernel.getEntity('subject:red').entity_root;
  kernel.deferMutation({entityId:'subject:red',fragmentId:'transform',field:'x',value:'5.0',expectedEntityRoot:expected});
  kernel.deferMutation({entityId:'subject:red',fragmentId:'transform',field:'y',value:'6.0',expectedEntityRoot:expected});
  assert.throws(()=>kernel.commitMutations({tick:1}),/MUTATION_EXPECTED_ROOT_MISMATCH/);
  assert.equal(kernel.getEntity('subject:red').fragments.transform.x,'1.0');
  assert.equal(kernel.pendingMutations().length,2);
});

test('canonical decimal fields reject binary floating point values',()=>{
  const kernel=createKernel();
  assert.throws(()=>kernel.deferMutation({entityId:'subject:red',fragmentId:'transform',field:'x',value:1.25}),/FRAGMENT_VALUE_INVALID/);
});
test('state batch verification rejects tampered rows',()=>{
  const batch=createKernel().readStateBatch();
  assert.equal(verifyEntityStateBatch(batch),true);
  const tampered=structuredClone(batch);tampered.rows[0].tags.push('tampered');
  assert.equal(verifyEntityStateBatch(tampered),false);
});
