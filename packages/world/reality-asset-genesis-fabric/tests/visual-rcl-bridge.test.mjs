import test from 'node:test';
import assert from 'node:assert/strict';
import {createVisualIR} from '../src/visual-ir.mjs';
import {createAssetProviderManifest} from '../src/asset-provider-contract.mjs';
import {createVisualCapabilityProfile} from '../src/visual-capability-profile.mjs';
import {planVisualFactory} from '../src/visual-factory.mjs';
import {executeVisualFactoryRCL} from '../src/visual-rcl-bridge.mjs';
const setup=(operations=['rendering'])=>{
  const ir=createVisualIR({character_id:'fixture',identity_root:'a'.repeat(64),representation_kind:'layered-2d',provenance:{seed:'1',generator:'local',version:'1'}});
  const manifest=createAssetProviderManifest({id:'local',version:'1',capabilities:['render'],inputFormats:[ir.format],outputFormats:[ir.format],representation:{kinds:[ir.representation_kind]}});
  const profile=createVisualCapabilityProfile(manifest,{operations:[{operation:'rendering',capability_id:'render',input_formats:[ir.format],output_formats:[ir.format],representation_kinds:[ir.representation_kind],deterministic:true}]});
  return planVisualFactory(ir,[{manifest,profile}],operations);
};
test('RCL parses and executes governed visual host call and binds result',async()=>{
  const plan=setup();let calls=0;
  const result=await executeVisualFactoryRCL(plan,{local:({input})=>{calls++;return {ir:input,artifacts:[]};}},{policy:{subjects:{builder:['visual.execute@visual','visual.factory@visual']}}});
  assert.equal(result.status,'LOCAL_CANDIDATE_EXECUTED');
  assert.equal(calls,2);assert.equal(result.plan_root,plan.plan_root);
  assert.equal(result.provider_receipts[0].status,'succeeded');
  assert.equal(result.factory_result.commit_status,'NOT_COMMITTED');
});
test('missing RCL policy blocks execution before adapter',async()=>{
  let calls=0;
  await assert.rejects(executeVisualFactoryRCL(setup(),{local:()=>{calls++;}}),error=>error.code==='RCL_PROVIDER_V2_AUTHORITY_DENIED');
  assert.equal(calls,0);
});
test('outer RCL timeout cancels replay and prevents later stages',async()=>{
  const calls=[],signals=[];
  await assert.rejects(executeVisualFactoryRCL(setup(['rendering','rendering']),{local:async({input,job},{signal})=>{
    calls.push(job.request.stage);signals.push(signal);
    await new Promise(resolve=>setTimeout(resolve,60));
    return {ir:input,artifacts:[]};
  }},{timeoutMs:100,policy:{subjects:{builder:['visual.execute@visual','visual.factory@visual']}}}),error=>error.code==='RCL_PROVIDER_V2_TIMEOUT');
  await new Promise(resolve=>setTimeout(resolve,150));
  assert.ok(calls.length>0&&calls.every(stage=>stage===0));
  assert.ok(signals.some(signal=>signal.aborted));
});
