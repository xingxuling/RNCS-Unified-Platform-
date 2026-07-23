import test from 'node:test';import assert from 'node:assert/strict';import path from 'node:path';import fs from 'node:fs';import os from 'node:os';
import * as core from '@taowind/rncs-core-contract';import * as rfe from '@taowind/rfe-core-sdk';import * as laf from '@taowind/living-artifact-format';import * as rbf from '@taowind/reality-branch-fabric';import * as behavior from '@taowind/reality-behavior-fabric';import {RealityOneGateway} from '@taowind/reality-one-gateway';
const ZERO='0'.repeat(64);
test('workspace packages resolve without embedded vendor copies',()=>{assert.equal(typeof core.newProposal,'function');assert.equal(typeof rfe.RealityStore,'function');assert.equal(typeof laf.validateArtifact,'function');assert.equal(typeof rbf.createWorkspace,'function');assert.equal(typeof behavior.BehaviorRuntime,'function');});
test('Gateway discovers and loads unified control plane',async()=>{const root=path.resolve('.');const data=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-unified-'));const g=new RealityOneGateway({manifestDirs:[path.join(root,'packages/control/reality-one-gateway/runtimes')],dataDir:data});const reg=await g.discover();assert.ok(reg.runtime_order.includes('rncs.rbf'));assert.ok(reg.runtime_order.includes('rncs.behavior'));assert.ok(reg.runtime_order.includes('rncs.core'));assert.ok(reg.runtime_order.includes('rncs.aetherworld-native'));assert.ok(reg.runtime_order.includes('rncs.rcl-foundation-native'));const health=await g.health();assert.equal(health.status,'healthy');assert.equal(health.runtimes.length,reg.runtime_order.length);assert.ok(health.runtimes.some(x=>x.runtime_id==='rncs.rcl-foundation-native'&&x.status==='healthy'));});
test('Gateway exposes Foundation Native as a proposal-only RNCS transition', {timeout:300000}, async()=>{const root=path.resolve('.');const data=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-foundation-native-'));const g=new RealityOneGateway({manifestDirs:[path.join(root,'packages/control/reality-one-gateway/runtimes')],dataDir:data});const transition=await g.invoke('rncs.rcl-foundation-native','prepare',{request:{authorized:true,aifDecision:'stable',input:{speechAct:'inspect',utterance:'Inspect one bounded world candidate through the unified runtime plane.'},evidence:[{type:'gateway-integration-test',id:'foundation-native-proposal'}]}});assert.equal(transition.status,'proposed');assert.equal(transition.envelope.phase,'proposed');assert.equal(transition.execution.results.length,6);const verification=await g.invoke('rncs.rcl-foundation-native','verify',{transition});assert.equal(verification.ok,true);});
test('Gateway commits Meta Batch B through separate authority calls', {timeout:300000}, async()=>{
 const root=path.resolve('.');
 const data=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-foundation-meta-'));
 const g=new RealityOneGateway({
  manifestDirs:[path.join(root,'packages/control/reality-one-gateway/runtimes')],
  dataDir:data,
 });
 const prepared=await g.invoke('rncs.rcl-foundation-native','prepare',{
  batch:'meta-batch-b',
  request:{
   authorized:true,
   aifDecision:'stable',
   input:{
    speechAct:'create',
    timeline:{tick:9,observerFrame:'objective-bounded',eventCount:3},
    acceleration:{requestedFactor:16,fidelityFloor:0.95},
    compression:{codec:'content-addressed',restoreRequired:true},
   },
   evidence:[{type:'gateway-integration-test',id:'foundation-native-meta'}],
  },
 });
 assert.equal(prepared.status,'proposed');
 assert.equal(prepared.execution.providerHost.providerId,'rcl.foundation.meta-batch-b');
 assert.equal(prepared.envelope.provisional_delta.operations[0].semantic_parameters.timeline.tickAfter,12);
 assert.equal(prepared.envelope.provisional_delta.operations[1].semantic_parameters.acceleration.effectiveFactor,8);
 assert.equal(prepared.envelope.provisional_delta.operations[2].semantic_parameters.compression.restoreVerified,true);
 const authorized=await g.invoke('rncs.rcl-foundation-native','authorize',{
  prepared,
  approval:{approved:true,roles:['owner'],resolver:'gateway-meta-owner'},
 });
 const committed=await g.invoke('rncs.rcl-foundation-native','commit',{
  authorized,
  confirmation:{confirmed:true},
 });
 const verification=await g.invoke('rncs.rcl-foundation-native','verify',{
  transition:committed,
 });
 assert.equal(verification.ok,true);
 assert.equal(verification.batch,'meta-batch-b');
 assert.equal(committed.envelope.phase,'committed');
 assert.equal(
  committed.envelope.commit.result_generation.generation_root,
  committed.execution.finalStateRoot,
 );
});
test('RBF is callable through Gateway',async()=>{const root=path.resolve('.');const data=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-rbf-'));const g=new RealityOneGateway({manifestDirs:[path.join(root,'packages/control/reality-one-gateway/runtimes')],dataDir:data});const ws=await g.invoke('rncs.rbf','createWorkspace',{reality_id:'reality:test',base_generation_root:ZERO,project_root:ZERO,base_state:{progress:0},branches:[{branch_id:'branch:safe',parent_branch_id:'branch:main',operations:[{op:'set',path:'progress',value:1}]}]});const v=await g.invoke('rncs.rbf','validateWorkspace',{workspace:ws});assert.equal(v.valid,true);});
test('Behavior program is callable through Gateway',async()=>{const root=path.resolve('.');const data=fs.mkdtempSync(path.join(os.tmpdir(),'rncs-behavior-'));const g=new RealityOneGateway({manifestDirs:[path.join(root,'packages/control/reality-one-gateway/runtimes')],dataDir:data});const program=await g.invoke('rncs.behavior','normalize',{program:{identity:{program_id:'program:test',title:'测试'},tick_rate:60,entities:[],state_machines:[],behavior_trees:[],rules:[],capabilities:[]}});const v=await g.invoke('rncs.behavior','validate',{program});assert.equal(v.valid,true);});
