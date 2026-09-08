import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createVisualIR} from '../src/visual-ir.mjs';
import {createAssetProviderManifest} from '../src/asset-provider-contract.mjs';
import {createVisualCapabilityProfile, validateVisualCapabilityProfile, VISUAL_OPERATIONS} from '../src/visual-capability-profile.mjs';
import {planVisualFactory, executeVisualFactory} from '../src/visual-factory.mjs';
import {seal} from '../src/canonical.mjs';

const input = () => createVisualIR({character_id:'actor:one',identity_root:'a'.repeat(64),representation_kind:'character-mesh',geometry:{vertices:[[0,0,0],[1,0,0],[0,1,0]],triangles:[[0,1,2]],material_ids:['skin']},materials:[{id:'skin'}],provenance:{seed:'42',generator:'fixture',version:'1'}});
const provider = (id='local:reference') => {
  const manifest = createAssetProviderManifest({id,version:'1',capabilities:VISUAL_OPERATIONS.map(v=>'visual.'+v),inputFormats:['ragf.visual-ir.v0.1'],outputFormats:['ragf.visual-ir.v0.1'],representation:{kinds:['character-mesh']},license:'Apache-2.0'});
  return {manifest,profile:createVisualCapabilityProfile(manifest,{operations:VISUAL_OPERATIONS.map(operation=>({operation,capability_id:'visual.'+operation,input_formats:manifest.inputFormats,output_formats:manifest.outputFormats,representation_kinds:['character-mesh'],deterministic:true}))})};
};
// Real local byte production, deliberately a fixture rather than a model/rendering claim.
const adapter = ({input,operation}) => {
  const bytes = Buffer.from(JSON.stringify({character:input.character_id,operation,seed:input.provenance.seed}));
  return {ir:createVisualIR({...input,provenance:{seed:input.provenance.seed,generator:'local:reference',version:'1'},artifacts:[{id:'output',sha256:createHash('sha256').update(bytes).digest('hex'),byte_length:bytes.length}]}),artifacts:[{id:'output',bytes}]};
};
test('six operations execute and replay, retaining candidate authority and deterministic roots', async()=>{
  const plan=planVisualFactory(input(),[provider()],VISUAL_OPERATIONS);
  const result=await executeVisualFactory(plan,{'local:reference':adapter});
  assert.equal(result.status,'LOCAL_CANDIDATE_EXECUTED');
  assert.equal(result.receipts.length,6);
  assert.ok(result.receipts.every(r=>r.job.state==='COMPLETED'&&r.reproducibility==='LOCAL_REPLAY_MATCH'));
  assert.equal(result.commit_status,'NOT_COMMITTED');
  assert.equal(result.visual_acceptance,'NOT_EVALUATED');
  assert.equal(result.result_root,(await executeVisualFactory(plan,{'local:reference':adapter})).result_root);
});
test('selection is order-independent and capability gaps reject before execution',()=>{
  const a=provider(),b=provider('z:other');
  assert.equal(planVisualFactory(input(),[a,b],['modeling']).plan_root,planVisualFactory(input(),[b,a],['modeling']).plan_root);
  assert.throws(()=>planVisualFactory(input(),[a,a],['modeling']),/DUPLICATE/);
  const p=provider();p.profile=createVisualCapabilityProfile(p.manifest,{operations:p.profile.operations.slice(1)});
  assert.throws(()=>planVisualFactory(input(),[p],['modeling']),/CAPABILITY_GAP/);
});
test('profile rejects undeclared capability, authority tampering and stale manifest',()=>{
  const p=provider();
  assert.throws(()=>createVisualCapabilityProfile(p.manifest,{operations:[{...p.profile.operations[0],capability_id:'invented'}]}),/UNDECLARED/);
  assert.equal(validateVisualCapabilityProfile(seal({...p.profile,candidate_only:false},'profile_root'),p.manifest).valid,false);
  assert.equal(validateVisualCapabilityProfile(p.profile,provider('different').manifest).valid,false);
  assert.equal(validateVisualCapabilityProfile(null,null).valid,false);
});
test('tampered and resealed invalid plans do not dispatch',async()=>{
  const plan=planVisualFactory(input(),[provider()],['modeling']);
  await assert.rejects(executeVisualFactory({...plan,candidate_only:false},{}),/PLAN_ROOT/);
  await assert.rejects(executeVisualFactory(seal({...plan,stages:[]},'plan_root'),{}),/PLAN_INVALID/);
});
test('identity drift and byte corruption fail closed before later stages',async()=>{
  const plan=planVisualFactory(input(),[provider()],['modeling','rendering']);
  for(const corrupt of [r=>{r.ir=createVisualIR({...r.ir,identity_root:'b'.repeat(64)});},r=>{r.artifacts[0].bytes=Buffer.from('corrupt');}]) {
    let calls=0;
    const result=await executeVisualFactory(plan,{'local:reference':q=>{calls++;const r=adapter(q);corrupt(r);return r;}});
    assert.equal(result.status,'FAILED'); assert.equal(calls,1); assert.equal(result.receipts[0].job.state,'FAILED');
  }
});
test('replay detects valid but nondeterministic output; absent and timeout adapters fail',async()=>{
  const plan=planVisualFactory(input(),[provider()],['modeling']);
  let n=0;
  const result=await executeVisualFactory(plan,{'local:reference':q=>{const r=adapter(q);r.ir=createVisualIR({...r.ir,materials:[{id:'skin',variation:n++}]});return r;}});
  assert.equal(result.error,'VISUAL_REPLAY_MISMATCH');
  assert.equal((await executeVisualFactory(plan,{})).error,'VISUAL_ADAPTER_UNAVAILABLE');
  assert.equal((await executeVisualFactory(plan,{'local:reference':()=>new Promise(()=>{})},{timeoutMs:5})).error,'VISUAL_PROVIDER_TIMEOUT');
  const once=await executeVisualFactory(plan,{'local:reference':adapter},{replay:false});
  assert.equal(once.receipts[0].reproducibility,'NOT_RUN');
});
test('adapter-owned results cannot mutate previous replay evidence',async()=>{
  const plan=planVisualFactory(input(),[provider()],['modeling']);
  let shared;
  const result=await executeVisualFactory(plan,{'local:reference':q=>{
    if(!shared) shared=adapter(q);
    else shared.ir=createVisualIR({...shared.ir,materials:[{id:'skin',variation:2}]});
    return shared;
  }});
  assert.equal(result.error,'VISUAL_REPLAY_MISMATCH');
});
test('caller mutation is isolated and repeated operations have distinct job IDs',async()=>{
  const plan=planVisualFactory(input(),[provider()],['modeling','modeling']);
  const originalRoot=plan.plan_root;
  const adapters={'local:reference':q=>{
    plan.input.identity_root='b'.repeat(64);plan.plan_root='c'.repeat(64);plan.stages.length=0;
    adapters['local:reference']=()=>{throw new Error('replacement');};
    return adapter(q);
  }};
  const result=await executeVisualFactory(plan,adapters);
  assert.equal(result.status,'LOCAL_CANDIDATE_EXECUTED');
  assert.equal(result.plan_root,originalRoot);
  assert.equal(result.receipts.length,2);
  assert.notEqual(result.receipts[0].job.job_id,result.receipts[1].job.job_id);
});
test('already aborted caller does not dispatch an adapter',async()=>{
  const controller=new AbortController();controller.abort();let calls=0;
  const result=await executeVisualFactory(planVisualFactory(input(),[provider()],['rendering']),{'local:reference':()=>{calls++;}},{signal:controller.signal});
  assert.equal(result.error,'VISUAL_EXECUTION_ABORTED');assert.equal(calls,0);
});
